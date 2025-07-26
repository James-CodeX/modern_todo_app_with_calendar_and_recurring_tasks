import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

export function Analytics() {
  const analytics = useQuery(api.analytics.getAnalytics);

  if (!analytics) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    totalTodos,
    completedTodos,
    activeTodos,
    completionRate,
    priorityStats,
    projectStats,
    weeklyTrend,
    overdueTodos,
    todayTodos
  } = analytics;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Dashboard</h1>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTodos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTodos}</p>
                <p className="text-sm text-green-600 dark:text-green-400">{completionRate}% completion rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeTodos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueTodos}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High Priority</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{priorityStats.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium Priority</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{priorityStats.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Low Priority</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{priorityStats.low}</span>
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Completion Trend</h3>
            <div className="space-y-2">
              {weeklyTrend.map((day, index) => {
                const maxCompletions = Math.max(...weeklyTrend.map(d => d.completions), 1);
                const percentage = (day.completions / maxCompletions) * 100;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className="w-12 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-8 text-xs text-gray-900 dark:text-white font-medium">
                      {day.completions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Stats */}
          {projectStats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h3>
              <div className="space-y-4">
                {projectStats.map((project) => (
                  <div key={project.projectId}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: project.projectColor }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {project.projectName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {project.completedTodos}/{project.totalTodos}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${project.completionRate}%`,
                          backgroundColor: project.projectColor 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tasks Due Today</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{todayTodos} tasks scheduled</p>
                </div>
              </div>
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Overdue Tasks</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{overdueTodos} tasks need attention</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
