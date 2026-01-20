import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewMilestone: React.FC = () => {
  const navigate = useNavigate();
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <div className={`bg-milestone-cream dark:bg-milestone-zinc-dark font-manrope antialiased text-zinc-900 dark:text-zinc-100 selection:bg-milestone-pink/20 selection:text-milestone-pink min-h-screen flex flex-col ${showLocationPicker ? 'overflow-hidden' : ''}`}>
      <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden shadow-2xl bg-milestone-cream dark:bg-milestone-zinc-dark">
        
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-milestone-cream/90 dark:bg-milestone-zinc-dark/90 backdrop-blur-md transition-all">
          <button 
            onClick={() => navigate(-1)}
            className="text-zinc-500 dark:text-zinc-400 text-base font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-1 opacity-80">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">New Milestone</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-milestone-pink hover:bg-milestone-pink/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-milestone-pink/20 transition-all transform active:scale-95 flex items-center gap-1"
          >
            <span>Save</span>
          </button>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 flex flex-col px-6 pb-10 pt-2 gap-8">
          
          {/* Hero Cover Photo Slot (Empty State) */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer transition-all">
            {/* Dashed Border Container */}
            <div className="absolute inset-0 border-[1.5px] border-dashed border-gold/40 rounded-2xl group-hover:border-gold/70 transition-colors"></div>
            {/* Inner Content */}
            <div className="absolute inset-0 bg-gold/5 dark:bg-gold/10 flex flex-col items-center justify-center gap-4 p-6 transition-colors group-hover:bg-gold/10 dark:group-hover:bg-gold/20">
              <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-gold">
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
              </div>
              <div className="text-center">
                <p className="text-zinc-900 dark:text-zinc-100 text-base font-bold">Add Cover Photo</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Capture the essence of this moment</p>
              </div>
            </div>
          </div>

          {/* Title & Date Section */}
          <div className="flex flex-col items-center gap-4 mt-2">
            {/* Title Input */}
            <div className="w-full relative">
              <input 
                autoFocus 
                className="w-full bg-transparent text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 border-none focus:ring-0 p-0 leading-tight" 
                placeholder="Moving In Together" 
                type="text"
              />
            </div>
            {/* Date Picker Pill */}
            <button className="group flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:border-gold/30 transition-all">
              <span className="material-symbols-outlined text-gold text-[20px]">calendar_month</span>
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-milestone-pink transition-colors">Today, October 24</span>
              <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-[16px]">edit</span>
            </button>
          </div>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-4 py-2 opacity-60">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            <span className="material-symbols-outlined text-gold text-[10px]">diamond</span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
          </div>

          {/* Feelings / Journaling Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-milestone-pink uppercase tracking-widest">Our Feelings</label>
              <span className="material-symbols-outlined text-gold/60 text-lg">favorite</span>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-milestone-pink/20 to-gold/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <textarea 
                className="relative w-full bg-white dark:bg-zinc-800/80 rounded-xl border-0 ring-1 ring-zinc-100 dark:ring-zinc-700/50 p-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-200 shadow-sm focus:ring-2 focus:ring-milestone-pink/20 focus:bg-white dark:focus:bg-zinc-800 resize-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600" 
                placeholder="How did this moment make us feel? Was there laughter, tears, or quiet joy? Write it down while it's fresh..." 
                rows={6}
              ></textarea>
            </div>
          </div>

          {/* Categorization Tags */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Categorize</p>
            <div className="flex flex-wrap gap-2">
              {/* Active Tag */}
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-milestone-pink text-white text-sm font-semibold shadow-md shadow-milestone-pink/20 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[18px]">celebration</span>
                Milestone
              </button>
              {/* Inactive Tags */}
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors">
                <span className="material-symbols-outlined text-[18px]">flight</span>
                Trip
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors">
                <span className="material-symbols-outlined text-[18px]">favorite_border</span>
                Anniversary
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-gold/10 hover:text-gold transition-colors">
                <span className="material-symbols-outlined text-[18px]">home</span>
                Life Event
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-milestone-pink hover:text-milestone-pink transition-colors">
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          {/* Location (Optional Footer Item) */}
          <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
            <button 
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <div className="size-10 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Add Location</span>
                <span className="text-xs text-zinc-400">Where did this happen?</span>
              </div>
              <span className="material-symbols-outlined ml-auto text-zinc-300 group-hover:text-gold transition-colors">chevron_right</span>
            </button>
          </div>

        </main>
      </div>

      {/* Location Picker Overlay */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 overflow-hidden font-manrope text-left">
            {/* Background: Blurred Map/Context */}
            <div className="absolute inset-0 z-0" onClick={() => setShowLocationPicker(false)}>
                <div 
                  className="w-full h-full bg-[#e3dedb]" 
                  style={{
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBcClvWw0VlMxWmW9FqkjIax4Izg-uvp9_a1flxQQKXOzBJ9259uDtH_lDeaIhL8PhnY4Wd8h7fJ5Z_fCnDjlRD9GZUmqaTKjEZd9aJ78rL-eiv2mANZKlPFwiI2iXyPuUShGVWUJ3Mv3Np5eWdW3zLi9Q3cB6hWoJbv3ul-O4eWwU-_a_L6CMXBr3R-u_OvCLrqXa6k7snRr3_1FKe61Rj-VP3iUiQgZW4UvSd9i9_N1-tax1sIq6l0NqIDZ-e_1WPQVq8YtiapGhD')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                ></div>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
            </div>

            {/* Bottom Sheet Modal */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
                <div className="pointer-events-auto w-full bg-loc-bg dark:bg-loc-bg-dark rounded-t-[2rem] shadow-soft-up flex flex-col h-[85%] transition-transform duration-300 ease-out transform translate-y-0">
                    
                    {/* Handle */}
                    <div 
                      className="w-full flex items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
                      onClick={() => setShowLocationPicker(false)}
                    >
                        <div className="w-12 h-1.5 bg-[#dfd7d9] rounded-full"></div>
                    </div>

                    {/* Header Content */}
                    <div className="px-6 pb-4 pt-2 shrink-0">
                        <h2 className="text-loc-text dark:text-gray-100 text-2xl font-bold tracking-tight mb-4">Add Location</h2>
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
                                <span className="material-symbols-outlined text-loc-primary/40 text-sm bg-loc-primary/10 rounded-full p-1 hover:bg-loc-primary/20 transition-colors">mic</span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable List Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-8 space-y-6">
                        
                        {/* Section: Suggested */}
                        <div>
                            <div className="px-4 pb-2 pt-2 flex items-center justify-between">
                                <h3 className="text-loc-text dark:text-gray-200 text-sm font-bold uppercase tracking-wider opacity-80">Saved Memories</h3>
                                <button className="text-loc-primary text-xs font-semibold hover:underline">Edit</button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-[#fceeee] text-loc-primary group-hover:bg-loc-primary group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined icon-filled text-[20px]">favorite</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">First Date Spot</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">The Botanical Gardens • 2.4 mi</p>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-loc-primary">arrow_forward_ios</span>
                                    </div>
                                </button>
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-[#fceeee] text-loc-primary group-hover:bg-loc-primary group-hover:text-white transition-colors duration-300">
                                        <span className="material-symbols-outlined icon-filled text-[20px]">home</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">Home Sweet Home</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">123 Rose Lane</p>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-loc-primary">arrow_forward_ios</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Section: Nearby */}
                        <div>
                            <div className="px-4 pb-2">
                                <h3 className="text-loc-text dark:text-gray-200 text-sm font-bold uppercase tracking-wider opacity-80">Nearby Places</h3>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                                        <span className="material-symbols-outlined text-[20px]">local_cafe</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">The Velvet Bean</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">Coffee Shop • 0.1 mi away</p>
                                    </div>
                                </button>
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                                        <span className="material-symbols-outlined text-[20px]">restaurant</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">Bistro Lumière</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">French Cuisine • 0.3 mi away</p>
                                    </div>
                                </button>
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                                        <span className="material-symbols-outlined text-[20px]">park</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">Sunset Park</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">Public Park • 0.5 mi away</p>
                                    </div>
                                </button>
                                <button className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left">
                                    <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">City Library</p>
                                        <p className="text-loc-sub dark:text-gray-400 text-sm truncate">Library • 0.8 mi away</p>
                                    </div>
                                </button>
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
      )}
    </div>
  );
};

export default NewMilestone;