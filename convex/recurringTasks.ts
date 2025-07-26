import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all recurring task templates (parent tasks)
export const listRecurringTemplates = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("todos"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    userId: v.id("users"),
    tagIds: v.optional(v.array(v.id("tags"))),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.object({
      type: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
        v.literal("custom")
      ),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
      paused: v.optional(v.boolean()),
    })),
    parentTodoId: v.optional(v.id("todos")),
    originalDueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    instanceCount: v.number(), // computed field
    completedInstances: v.number(), // computed field
    nextDueDate: v.optional(v.number()), // computed field
  })),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all recurring parent tasks (templates)
    const recurringTemplates = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.and(
        q.eq(q.field("isRecurring"), true),
        q.eq(q.field("parentTodoId"), undefined)
      ))
      .collect();

    // For each template, get instance statistics
    const templatesWithStats = await Promise.all(
      recurringTemplates.map(async (template) => {
        const instances = await ctx.db
          .query("todos")
          .withIndex("by_parent", (q) => q.eq("parentTodoId", template._id))
          .collect();

        const completedInstances = instances.filter(instance => instance.completed).length;
        
        // Find next due date from incomplete instances
        const incompleteInstances = instances
          .filter(instance => !instance.completed && instance.dueDate)
          .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
        
        const nextDueDate = incompleteInstances.length > 0 ? incompleteInstances[0].dueDate : undefined;

        return {
          ...template,
          instanceCount: instances.length,
          completedInstances,
          nextDueDate,
        };
      })
    );

    return templatesWithStats;
  },
});

// Get instances of a specific recurring task
export const getRecurringTaskInstances = query({
  args: {
    templateId: v.id("todos"),
  },
  returns: v.array(v.object({
    _id: v.id("todos"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    userId: v.id("users"),
    tagIds: v.optional(v.array(v.id("tags"))),
    isRecurring: v.optional(v.boolean()),
    recurringPattern: v.optional(v.object({
      type: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
        v.literal("custom")
      ),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
      paused: v.optional(v.boolean()),
    })),
    parentTodoId: v.optional(v.id("todos")),
    originalDueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify the template belongs to the user
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId || !template.isRecurring || template.parentTodoId) {
      throw new Error("Recurring task template not found or unauthorized");
    }

    const instances = await ctx.db
      .query("todos")
      .withIndex("by_parent", (q) => q.eq("parentTodoId", args.templateId))
      .collect();

    return instances.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  },
});

// Update a recurring task template with proper pattern handling
export const updateRecurringTemplate = mutation({
  args: {
    id: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueTime: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    tagIds: v.optional(v.array(v.id("tags"))),
    recurringPattern: v.optional(v.object({
      type: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
        v.literal("custom")
      ),
      interval: v.number(),
      daysOfWeek: v.optional(v.array(v.number())),
      dayOfMonth: v.optional(v.number()),
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
    })),
    updateFutureInstances: v.optional(v.boolean()),
    regenerateInstances: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, updateFutureInstances, regenerateInstances, ...updates } = args;
    const template = await ctx.db.get(id);
    
    if (!template || template.userId !== userId || !template.isRecurring || template.parentTodoId) {
      throw new Error("Recurring task template not found or unauthorized");
    }

    // Check if recurring pattern has changed
    const patternChanged = updates.recurringPattern && 
      JSON.stringify(template.recurringPattern) !== JSON.stringify(updates.recurringPattern);

    // Update the template
    await ctx.db.patch(id, updates);

    // Get all existing instances
    const instances = await ctx.db
      .query("todos")
      .withIndex("by_parent", (q) => q.eq("parentTodoId", id))
      .collect();

    const now = Date.now();
    const futureInstances = instances.filter(instance => 
      !instance.completed && (instance.dueDate || 0) > now
    );
    const pastInstances = instances.filter(instance => 
      instance.completed || (instance.dueDate || 0) <= now
    );

    // Handle pattern changes
    if (patternChanged && regenerateInstances) {
      // Delete all future instances when pattern changes
      for (const instance of futureInstances) {
        await ctx.db.delete(instance._id);
      }

      // Generate new instances with the updated pattern
      if (updates.recurringPattern && template.dueDate) {
        const updatedTemplate = await ctx.db.get(id);
        if (updatedTemplate) {
          // Find the next occurrence after the last completed/past instance
          const lastInstanceDate = pastInstances.length > 0 
            ? Math.max(...pastInstances.map(i => i.dueDate || template.dueDate!))
            : template.dueDate!;
          
          await generateRecurringInstances(
            ctx, 
            id, 
            lastInstanceDate, 
            updatedTemplate.recurringPattern!, 
            userId,
            50 // Generate up to 50 future instances
          );
        }
      }
    } else if (updateFutureInstances && !patternChanged) {
      // Update existing future instances without changing pattern
      for (const instance of futureInstances) {
        const instanceUpdates: any = {};
        if (updates.title) instanceUpdates.title = updates.title;
        if (updates.description !== undefined) instanceUpdates.description = updates.description;
        if (updates.priority) instanceUpdates.priority = updates.priority;
        if (updates.dueTime !== undefined) instanceUpdates.dueTime = updates.dueTime;
        if (updates.projectId !== undefined) instanceUpdates.projectId = updates.projectId;
        if (updates.tagIds !== undefined) instanceUpdates.tagIds = updates.tagIds;

        if (Object.keys(instanceUpdates).length > 0) {
          await ctx.db.patch(instance._id, instanceUpdates);
        }
      }
    }

    return null;
  },
});

// Delete a recurring task template and all its instances
export const deleteRecurringTemplate = mutation({
  args: {
    id: v.id("todos"),
    deleteAllInstances: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId || !template.isRecurring || template.parentTodoId) {
      throw new Error("Recurring task template not found or unauthorized");
    }

    // Get all instances
    const instances = await ctx.db
      .query("todos")
      .withIndex("by_parent", (q) => q.eq("parentTodoId", args.id))
      .collect();

    if (args.deleteAllInstances) {
      // Delete all instances
      for (const instance of instances) {
        await ctx.db.delete(instance._id);
      }
    } else {
      // Only delete future incomplete instances
      const futureInstances = instances.filter(instance => 
        !instance.completed && (instance.dueDate || 0) > Date.now()
      );

      for (const instance of futureInstances) {
        await ctx.db.delete(instance._id);
      }

      // Update completed/past instances to remove parent reference
      const pastInstances = instances.filter(instance => 
        instance.completed || (instance.dueDate || 0) <= Date.now()
      );

      for (const instance of pastInstances) {
        await ctx.db.patch(instance._id, { 
          parentTodoId: undefined,
          isRecurring: false,
        });
      }
    }

    // Delete the template
    await ctx.db.delete(args.id);
    return null;
  },
});

// Pause/Resume recurring task (stops generating new instances)
export const toggleRecurringTaskStatus = mutation({
  args: {
    id: v.id("todos"),
    paused: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId || !template.isRecurring || template.parentTodoId) {
      throw new Error("Recurring task template not found or unauthorized");
    }

    // We'll use a custom field to track paused status
    await ctx.db.patch(args.id, { 
      recurringPattern: template.recurringPattern ? {
        ...template.recurringPattern,
        paused: args.paused,
      } : undefined
    });

    return null;
  },
});

// Generate more instances for a recurring task
export const generateMoreInstances = mutation({
  args: {
    id: v.id("todos"),
    count: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const template = await ctx.db.get(args.id);
    if (!template || template.userId !== userId || !template.isRecurring || template.parentTodoId) {
      throw new Error("Recurring task template not found or unauthorized");
    }

    if (!template.recurringPattern || !template.dueDate) {
      throw new Error("Invalid recurring pattern");
    }

    // Get existing instances to find the last one
    const instances = await ctx.db
      .query("todos")
      .withIndex("by_parent", (q) => q.eq("parentTodoId", args.id))
      .collect();

    const sortedInstances = instances.sort((a, b) => (b.dueDate || 0) - (a.dueDate || 0));
    const lastInstance = sortedInstances[0];
    const startDate = lastInstance ? new Date(lastInstance.dueDate || template.dueDate) : new Date(template.dueDate);

    // Generate additional instances
    const generateCount = args.count || 10;
    await generateRecurringInstances(ctx, args.id, startDate.getTime(), template.recurringPattern, userId, generateCount);

    return null;
  },
});

// Helper function to generate recurring instances (similar to the one in todos.ts but with count parameter)
async function generateRecurringInstances(
  ctx: any,
  parentId: any,
  startDate: number,
  pattern: any,
  userId: any,
  maxCount: number = 10
) {
  const endDate = pattern.endDate || Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year default
  
  let currentDate = new Date(startDate);
  let instanceCount = 0;

  while (instanceCount < maxCount && currentDate.getTime() <= endDate) {
    currentDate = getNextOccurrence(currentDate, pattern);
    if (currentDate.getTime() > endDate) break;

    const parentTodo = await ctx.db.get(parentId);
    if (!parentTodo) break;

    await ctx.db.insert("todos", {
      title: parentTodo.title,
      description: parentTodo.description,
      priority: parentTodo.priority,
      dueDate: currentDate.getTime(),
      dueTime: parentTodo.dueTime,
      projectId: parentTodo.projectId,
      tagIds: parentTodo.tagIds,
      userId,
      completed: false,
      parentTodoId: parentId,
      originalDueDate: currentDate.getTime(),
    });

    instanceCount++;
  }
}

function getNextOccurrence(currentDate: Date, pattern: any): Date {
  const nextDate = new Date(currentDate);

  switch (pattern.type) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + pattern.interval);
      break;
    case "weekly":
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        let daysToAdd = 1;
        while (daysToAdd <= 7) {
          const testDate = new Date(nextDate);
          testDate.setDate(testDate.getDate() + daysToAdd);
          if (pattern.daysOfWeek.includes(testDate.getDay())) {
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            break;
          }
          daysToAdd++;
        }
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
      }
      break;
    case "monthly":
      if (pattern.dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        nextDate.setDate(pattern.dayOfMonth);
      } else {
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
      }
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
      break;
  }

  return nextDate;
}
