import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  projects: defineTable({
    name: v.string(),
    color: v.string(),
    userId: v.id("users"),
    isArchived: v.optional(v.boolean()),
    description: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  tags: defineTable({
    name: v.string(),
    color: v.string(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  todos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.number()),
    dueTime: v.optional(v.string()), // Format: "HH:MM"
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
      interval: v.number(), // every N days/weeks/months
      daysOfWeek: v.optional(v.array(v.number())), // 0-6 for weekly
      dayOfMonth: v.optional(v.number()), // for monthly
      endDate: v.optional(v.number()),
      maxOccurrences: v.optional(v.number()),
    })),
    parentTodoId: v.optional(v.id("todos")), // for recurring instances
    originalDueDate: v.optional(v.number()), // for tracking recurring instances
    completedAt: v.optional(v.number()), // timestamp when completed
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "dueDate"])
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentTodoId"])
    .index("by_user_and_completed", ["userId", "completed"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
