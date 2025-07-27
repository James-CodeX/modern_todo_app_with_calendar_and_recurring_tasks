import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    tagIds: v.optional(v.id("tags")),
    date: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let query = ctx.db.query("todos").withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.projectId) {
      query = ctx.db.query("todos").withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    }

    const todos = await query.collect();
    
    return todos.filter(todo => {
      if (args.completed !== undefined && todo.completed !== args.completed) return false;
      if (args.tagIds && (!todo.tagIds || !todo.tagIds.includes(args.tagIds))) return false;
      
      // Handle "Today" view filtering
      if (args.date) {
        const filterDate = new Date(args.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (todo.dueDate) {
          const todoDate = new Date(todo.dueDate);
          todoDate.setHours(0, 0, 0, 0);
          
          // Show tasks due today or overdue tasks
          return todoDate.getTime() <= today.getTime();
        } else {
          // Show tasks without due dates only when viewing "Today"
          return filterDate.getTime() === today.getTime();
        }
      }
      
      return true;
    });
  },
});

export const getTodosForDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user_and_date", (q) => 
        q.eq("userId", userId).gte("dueDate", args.startDate).lte("dueDate", args.endDate)
      )
      .collect();

    return todos;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
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
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const todoId = await ctx.db.insert("todos", {
      ...args,
      userId,
      completed: false,
    });

    // Generate recurring instances if needed
    if (args.isRecurring && args.recurringPattern && args.dueDate) {
      await generateRecurringInstances(ctx, todoId, args.dueDate, args.recurringPattern, userId);
    }

    return todoId;
  },
});

export const update = mutation({
  args: {
    id: v.id("todos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, completed, ...updates } = args;
    const todo = await ctx.db.get(id);
    
    if (!todo || todo.userId !== userId) {
      throw new Error("Todo not found or unauthorized");
    }

    // If marking as completed, add completion timestamp
    const updateData: any = { ...updates };
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed && !todo.completed) {
        updateData.completedAt = Date.now();
      } else if (!completed && todo.completed) {
        updateData.completedAt = undefined;
      }
    }

    await ctx.db.patch(id, updateData);
  },
});

export const remove = mutation({
  args: { id: v.id("todos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const todo = await ctx.db.get(args.id);
    if (!todo || todo.userId !== userId) {
      throw new Error("Todo not found or unauthorized");
    }

    // If this is a recurring parent, delete all instances
    if (todo.isRecurring && !todo.parentTodoId) {
      const instances = await ctx.db
        .query("todos")
        .withIndex("by_parent", (q) => q.eq("parentTodoId", args.id))
        .collect();
      
      for (const instance of instances) {
        await ctx.db.delete(instance._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});

async function generateRecurringInstances(
  ctx: any,
  parentId: any,
  startDate: number,
  pattern: any,
  userId: any
) {
  const maxInstances = pattern.maxOccurrences || 50; // Limit to prevent infinite generation
  const endDate = pattern.endDate || Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year default
  
  let currentDate = new Date(startDate);
  let instanceCount = 0;

  while (instanceCount < maxInstances && currentDate.getTime() <= endDate) {
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
        // Find next occurrence based on days of week
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
