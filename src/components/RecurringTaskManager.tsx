import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { EditRecurringTaskModal } from "./EditRecurringTaskModal";
import { RecurringTaskInstancesModal } from "./RecurringTaskInstancesModal";

export function RecurringTaskManager() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInstancesModal, setShowInstancesModal] = useState(false);

  const recurringTasks = useQuery(api.recurringTasks.listRecurringTemplates) || [];
  const updateTemplate = useMutation(api.recurringTasks.updateRecurringTemplate);
  const deleteTemplate = useMutation(api.recurringTasks.deleteRecurringTemplate);
  const toggleStatus = useMutation(api.recurringTasks.toggleRecurringTaskStatus);
  const generateMore = useMutation(api.recurringTasks.generateMoreInstances);

  const handleToggleExpand = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowEditModal(true);
  };

  const handleViewInstances = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowInstancesModal(true);
  };

  const handleDeleteTask = async (taskId: string, deleteAll: boolean = false) => {
    if (confirm(deleteAll ? 
      "Are you sure you want to delete this recurring task and ALL its instances?" :
      "Are you sure you want to delete this recurring task? Past/completed instances will be preserved."
    )) {
      await deleteTemplate({ id: taskId as any, deleteAllInstances: deleteAll });
    }
  };

  const handleToggleStatus = async (taskId: string, currentlyPaused: boolean) => {
    await toggleStatus({ id: taskId as any, paused: !currentlyPaused });
  };

  const handleGenerateMore = async (taskId: string) => {
    await generateMore({ id: taskId as any, count: 10 });
  };

  const formatRecurrencePattern = (pattern: any) => {
    if (!pattern) return "No pattern";
    
    const { type, interval, daysOfWeek, dayOfMonth } = pattern;
    
    switch (type) {
      case "daily":
        return interval === 1 ? "Daily" : `Every ${interval} days`;
      case "weekly":
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const selectedDays = daysOfWeek.map((d: number) => dayNames[d]).join(", ");
          return `Weekly on ${selectedDays}`;
        }
        return interval === 1 ? "Weekly" : `Every ${interval} weeks`;
      case "monthly":
        if (dayOfMonth) {
          return `Monthly on day ${dayOfMonth}`;
        }
        return interval === 1 ? "Monthly" : `Every ${interval} months`;
      case "yearly":
        return interval === 1 ? "Yearly" : `Every ${interval} years`;
      default:
        return "Custom pattern";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 dark:text-red-400";
      case "medium": return "text-yellow-600 dark:text-yellow-400";
      case "low": return "text-green-600 dark:text-green-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 dark:bg-red-900/50";
      case "medium": return "bg-yellow-100 dark:bg-yellow-900/50";
      case "low": return "bg-green-100 dark:bg-green-900/50";
      default: return "bg-gray-100 dark:bg-gray-900/50";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recurring Tasks
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {recurringTasks.length} recurring task{recurringTasks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {recurringTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recurring tasks yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create a recurring task by checking the "Make this a recurring task" option when creating a new task.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recurringTasks.map((task) => {
              const isExpanded = expandedTasks.has(task._id);
              const isPaused = task.recurringPattern?.paused || false;
              
              return (
                <div
                  key={task._id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => handleToggleExpand(task._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {task.title}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBg(task.priority)} ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {isPaused && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                Paused
                              </span>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <ArrowPathIcon className="w-4 h-4 mr-1" />
                              {formatRecurrencePattern(task.recurringPattern)}
                            </span>
                            
                            <span className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
                              {task.completedInstances}/{task.instanceCount} completed
                            </span>
                            
                            {task.nextDueDate && (
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1 text-blue-500" />
                                Next: {new Date(task.nextDueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleStatus(task._id, isPaused)}
                          className={`p-2 rounded-lg transition-colors ${
                            isPaused 
                              ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/50"
                              : "text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
                          }`}
                          title={isPaused ? "Resume recurring task" : "Pause recurring task"}
                        >
                          {isPaused ? (
                            <PlayIcon className="w-5 h-5" />
                          ) : (
                            <PauseIcon className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleEditTask(task._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                          title="Edit recurring task"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleViewInstances(task._id)}
                          className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View all instances"
                        >
                          <ClockIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleGenerateMore(task._id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
                          title="Generate more instances"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task._id, false)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Delete recurring task"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Completed</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {task.completedInstances}/{task.instanceCount}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${task.instanceCount > 0 ? (task.completedInstances / task.instanceCount) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Schedule</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>Pattern: {formatRecurrencePattern(task.recurringPattern)}</div>
                            {task.dueTime && <div>Time: {task.dueTime}</div>}
                            {task.recurringPattern?.endDate && (
                              <div>Ends: {new Date(task.recurringPattern.endDate).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewInstances(task._id)}
                              className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              View all instances
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id, true)}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              Delete all instances
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedTaskId && (
          <EditRecurringTaskModal
            taskId={selectedTaskId}
            onClose={() => {
              setShowEditModal(false);
              setSelectedTaskId(null);
            }}
          />
        )}

        {/* Instances Modal */}
        {showInstancesModal && selectedTaskId && (
          <RecurringTaskInstancesModal
            templateId={selectedTaskId}
            onClose={() => {
              setShowInstancesModal(false);
              setSelectedTaskId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
