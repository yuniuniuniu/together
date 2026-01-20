import React from 'react';
import type { Location } from '../../../shared/types';

interface SavedLocation extends Location {
  distance?: string;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (location: Location) => void;
  savedLocations?: SavedLocation[];
  nearbyPlaces?: SavedLocation[];
}

const defaultSavedLocations: SavedLocation[] = [
  { id: '1', name: 'First Date Spot', address: 'The Botanical Gardens • 2.4 mi', icon: 'favorite', isSaved: true },
  { id: '2', name: 'Home Sweet Home', address: '123 Rose Lane', icon: 'home', isSaved: true },
];

const defaultNearbyPlaces: SavedLocation[] = [
  { id: '3', name: 'The Velvet Bean', address: 'Coffee Shop • 0.1 mi away', icon: 'local_cafe' },
  { id: '4', name: 'Bistro Lumière', address: 'French Cuisine • 0.3 mi away', icon: 'restaurant' },
  { id: '5', name: 'Sunset Park', address: 'Public Park • 0.5 mi away', icon: 'park' },
  { id: '6', name: 'City Library', address: 'Library • 0.8 mi away', icon: 'menu_book' },
];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  savedLocations = defaultSavedLocations,
  nearbyPlaces = defaultNearbyPlaces,
}) => {
  if (!isOpen) return null;

  const handleSelect = (location: Location) => {
    onSelect?.(location);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-manrope">
      {/* Background: Blurred Map/Context */}
      <div className="absolute inset-0 z-0" onClick={onClose}>
        <div
          className="w-full h-full bg-[#e3dedb]"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBcClvWw0VlMxWmW9FqkjIax4Izg-uvp9_a1flxQQKXOzBJ9259uDtH_lDeaIhL8PhnY4Wd8h7fJ5Z_fCnDjlRD9GZUmqaTKjEZd9aJ78rL-eiv2mANZKlPFwiI2iXyPuUShGVWUJ3Mv3Np5eWdW3zLi9Q3cB6hWoJbv3ul-O4eWwU-_a_L6CMXBr3R-u_OvCLrqXa6k7snRr3_1FKe61Rj-VP3iUiQgZW4UvSd9i9_N1-tax1sIq6l0NqIDZ-e_1WPQVq8YtiapGhD')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>

      {/* Bottom Sheet Modal */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
        <div className="pointer-events-auto w-full bg-loc-bg dark:bg-loc-bg-dark rounded-t-[2rem] shadow-soft-up flex flex-col h-[85%] transition-transform duration-300 ease-out transform translate-y-0">
          {/* Handle */}
          <div
            className="w-full flex items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
            onClick={onClose}
          >
            <div className="w-12 h-1.5 bg-[#dfd7d9] rounded-full" />
          </div>

          {/* Header Content */}
          <div className="px-6 pb-4 pt-2 shrink-0">
            <h2 className="text-loc-text dark:text-gray-100 text-2xl font-bold tracking-tight mb-4">
              Add Location
            </h2>
            {/* Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-loc-primary/60">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-3.5 border-none rounded-2xl leading-5 bg-loc-primary/5 text-loc-text placeholder-loc-primary/40 focus:outline-none focus:ring-2 focus:ring-loc-primary/20 focus:bg-white transition-all duration-300 ease-in-out font-medium shadow-sm"
                placeholder="Search for a place..."
                type="text"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                <span className="material-symbols-outlined text-loc-primary/40 text-sm bg-loc-primary/10 rounded-full p-1 hover:bg-loc-primary/20 transition-colors">
                  mic
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable List Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-8 space-y-6">
            {/* Section: Saved Memories */}
            <div>
              <div className="px-4 pb-2 pt-2 flex items-center justify-between">
                <h3 className="text-loc-text dark:text-gray-200 text-sm font-bold uppercase tracking-wider opacity-80">
                  Saved Memories
                </h3>
                <button className="text-loc-primary text-xs font-semibold hover:underline">Edit</button>
              </div>
              <div className="flex flex-col gap-1">
                {savedLocations.map((location) => (
                  <button
                    key={location.id}
                    className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left"
                    onClick={() => handleSelect(location)}
                  >
                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-[#fceeee] text-loc-primary group-hover:bg-loc-primary group-hover:text-white transition-colors duration-300">
                      <span className="material-symbols-outlined icon-filled text-[20px]">
                        {location.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">
                        {location.name}
                      </p>
                      <p className="text-loc-sub dark:text-gray-400 text-sm truncate">
                        {location.address}
                      </p>
                    </div>
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-loc-primary">arrow_forward_ios</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Nearby */}
            <div>
              <div className="px-4 pb-2">
                <h3 className="text-loc-text dark:text-gray-200 text-sm font-bold uppercase tracking-wider opacity-80">
                  Nearby Places
                </h3>
              </div>
              <div className="flex flex-col gap-1">
                {nearbyPlaces.map((place) => (
                  <button
                    key={place.id}
                    className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left"
                    onClick={() => handleSelect(place)}
                  >
                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                      <span className="material-symbols-outlined text-[20px]">{place.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">
                        {place.name}
                      </p>
                      <p className="text-loc-sub dark:text-gray-400 text-sm truncate">{place.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/30 bg-loc-bg dark:bg-loc-bg-dark rounded-b-[2rem]">
            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-loc-primary/30 text-loc-primary font-bold hover:bg-loc-primary/5 transition-colors">
              <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
              <span>Use current location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
