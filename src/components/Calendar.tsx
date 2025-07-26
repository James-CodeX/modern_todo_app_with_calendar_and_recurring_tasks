import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from "@heroicons/react/24/outline";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from "date-fns";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const todos = useQuery(api.todos.getTodosForDateRange, {
    startDate: calendarStart.getTime(),
    endDate: calendarEnd.getTime(),
  }) || [];

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => 
      todo.dueDate && isSameDay(new Date(todo.dueDate), date)
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newMonth;
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const dayTodos = getTodosForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(day)}
                  className={`min-h-[100px] p-2 border-r border-b border-gray-200 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !isCurrentMonth ? "text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800" : ""
                  } ${isSelected ? "bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800" : ""}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isTodayDate ? "text-blue-600 dark:text-blue-400" : isCurrentMonth ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"
                  }`}>
                    {format(day, "d")}
                  </div>
                  
                  {/* Todo indicators */}
                  <div className="space-y-1">
                    {dayTodos.slice(0, 3).map((todo) => (
                      <div
                        key={todo._id}
                        className={`text-xs p-1 rounded truncate ${
                          todo.completed 
                            ? "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 line-through" 
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}
                      >
                        {todo.title}
                      </div>
                    ))}
                    {dayTodos.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayTodos.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tasks for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <div className="space-y-2">
              {getTodosForDate(selectedDate).map((todo) => (
                <div
                  key={todo._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${
                    todo.completed ? "opacity-75" : ""
                  }`}
                >
                  <div className={`font-medium ${
                    todo.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
                  }`}>
                    {todo.title}
                  </div>
                  {todo.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{todo.description}</div>
                  )}
                  {todo.dueTime && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Due at {todo.dueTime}
                    </div>
                  )}
                </div>
              ))}
              {getTodosForDate(selectedDate).length === 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No tasks scheduled for this date
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
