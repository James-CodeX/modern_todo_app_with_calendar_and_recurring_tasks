import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../contexts/ThemeContext";
import { 
  CalendarIcon, 
  ClockIcon,
  FolderIcon,
  HomeIcon,
  XMarkIcon,
  ChartBarIcon,
  TagIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface MobileNavProps {
  currentView: string;
  selectedProjectId: string | null;
  onViewChange: (view: "today" | "upcoming" | "calendar" | "project" | "analytics" | "projects" | "tags" | "recurring", projectId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ currentView, selectedProjectId, onViewChange, isOpen, onClose }: MobileNavProps) {
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Todo.ist</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Projects
            </h3>
            
            <div className="space-y-1">
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
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
