import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NewMemory: React.FC = () => {
  const navigate = useNavigate();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  return (
    <div className={`flex-1 flex flex-col bg-paper min-h-screen relative font-sans ${showStickerPicker ? 'overflow-hidden' : ''}`}>
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-paper/80 backdrop-blur-md">
        <button 
          onClick={() => navigate(-1)}
          className="text-ink/60 text-sm font-medium hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <h1 className="text-ink text-sm font-bold uppercase tracking-widest opacity-80">New Memory</h1>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm"
        >
          Save
        </button>
      </header>

      <main className="flex-1 flex flex-col w-full px-6 pb-24 overflow-y-auto no-scrollbar">
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2 text-accent/60 text-[10px] font-bold uppercase tracking-widest">
            <span>October 24, 2023</span>
          </div>
        </div>

        <div className="flex-1">
          <textarea 
            className="w-full bg-transparent border-none focus:ring-0 text-ink text-xl leading-relaxed placeholder:text-ink/20 resize-none min-h-[120px] p-0 font-serif" 
            placeholder="Dear You... what's on your mind today?"
            autoFocus
          ></textarea>
        </div>

        <div className="py-8">
          <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-4">Attach Moments</p>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
            {/* Image 1 */}
            <div className="flex-shrink-0 w-32">
              <div className="bg-white p-2 pb-6 rounded-sm shadow-sm rotate-[-2deg] transition-transform active:scale-95">
                <div className="aspect-square bg-gray-100 overflow-hidden rounded-sm relative group">
                  <img 
                    alt="Memory" 
                    className="w-full h-full object-cover grayscale-[20%] sepia-[10%]" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvUWGjC3H82Dmoy0EAd2ipPiGbRYTnIk388mUCRCUwIiDYUMwenrQ7mgEtf_0gQV6PxluOYhcdBDIrgIRWyTZ283UAXuBhQ8p91CJFuC56iDj7okF7YKIe3WRy7eTWXmxWpWqV7o59idmFt21TPBcJ0z8mjKpW_jOEOyRb7HcEMHwtwvWUfSzRPtZQtnqTJib0j28BHPYZF_lVEb4zQu64NcNPJzMGTKuPGEApXkWA24VTgK-CTerTMUo-lLiL9xi-jCKUFWdIy4SV"
                  />
                  <button className="absolute top-1 right-1 bg-black/20 text-white rounded-full p-0.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Add Button */}
            <div className="flex-shrink-0 w-32">
              <button className="bg-white p-2 pb-6 rounded-sm shadow-sm rotate-[1deg] w-full flex flex-col items-center transition-transform active:scale-95">
                <div className="aspect-square w-full bg-[#fdfaf7] border border-dashed border-ink/10 rounded-sm flex items-center justify-center hover:bg-gray-50">
                  <span className="material-symbols-outlined text-ink/20 text-3xl">add_a_photo</span>
                </div>
              </button>
            </div>
            {/* Placeholder */}
            <div className="flex-shrink-0 w-32">
              <button className="bg-white p-2 pb-6 rounded-sm shadow-sm rotate-[-1deg] w-full flex flex-col items-center opacity-60">
                <div className="aspect-square w-full bg-[#fdfaf7] border border-dashed border-ink/10 rounded-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-ink/10 text-3xl">add</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-ink/5">
          <h3 className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-6 text-center">How are you feeling together?</h3>
          <div className="flex justify-between items-center px-2">
            {[
              { icon: 'sentiment_very_satisfied', label: 'Happy', active: true },
              { icon: 'self_improvement', label: 'Calm' },
              { icon: 'favorite', label: 'Together' },
              { icon: 'auto_awesome', label: 'Excited' },
              { icon: 'filter_drama', label: 'Moody' },
            ].map((mood) => (
              <button key={mood.label} className={`flex flex-col items-center gap-2 group ${mood.active ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${mood.active ? 'bg-primary/30 text-accent' : 'bg-white/50 text-ink/40 group-hover:bg-white'}`}>
                  <span className="material-symbols-outlined text-2xl" style={mood.active ? {fontVariationSettings: "'FILL' 1"} : {}}>{mood.icon}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${mood.active ? 'text-accent' : 'text-ink/30'}`}>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-ink/30 text-[10px] font-medium italic">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Only visible to you and Sarah</span>
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-fit bg-ink/5 backdrop-blur-lg rounded-full px-6 py-3 flex items-center gap-6 shadow-xl border border-white/20 z-40">
        <button 
          className="text-ink/60 hover:text-accent transition-colors"
          onClick={() => setShowLocationPicker(true)}
        >
          <span className="material-symbols-outlined">location_on</span>
        </button>
        <button 
          className={`${showStickerPicker ? 'text-accent' : 'text-ink/60 hover:text-accent'} transition-colors`}
          onClick={() => setShowStickerPicker(!showStickerPicker)}
        >
          <span 
            className="material-symbols-outlined"
            style={showStickerPicker ? {fontVariationSettings: "'FILL' 1"} : {}}
          >
            sentiment_satisfied
          </span>
        </button>
        <button 
          className="text-ink/60 hover:text-accent transition-colors"
          onClick={() => setShowVoiceRecorder(true)}
        >
          <span className="material-symbols-outlined">mic</span>
        </button>
        <div className="w-px h-4 bg-ink/10"></div>
        <span className="text-[10px] font-bold text-ink/40">248 words</span>
      </div>

      {/* Voice Recorder Overlay */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto bg-ink/5 backdrop-blur-[2px]">
          <div className="absolute inset-0 z-0" onClick={() => setShowVoiceRecorder(false)}></div>
          <div className="relative w-full bg-paper/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 pb-12 pt-8 px-6 transition-all duration-300 transform translate-y-0">
            <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-10"></div>
            
            {/* Waveform */}
            <div className="flex items-center justify-center gap-[3px] h-16 mb-8 px-8">
              <div className="w-1.5 bg-accent/30 rounded-full h-4 animate-[pulse_1s_ease-in-out_infinite]"></div>
              <div className="w-1.5 bg-accent/40 rounded-full h-8 animate-[pulse_1.2s_ease-in-out_infinite] delay-75"></div>
              <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_0.8s_ease-in-out_infinite] delay-100"></div>
              <div className="w-1.5 bg-accent rounded-full h-16 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
              <div className="w-1.5 bg-accent/80 rounded-full h-10 animate-[pulse_1.1s_ease-in-out_infinite] delay-150"></div>
              <div className="w-1.5 bg-accent/60 rounded-full h-14 animate-[pulse_0.9s_ease-in-out_infinite] delay-75"></div>
              <div className="w-1.5 bg-accent/40 rounded-full h-6 animate-[pulse_1.3s_ease-in-out_infinite]"></div>
              <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_1s_ease-in-out_infinite] delay-200"></div>
              <div className="w-1.5 bg-accent/30 rounded-full h-5 animate-[pulse_1.4s_ease-in-out_infinite] delay-100"></div>
            </div>

            {/* Timer */}
            <div className="text-center mb-10">
              <span className="font-sans font-bold text-3xl text-ink tracking-widest tabular-nums drop-shadow-sm">00:15</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between max-w-xs mx-auto px-4">
              <button 
                className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
                onClick={() => setShowVoiceRecorder(false)}
              >
                Cancel
              </button>
              
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-dusty-rose rounded-full animate-ping opacity-40"></div>
                <div className="absolute inset-0 bg-dusty-rose rounded-full animate-pulse opacity-60 delay-75"></div>
                <button className="relative w-20 h-20 bg-dusty-rose rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 border-4 border-white/40">
                  <div className="w-6 h-6 bg-white rounded-sm shadow-sm"></div>
                </button>
              </div>

              <button 
                className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
                onClick={() => setShowVoiceRecorder(false)}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Overlay */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 overflow-hidden font-manrope">
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

      {/* Sticker/Mood Picker Overlay */}
      {showStickerPicker && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-ink/10 pointer-events-auto backdrop-blur-[2px]"
              onClick={() => setShowStickerPicker(false)}
            ></div>
            <div className="relative bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] w-full max-w-xl mx-auto bottom-sheet pointer-events-auto h-[60vh] flex flex-col">
                <div 
                  className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing"
                  onClick={() => setShowStickerPicker(false)}
                >
                    <div className="w-10 h-1 bg-ink/10 rounded-full"></div>
                </div>
                
                <div className="px-6 pb-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 text-xl">search</span>
                        <input 
                          className="w-full bg-ink/5 border-none rounded-full py-2.5 pl-11 pr-4 text-sm placeholder:text-ink/30 focus:ring-1 focus:ring-sticker-rose/30 transition-all outline-none" 
                          placeholder="Search stickers..." 
                          type="text"
                        />
                    </div>
                </div>

                <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar border-b border-ink/5 pb-2">
                    <button className="flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-accent border-b-2 border-accent pb-2 transition-colors">Love</button>
                    <button className="flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-ink/40 pb-2 hover:text-ink/70 transition-colors">Daily</button>
                    <button className="flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-ink/40 pb-2 hover:text-ink/70 transition-colors">Moods</button>
                    <button className="flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-ink/40 pb-2 hover:text-ink/70 transition-colors">Travel</button>
                    <button className="flex-shrink-0 text-[11px] font-bold uppercase tracking-widest text-ink/40 pb-2 hover:text-ink/70 transition-colors">Nature</button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
                    <div className="grid grid-cols-4 gap-4 pb-20">
                        {['favorite', 'spa', 'storm', 'nightlight', 'sunny', 'pets', 'coffee', 'cake', 'wine_bar', 'flight', 'home', 'camera'].map((icon, idx) => (
                          <button key={idx} className="aspect-square rounded-2xl bg-paper/30 flex items-center justify-center hover:bg-sticker-rose/10 transition-colors group">
                              <span 
                                className="material-symbols-outlined text-4xl text-sticker-rose transition-transform group-hover:scale-110" 
                                style={{fontVariationSettings: "'FILL' 1, 'wght' 300"}}
                              >
                                {icon}
                              </span>
                          </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NewMemory;