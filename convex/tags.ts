import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get all tags for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Create a new tag
 */
export const create = mutation({
  args: {
    name: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if tag with same name already exists
    const existingTag = await ctx.db
      .query("tags")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingTag) {
      throw new Error("Tag with this name already exists");
    }

    return await ctx.db.insert("tags", {
      ...args,
      userId,
    });
  },
});

/**
 * Update an existing tag
 */
export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const tag = await ctx.db.get(id);
    
    if (!tag || tag.userId !== userId) {
      throw new Error("Tag not found or unauthorized");
    }

    await ctx.db.patch(id, updates);
  },
});

/**
 * Delete a tag
 */
export const remove = mutation({
  args: { id: v.id("tags") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.userId !== userId) {
      throw new Error("Tag not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
