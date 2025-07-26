import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get analytics data for the current user
 */
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get all todos for the user
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get projects for context
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Calculate basic stats
    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.completed).length;
    const activeTodos = totalTodos - completedTodos;
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // Priority breakdown
    const priorityStats = {
      high: todos.filter(todo => todo.priority === "high").length,
      medium: todos.filter(todo => todo.priority === "medium").length,
      low: todos.filter(todo => todo.priority === "low").length,
    };

    // Project breakdown
    const projectStats = projects.map(project => {
      const projectTodos = todos.filter(todo => todo.projectId === project._id);
      const completedProjectTodos = projectTodos.filter(todo => todo.completed);
      
      return {
        projectId: project._id,
        projectName: project.name,
        projectColor: project.color,
        totalTodos: projectTodos.length,
        completedTodos: completedProjectTodos.length,
        completionRate: projectTodos.length > 0 ? (completedProjectTodos.length / projectTodos.length) * 100 : 0,
      };
    });

    // Weekly completion trend (last 7 days)
    const now = new Date();
    const weeklyTrend = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayCompletions = todos.filter(todo => 
        todo.completedAt && 
        todo.completedAt >= date.getTime() && 
        todo.completedAt < nextDate.getTime()
      ).length;
      
      weeklyTrend.push({
        date: date.toISOString().split('T')[0],
        completions: dayCompletions,
      });
    }

    // Overdue tasks
    const overdueTodos = todos.filter(todo => 
      !todo.completed && 
      todo.dueDate && 
      todo.dueDate < Date.now()
    ).length;

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTodos = todos.filter(todo => 
      todo.dueDate && 
      todo.dueDate >= today.getTime() && 
      todo.dueDate < tomorrow.getTime()
    ).length;

    return {
      totalTodos,
      completedTodos,
      activeTodos,
      completionRate: Math.round(completionRate),
      priorityStats,
      projectStats,
      weeklyTrend,
      overdueTodos,
      todayTodos,
    };
  },
});
