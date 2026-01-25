import React, { useState, useEffect, useRef } from 'react';

interface UnifiedDatePickerProps {
  initialDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

const UnifiedDatePicker: React.FC<UnifiedDatePickerProps> = ({
  initialDate,
  onConfirm,
  onCancel,
  title = "New Memory",
  subtitle = "Select Moment"
}) => {
  // Initialize with initialDate or current time
  const [selectedDate, setSelectedDate] = useState<Date>(() => initialDate || new Date());
  // viewDate tracks the month/year being viewed in the calendar
  const [viewDate, setViewDate] = useState<Date>(() => initialDate || new Date());

  // Time state
  const [selectedHour, setSelectedHour] = useState(selectedDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(selectedDate.getMinutes());

  useEffect(() => {
    // Update selected date when hour/minute changes
    const newDate = new Date(selectedDate);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    setSelectedDate(newDate);
  }, [selectedHour, selectedMinute]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, selectedHour, selectedMinute);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className="h-10 w-full group relative"
        >
          {isSelected ? (
            <div className="mx-auto size-9 flex items-center justify-center rounded-full bg-dusty-rose text-white font-bold shadow-md shadow-dusty-rose/30">
              {day}
            </div>
          ) : (
            <div className="mx-auto size-9 flex items-center justify-center rounded-full text-gray-800 dark:text-white group-hover:bg-gray-100 dark:group-hover:bg-white/5 transition-all">
              {day}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-[400px] bg-white dark:bg-[#2d1b1b] rounded-xl shadow-2xl overflow-hidden flex flex-col items-stretch border border-white/20 animate-fade-in-down">
        
        {/* Handle bar */}
        <div className="flex h-6 w-full items-center justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Header */}
        <div className="px-6 pt-4 text-center">
          <h4 className="text-dusty-rose font-bold text-xs uppercase tracking-widest mb-1 font-sans">{title}</h4>
          <h3 className="text-gray-900 dark:text-white text-2xl font-bold font-display">{subtitle}</h3>
        </div>

        {/* Calendar */}
        <div className="px-4 pt-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-2 mb-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">chevron_left</span>
              </button>
              <p className="text-gray-900 dark:text-white font-display text-lg font-bold">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </p>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">chevron_right</span>
              </button>
            </div>
            
            <div className="grid grid-cols-7 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <p key={i} className="text-gray-400 text-[11px] font-bold uppercase tracking-tighter h-8 flex items-center justify-center">
                  {d}
                </p>
              ))}
            </div>
            
            <div className="grid grid-cols-7 text-sm font-sans">
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        {/* Time Picker */}
        <div className="px-8 py-6 border-t border-gray-50 dark:border-white/5 mt-4">
          <div className="flex items-center justify-center gap-6 relative">
            
            {/* Hour */}
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Hour (0-23)</p>
              <div className="w-full flex flex-col items-center space-y-1">
                {/* Simplified Time Picker - just buttons for now or a simple input could work better for mobile, 
                    but sticking to the visual design which implies a scroll or selection. 
                    Implementing a simple increment/decrement or input for simplicity. */}
                <div className="flex items-center gap-2">
                    <button 
                        className="p-1 text-gray-400 hover:text-dusty-rose"
                        onClick={() => setSelectedHour(h => h === 0 ? 23 : h - 1)}
                    >
                        <span className="material-symbols-outlined text-sm">expand_less</span>
                    </button>
                </div>
                <div className="w-full h-11 bg-dusty-rose/10 dark:bg-dusty-rose/20 rounded-lg flex items-center justify-center border border-dusty-rose/20">
                  <input 
                    type="number" 
                    min="0" 
                    max="23"
                    value={selectedHour}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        if (val > 23) val = 23;
                        setSelectedHour(val);
                    }}
                    className="bg-transparent text-center w-full h-full text-gray-900 dark:text-white text-xl font-bold font-display focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        className="p-1 text-gray-400 hover:text-dusty-rose"
                        onClick={() => setSelectedHour(h => h === 23 ? 0 : h + 1)}
                    >
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-6">
              <span className="text-2xl font-bold text-gray-300 dark:text-gray-700">:</span>
            </div>

            {/* Minute */}
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Minute</p>
              <div className="w-full flex flex-col items-center space-y-1">
                 <div className="flex items-center gap-2">
                    <button 
                        className="p-1 text-gray-400 hover:text-dusty-rose"
                        onClick={() => setSelectedMinute(m => m === 0 ? 59 : m - 1)}
                    >
                        <span className="material-symbols-outlined text-sm">expand_less</span>
                    </button>
                </div>
                <div className="w-full h-11 bg-dusty-rose/10 dark:bg-dusty-rose/20 rounded-lg flex items-center justify-center border border-dusty-rose/20">
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    value={selectedMinute}
                    onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 0;
                        if (val < 0) val = 0;
                        if (val > 59) val = 59;
                        setSelectedMinute(val);
                    }}
                    className="bg-transparent text-center w-full h-full text-gray-900 dark:text-white text-xl font-bold font-display focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        className="p-1 text-gray-400 hover:text-dusty-rose"
                        onClick={() => setSelectedMinute(m => m === 59 ? 0 : m + 1)}
                    >
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button 
            onClick={handleConfirm}
            className="w-full h-14 bg-dusty-rose text-white font-bold rounded-full shadow-lg shadow-dusty-rose/30 active:scale-95 transition-all text-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-dusty-rose-dark"
          >
            <span>Confirm Selection</span>
            <span className="material-symbols-outlined text-xl">favorite</span>
          </button>
          <button 
            onClick={onCancel}
            className="w-full h-10 mt-2 text-gray-400 dark:text-gray-500 font-medium text-sm hover:text-gray-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
        <div className="h-4 bg-transparent"></div>
      </div>
    </div>
  );
};

export default UnifiedDatePicker;
