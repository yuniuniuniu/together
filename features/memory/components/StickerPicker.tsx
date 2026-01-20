import React from 'react';
import { STICKER_CATEGORIES } from '../../../shared/types/ui';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (sticker: string) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [activeCategory, setActiveCategory] = React.useState('love');

  if (!isOpen) return null;

  const currentCategory = STICKER_CATEGORIES.find((c) => c.id === activeCategory) || STICKER_CATEGORIES[0];

  const handleSelect = (icon: string) => {
    onSelect?.(icon);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-ink/10 pointer-events-auto backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] w-full max-w-xl mx-auto bottom-sheet pointer-events-auto h-[60vh] flex flex-col">
        <div
          className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onClick={onClose}
        >
          <div className="w-10 h-1 bg-ink/10 rounded-full" />
        </div>

        <div className="px-6 pb-4">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 text-xl">
              search
            </span>
            <input
              className="w-full bg-ink/5 border-none rounded-full py-2.5 pl-11 pr-4 text-sm placeholder:text-ink/30 focus:ring-1 focus:ring-sticker-rose/30 transition-all outline-none"
              placeholder="Search stickers..."
              type="text"
            />
          </div>
        </div>

        <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar border-b border-ink/5 pb-2">
          {STICKER_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-widest pb-2 transition-colors ${
                activeCategory === category.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-ink/40 hover:text-ink/70'
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
          <div className="grid grid-cols-4 gap-4 pb-20">
            {currentCategory.icons.map((icon, idx) => (
              <button
                key={idx}
                className="aspect-square rounded-2xl bg-paper/30 flex items-center justify-center hover:bg-sticker-rose/10 transition-colors group"
                onClick={() => handleSelect(icon)}
              >
                <span
                  className="material-symbols-outlined text-4xl text-sticker-rose transition-transform group-hover:scale-110"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}
                >
                  {icon}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
