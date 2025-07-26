import { SignOutButton } from "../SignOutButton";
import { 
  Bars3Icon,
  PlusIcon
} from "@heroicons/react/24/outline";

interface HeaderProps {
  title: string;
  user: any;
  onMenuToggle: () => void;
  onCreateTodo: () => void;
}

export function Header({ title, user, onMenuToggle, onCreateTodo }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-2 transition-colors"
        >
          <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onCreateTodo}
          className="lg:hidden p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
        <SignOutButton />
      </div>
    </header>
  );
}
