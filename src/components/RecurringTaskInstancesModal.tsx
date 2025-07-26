import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  XMarkIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";
import { TodoItem } from "./TodoItem";

interface RecurringTaskInstancesModalProps {
  templateId: string;
  onClose: () => void;
}

export function RecurringTaskInstancesModal({ templateId, onClose }: RecurringTaskInstancesModalProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all");

  const instances = useQuery(api.recurringTasks.getRecurringTaskInstances, { 
    templateId: templateId as any 
  }) || [];
  const template = useQuery(api.todos.list, {})?.find(t => t._id === templateId);
  const updateTodo = useMutation(api.todos.update);

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    await updateTodo({ id: todoId as any, completed });
  };

  // Filter instances based on selected filter
  const filteredInstances = instances.filter(instance => {
    const now = Date.now();
    const isOverdue = instance.dueDate && instance.dueDate < now && !instance.completed;
    
    switch (filter) {
      case "pending":
        return !instance.completed;
      case "completed":
        return instance.completed;
      case "overdue":
        return isOverdue;
      case "all":
      default:
        return true;
    }
  });

  // Group instances by status for statistics
  const stats = {
    total: instances.length,
    completed: instances.filter(i => i.completed).length,
    pending: instances.filter(i => !i.completed).length,
    overdue: instances.filter(i => {
      const now = Date.now();
      return i.dueDate && i.dueDate < now && !i.completed;
    }).length,
  };

  const getStatusColor = (instance: any) => {
    if (instance.completed) return "text-green-600 dark:text-green-400";
    if (instance.dueDate && instance.dueDate < Date.now()) return "text-red-600 dark:text-red-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  const getStatusIcon = (instance: any) => {
    if (instance.completed) return CheckCircleIcon;
    if (instance.dueDate && instance.dueDate < Date.now()) return ExclamationTriangleIcon;
    return ClockIcon;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp: number, time?: string) => {
    const date = formatDate(timestamp);
    return time ? `${date} at ${time}` : date;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CalendarDaysIcon className="w-5 h-5 mr-2" />
              Task Instances
            </h2>
            {template && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {template.title}
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Statistics */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.overdue}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-fit">
            {[
              { key: "all", label: "All", count: stats.total },
              { key: "pending", label: "Pending", count: stats.pending },
              { key: "completed", label: "Completed", count: stats.completed },
              { key: "overdue", label: "Overdue", count: stats.overdue },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${
                  filter === tab.key
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-500 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Instances List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredInstances.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No instances found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "all" 
                  ? "No instances have been generated yet."
                  : `No ${filter} instances found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInstances.map((instance) => {
                const StatusIcon = getStatusIcon(instance);
                
                return (
                  <div
                    key={instance._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <TodoItem
                      todo={instance}
                      onToggleComplete={handleToggleComplete}
                    />
                    
                    {/* Additional instance info */}
                    <div className="px-4 pb-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                          <span className="flex items-center">
                            <StatusIcon className={`w-4 h-4 mr-1 ${getStatusColor(instance)}`} />
                            {instance.completed ? "Completed" : 
                             instance.dueDate && instance.dueDate < Date.now() ? "Overdue" : "Pending"}
                          </span>
                          
                          {instance.dueDate && (
                            <span className="flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-1" />
                              Due: {formatDateTime(instance.dueDate, instance.dueTime)}
                            </span>
                          )}
                          
                          {instance.completedAt && (
                            <span className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Completed: {formatDate(instance.completedAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {formatDate(instance._creationTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredInstances.length} of {instances.length} instances
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
