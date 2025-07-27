import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TodoItem } from "./TodoItem";
import { useState } from "react";

interface TodoListProps {
  view: "today" | "upcoming" | "project" | "tag";
  projectId?: string | null;
  tagId?: string | null;
  selectedDate: Date;
}

export function TodoList({ view, projectId, tagId, selectedDate }: TodoListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const getTodosArgs = () => {
    const args: any = {};
    
    if (view === "today") {
      args.date = new Date().setHours(0, 0, 0, 0);
    } else if (view === "project" && projectId) {
      args.projectId = projectId;
    } else if (view === "tag" && tagId) {
      args.tagIds = tagId;
    }
    
    if (filter === "active") args.completed = false;
    if (filter === "completed") args.completed = true;
    
    return args;
  };

  const todos = useQuery(api.todos.list, getTodosArgs()) || [];
  const updateTodo = useMutation(api.todos.update);

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    await updateTodo({ id: todoId as any, completed });
  };

  // Separate todos into different categories for better organization
  const activeTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);
  
  // For Today view, separate overdue vs today's tasks
  let overdueTodos: any[] = [];
  let todayTodos: any[] = [];
  
  if (view === "today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    activeTodos.forEach(todo => {
      if (todo.dueDate) {
        const todoDate = new Date(todo.dueDate);
        todoDate.setHours(0, 0, 0, 0);
        
        if (todoDate.getTime() < today.getTime()) {
          overdueTodos.push(todo);
        } else {
          todayTodos.push(todo);
        }
      } else {
        // Tasks without due dates go to today
        todayTodos.push(todo);
      }
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Today View: Show Overdue and Today tasks separately */}
        {view === "today" && (filter === "all" || filter === "active") ? (
          <>
            {/* Overdue Tasks */}
            {overdueTodos.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Overdue ({overdueTodos.length})
                </h2>
                <div className="space-y-2">
                  {overdueTodos.map((todo) => (
                    <TodoItem
                      key={todo._id}
                      todo={todo}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            {todayTodos.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Today ({todayTodos.length})
                </h2>
                <div className="space-y-2">
                  {todayTodos.map((todo) => (
                    <TodoItem
                      key={todo._id}
                      todo={todo}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Other Views: Show normal Active Tasks */
          (filter === "all" || filter === "active") && activeTodos.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Tasks ({activeTodos.length})
              </h2>
              <div className="space-y-2">
                {activeTodos.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* Completed Todos */}
        {(filter === "all" || filter === "completed") && completedTodos.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Completed Tasks ({completedTodos.length})
            </h2>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {todos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">
              {view === "today" ? "☀️" : "📝"}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {view === "today" ? "All clear for today!" : "No tasks yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {view === "today" 
                ? "You don't have any tasks due today. Great job staying on top of things!"
                : "Create your first task to get started!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
