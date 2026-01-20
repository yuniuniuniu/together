import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface BottomNavProps {
  items?: NavItem[];
  className?: string;
}

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M3 9.5L12 3l9 6.5v10.5a1 1 0 0 1-1 1h-5v-6h-4v6H4a1 1 0 0 1-1-1z"></path>
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    <path d="M12 5.67l.35.35M11.65 6.02L12 6.38"></path>
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const defaultItems: NavItem[] = [
  { icon: <HomeIcon className="w-7 h-7 stroke-current fill-none" />, label: 'Home', path: '/dashboard' },
  { icon: <HeartIcon className="w-7 h-7 stroke-current fill-none" />, label: 'Memories', path: '/memory/timeline' },
  { icon: <SettingsIcon className="w-7 h-7 stroke-current fill-none" />, label: 'Settings', path: '/settings' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  items = defaultItems,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl border-t border-primary/20 dark:border-zinc-800 pb-safe z-50 rounded-t-[2rem] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] ${className}`}>
      <div className="grid grid-cols-3 w-full h-[88px] max-w-md mx-auto px-6">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className="flex flex-col items-center justify-center gap-1.5 group"
              onClick={() => navigate(item.path)}
            >
              <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-soft-sand/50' : 'group-hover:bg-soft-sand/50'}`}>
                <div className={`transition-colors ${isActive ? 'text-accent' : 'text-dusty-rose group-hover:text-accent'}`}>
                  {item.icon}
                </div>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-accent' : 'text-dusty-rose group-hover:text-accent'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
