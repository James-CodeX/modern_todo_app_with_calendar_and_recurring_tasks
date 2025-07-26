import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../contexts/ThemeContext";
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon,
  FolderIcon,
  HomeIcon,
  ChartBarIcon,
  TagIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface SidebarProps {
  currentView: string;
  selectedProjectId: string | null;
  onViewChange: (view: "today" | "upcoming" | "calendar" | "project" | "analytics" | "projects" | "tags" | "recurring", projectId?: string) => void;
  onCreateTodo: () => void;
}

export function Sidebar({ currentView, selectedProjectId, onViewChange, onCreateTodo }: SidebarProps) {
  const projects = useQuery(api.projects.list) || [];
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: "today", label: "Today", icon: HomeIcon },
    { id: "upcoming", label: "Upcoming", icon: ClockIcon },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "analytics", label: "Analytics", icon: ChartBarIcon },
  ];

  const managementItems = [
    { id: "projects", label: "Manage Projects", icon: FolderIcon },
    { id: "tags", label: "Manage Tags", icon: TagIcon },
    { id: "recurring", label: "Recurring Tasks", icon: ArrowPathIcon },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Todo.ist</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.id
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Management Section */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Management
          </h3>
          <div className="space-y-1">
            {managementItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === item.id
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Projects
            </h3>
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project._id}
                onClick={() => onViewChange("project", project._id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === "project" && selectedProjectId === project._id
                    ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                No projects yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateTodo}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Task
        </button>
      </div>
    </div>
  );
}
