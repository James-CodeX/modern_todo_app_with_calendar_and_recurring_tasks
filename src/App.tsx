import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { TodoApp } from "./components/TodoApp";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Authenticated>
        <TodoApp />
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm h-16 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shadow-sm px-4">
            <h2 className="text-xl font-semibold text-primary dark:text-blue-400">Todo.ist</h2>
          </header>
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Todo.ist</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">Your elegant task management companion</p>
              </div>
              <SignInForm />
            </div>
          </main>
        </div>
      </Unauthenticated>
      
      <Toaster />
    </div>
  );
}
