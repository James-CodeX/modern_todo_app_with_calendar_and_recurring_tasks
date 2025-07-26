import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TodoList } from "./TodoList";
import { Calendar } from "./Calendar";
import { Analytics } from "./Analytics";
import { ProjectManager } from "./ProjectManager";
import { TagManager } from "./TagManager";
import { RecurringTaskManager } from "./RecurringTaskManager";
import { Header } from "./Header";
import { CreateTodoModal } from "./CreateTodoModal";

type View = "today" | "upcoming" | "calendar" | "project" | "analytics" | "projects" | "tags" | "recurring";

export function TodoApp() {
  const [currentView, setCurrentView] = useState<View>("today");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = useQuery(api.auth.loggedInUser);
  const projects = useQuery(api.projects.list);

  const handleViewChange = (view: View, projectId?: string) => {
    setCurrentView(view);
    setSelectedProjectId(projectId || null);
    setIsMobileMenuOpen(false);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case "today":
        return "Today";
      case "upcoming":
        return "Upcoming";
      case "calendar":
        return "Calendar";
      case "analytics":
        return "Analytics";
      case "projects":
        return "Projects";
      case "tags":
        return "Tags";
      case "recurring":
        return "Recurring Tasks";
      case "project":
        const project = projects?.find(p => p._id === selectedProjectId);
        return project?.name || "Project";
      default:
        return "Tasks";
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "calendar":
        return (
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        );
      case "analytics":
        return <Analytics />;
      case "projects":
        return <ProjectManager />;
      case "tags":
        return <TagManager />;
      case "recurring":
        return <RecurringTaskManager />;
      default:
        return (
          <TodoList
            view={currentView}
            projectId={selectedProjectId}
            selectedDate={selectedDate}
          />
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentView={currentView}
          selectedProjectId={selectedProjectId}
          onViewChange={handleViewChange}
          onCreateTodo={() => setShowCreateModal(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getViewTitle()}
          user={user}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onCreateTodo={() => setShowCreateModal(true)}
        />

        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav
          currentView={currentView}
          selectedProjectId={selectedProjectId}
          onViewChange={handleViewChange}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Create Todo Modal */}
      {showCreateModal && (
        <CreateTodoModal
          onClose={() => setShowCreateModal(false)}
          defaultProjectId={selectedProjectId}
          defaultDate={currentView === "today" ? new Date() : selectedDate}
        />
      )}
    </div>
  );
}
