import React, { useState } from 'react';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasHomework?: boolean;
}

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  homeworkDates?: string[]; // YYYY-MM-DD format
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  homeworkDates = [],
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const dayDate = new Date(year, month - 1, day);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        hasHomework: homeworkDates.includes(dayDate.toISOString().split('T')[0])
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dateString = dayDate.toISOString().split('T')[0];
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: 
          dayDate.toDateString() === today.toDateString(),
        hasHomework: homeworkDates.includes(dateString)
      });
    }

    // Next month's leading days
    const remainingSlots = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingSlots; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        hasHomework: homeworkDates.includes(dayDate.toISOString().split('T')[0])
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  return (
    <div className={`bg-[var(--bg-card)] rounded-lg shadow-md p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {currentMonth.toLocaleDateString('tr-TR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <button
            onClick={goToToday}
            className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-md hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          >
            Bugün
          </button>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div 
            key={day}
            className="text-center text-sm font-medium text-[var(--text-secondary)] p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isSelected = selectedDate && 
            day.date.toDateString() === selectedDate.toDateString();
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.date)}
              className={`
                relative p-2 text-sm rounded-lg transition-all duration-200 min-h-[40px] flex items-center justify-center
                ${!day.isCurrentMonth 
                  ? 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800' 
                  : 'text-[var(--text-primary)] hover:bg-violet-100 dark:hover:bg-violet-900/30'
                }
                ${day.isToday 
                  ? 'bg-violet-200 dark:bg-violet-800 font-bold' 
                  : ''
                }
                ${isSelected 
                  ? 'bg-violet-500 text-white shadow-md scale-105' 
                  : ''
                }
                ${day.hasHomework && !isSelected 
                  ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-600' 
                  : ''
                }
              `}
            >
              <span>{day.date.getDate()}</span>
              {day.hasHomework && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-violet-200 dark:bg-violet-800 rounded"></div>
          <span>Bugün</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded"></div>
          <span>Ödev var</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;