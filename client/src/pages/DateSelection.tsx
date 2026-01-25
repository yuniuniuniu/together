import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

const DateSelection: React.FC = () => {
  const navigate = useNavigate();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [selectedMonth, setSelectedMonth] = useState(9); // October (0-indexed)
  const [selectedDay, setSelectedDay] = useState(24);
  const [selectedYear, setSelectedYear] = useState(2025);
  const touchStartY = useRef<{ month: number | null; day: number | null; year: number | null }>({
    month: null,
    day: null,
    year: null,
  });
  const wheelCooldown = useRef<{ month: boolean; day: boolean; year: boolean }>({
    month: false,
    day: false,
    year: false,
  });

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => clamp(prev + delta, 0, months.length - 1));
  };

  const changeDay = (delta: number) => {
    setSelectedDay(prev => clamp(prev + delta, 1, days.length));
  };

  const changeYear = (delta: number) => {
    setSelectedYear(prev => {
      const index = years.indexOf(prev);
      const nextIndex = clamp(index + delta, 0, years.length - 1);
      return years[nextIndex];
    });
  };

  const handleTouchStart = (key: 'month' | 'day' | 'year') => (event: React.TouchEvent) => {
    touchStartY.current[key] = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (key: 'month' | 'day' | 'year', onChange: (delta: number) => void) =>
    (event: React.TouchEvent) => {
      const startY = touchStartY.current[key];
      if (startY === null) return;
      const currentY = event.touches[0]?.clientY ?? startY;
      const delta = currentY - startY;
      const threshold = 18;
      if (Math.abs(delta) < threshold) return;
      onChange(delta > 0 ? -1 : 1);
      touchStartY.current[key] = currentY;
    };

  const handleTouchEnd = (key: 'month' | 'day' | 'year') => () => {
    touchStartY.current[key] = null;
  };

  const handleWheel = (key: 'month' | 'day' | 'year', onChange: (delta: number) => void) =>
    (event: React.WheelEvent) => {
      if (wheelCooldown.current[key]) return;
      wheelCooldown.current[key] = true;
      onChange(event.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => {
        wheelCooldown.current[key] = false;
      }, 120);
    };

  const handleContinue = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    // Store in sessionStorage for CreateSpace to use
    sessionStorage.setItem('anniversaryDate', dateStr);
    navigate('/setup/create');
  };

  const getAdjacentItems = (arr: (string | number)[], currentIndex: number) => {
    const prev = currentIndex > 0 ? arr[currentIndex - 1] : null;
    const next = currentIndex < arr.length - 1 ? arr[currentIndex + 1] : null;
    return { prev, current: arr[currentIndex], next };
  };

  const monthItems = getAdjacentItems(months, selectedMonth);
  const dayItems = getAdjacentItems(days, selectedDay - 1);
  const yearIndex = years.indexOf(selectedYear);
  const yearItems = getAdjacentItems(years, yearIndex);

  return (
    <div className="flex-1 flex flex-col bg-background-light">
      <div className="flex items-center px-4 pb-2 pt-safe-offset-4 justify-between z-10">
        <div
          className="text-ink flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <div className="text-sm font-medium opacity-50 uppercase tracking-widest">Onboarding</div>
        <div className="size-12"></div>
      </div>

      <div className="flex flex-col flex-1 px-8 pt-6 pb-8">
        <div className="mt-4 mb-10 text-center">
          <h1 className="text-ink tracking-tight text-[36px] font-bold leading-[1.15] text-center">
            When did your<br/>story begin?
          </h1>
        </div>

        <div className="relative w-full mb-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft border border-white/50 overflow-hidden h-[300px] flex items-center justify-center">
            {/* Selection Highlight */}
            <div className="absolute w-[calc(100%-32px)] h-14 bg-primary/25 rounded-xl z-0 border border-primary/20"></div>

            <div className="relative z-10 grid grid-cols-3 w-full px-6 gap-2 text-center h-full">
              {/* Month */}
              <div
                className="flex flex-col items-center justify-center h-full gap-5 touch-none"
                onTouchStart={handleTouchStart('month')}
                onTouchMove={handleTouchMove('month', changeMonth)}
                onTouchEnd={handleTouchEnd('month')}
                onWheel={handleWheel('month', changeMonth)}
              >
                <button
                  className="text-lg text-gray-400 font-medium translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => selectedMonth > 0 && setSelectedMonth(selectedMonth - 1)}
                  disabled={selectedMonth === 0}
                >
                  {monthItems.prev || ''}
                </button>
                <div className="text-2xl text-ink font-bold scale-110">{monthItems.current}</div>
                <button
                  className="text-lg text-gray-400 font-medium -translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => selectedMonth < 11 && setSelectedMonth(selectedMonth + 1)}
                  disabled={selectedMonth === 11}
                >
                  {monthItems.next || ''}
                </button>
              </div>
              {/* Day */}
              <div
                className="flex flex-col items-center justify-center h-full gap-5 touch-none"
                onTouchStart={handleTouchStart('day')}
                onTouchMove={handleTouchMove('day', changeDay)}
                onTouchEnd={handleTouchEnd('day')}
                onWheel={handleWheel('day', changeDay)}
              >
                <button
                  className="text-lg text-gray-400 font-medium translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => selectedDay > 1 && setSelectedDay(selectedDay - 1)}
                  disabled={selectedDay === 1}
                >
                  {dayItems.prev || ''}
                </button>
                <div className="text-2xl text-ink font-bold scale-110">{dayItems.current}</div>
                <button
                  className="text-lg text-gray-400 font-medium -translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => selectedDay < 31 && setSelectedDay(selectedDay + 1)}
                  disabled={selectedDay === 31}
                >
                  {dayItems.next || ''}
                </button>
              </div>
              {/* Year */}
              <div
                className="flex flex-col items-center justify-center h-full gap-5 touch-none"
                onTouchStart={handleTouchStart('year')}
                onTouchMove={handleTouchMove('year', changeYear)}
                onTouchEnd={handleTouchEnd('year')}
                onWheel={handleWheel('year', changeYear)}
              >
                <button
                  className="text-lg text-gray-400 font-medium translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => yearIndex > 0 && setSelectedYear(years[yearIndex - 1])}
                  disabled={yearIndex === 0}
                >
                  {yearItems.prev || ''}
                </button>
                <div className="text-2xl text-ink font-bold scale-110">{yearItems.current}</div>
                <button
                  className="text-lg text-gray-400 font-medium -translate-y-2 hover:text-gray-600 transition-colors"
                  onClick={() => yearIndex < years.length - 1 && setSelectedYear(years[yearIndex + 1])}
                  disabled={yearIndex === years.length - 1}
                >
                  {yearItems.next || ''}
                </button>
              </div>
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20"></div>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20"></div>
          </div>
        </div>

        <div className="text-center px-4 mb-auto">
          <p className="text-ink/50 text-sm font-medium leading-relaxed">
            This will be used to calculate your days together
          </p>
        </div>

        <div className="mt-8">
          <Button onClick={handleContinue} fullWidth>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DateSelection;