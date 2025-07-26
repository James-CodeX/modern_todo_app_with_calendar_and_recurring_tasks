import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  CheckIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ArrowPathIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface TodoItemProps {
  todo: any;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export function TodoItem({ todo, onToggleComplete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  
  const updateTodo = useMutation(api.todos.update);
  const deleteTodo = useMutation(api.todos.remove);
  const projects = useQuery(api.projects.list) || [];
  const tags = useQuery(api.tags.list) || [];

  const project = projects.find(p => p._id === todo.projectId);
  const todoTags = tags.filter(tag => todo.tagIds?.includes(tag._id));

  const handleSave = async () => {
    if (editTitle.trim()) {
      await updateTodo({ id: todo._id, title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteTodo({ id: todo._id });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "low": return "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  const formatDateTime = (date: number, time?: string) => {
    const dateStr = format(new Date(date), "MMM d");
    return time ? `${dateStr} at ${time}` : dateStr;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-all ${
      todo.completed ? "opacity-75" : ""
    }`}>
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(todo._id, !todo.completed)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-600 dark:hover:border-blue-400"
          }`}
        >
          {todo.completed && <CheckIcon className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditTitle(todo.title);
                  setIsEditing(false);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          ) : (
            <h3
              className={`font-medium ${
                todo.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
              }`}
            >
              {todo.title}
            </h3>
          )}

          {/* Description */}
          {todo.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{todo.description}</p>
          )}

          {/* Meta info */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {/* Priority */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </span>

            {/* Project */}
            {project && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </div>
            )}

            {/* Tags */}
            {todoTags.map((tag) => (
              <span
                key={tag._id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}

            {/* Due Date/Time */}
            {todo.dueDate && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                {todo.dueTime ? (
                  <ClockIcon className="w-3 h-3 mr-1" />
                ) : (
                  <CalendarIcon className="w-3 h-3 mr-1" />
                )}
                {formatDateTime(todo.dueDate, todo.dueTime)}
              </div>
            )}

            {/* Recurring indicator */}
            {todo.isRecurring && (
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <ArrowPathIcon className="w-3 h-3 mr-1" />
                Recurring
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
