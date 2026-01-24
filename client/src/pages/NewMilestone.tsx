import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AMapLoader from '@amap/amap-jsapi-loader';
import { milestonesApi, uploadApi } from '../shared/api/client';
import { MILESTONES_QUERY_KEY } from '../shared/hooks/useMilestonesQuery';

// 高德地图安全配置
window._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
};

interface POIResult {
  id: string;
  name: string;
  address: string;
  location: {
    lng: number;
    lat: number;
  };
  type: string;
  distance?: number;
}

const NewMilestone: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Milestone');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ name: string; address?: string; latitude?: number; longitude?: number } | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 高德地图 POI 搜索相关
  const [poiResults, setPOIResults] = useState<POIResult[]>([]);
  const [nearbyPOIs, setNearbyPOIs] = useState<POIResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{ lng: number; lat: number } | null>(null);
  const AMapRef = useRef<any>(null);
  const placeSearchRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化高德地图 SDK
  useEffect(() => {
    const amapKey = import.meta.env.VITE_AMAP_KEY || '';
    if (!amapKey) {
      console.warn('AMap key not configured');
      return;
    }
    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder'],
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        placeSearchRef.current = new AMap.PlaceSearch({
          pageSize: 10,
          pageIndex: 1,
          extensions: 'all',
        });
      })
      .catch((e) => {
        console.error('高德地图加载失败:', e);
      });
  }, []);

  // 获取当前位置和附近 POI
  useEffect(() => {
    if (showLocationPicker && AMapRef.current && !currentPosition) {
      setIsLoadingNearby(true);
      const AMap = AMapRef.current;
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          const pos = { lng: result.position.lng, lat: result.position.lat };
          setCurrentPosition(pos);
          searchNearbyPOIs(pos);
        } else {
          setIsLoadingNearby(false);
        }
      });
    }
  }, [showLocationPicker]);

  // 搜索附近 POI
  const searchNearbyPOIs = useCallback((position: { lng: number; lat: number }) => {
    if (!placeSearchRef.current) return;

    placeSearchRef.current.searchNearBy(
      '',
      [position.lng, position.lat],
      1000,
      (status: string, result: any) => {
        setIsLoadingNearby(false);
        if (status === 'complete' && result.poiList) {
          const pois: POIResult[] = result.poiList.pois.map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.type,
            location: {
              lng: poi.location.lng,
              lat: poi.location.lat,
            },
            type: poi.type,
            distance: poi.distance,
          }));
          setNearbyPOIs(pois);
        }
      }
    );
  }, []);

  // 关键词搜索 POI（带防抖）
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!locationSearch.trim()) {
      setPOIResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (placeSearchRef.current && locationSearch.trim()) {
        setIsSearching(true);
        placeSearchRef.current.search(locationSearch, (status: string, result: any) => {
          setIsSearching(false);
          if (status === 'complete' && result.poiList) {
            const pois: POIResult[] = result.poiList.pois.map((poi: any) => ({
              id: poi.id,
              name: poi.name,
              address: poi.address || poi.type,
              location: {
                lng: poi.location.lng,
                lat: poi.location.lat,
              },
              type: poi.type,
            }));
            setPOIResults(pois);
          } else {
            setPOIResults([]);
          }
        });
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [locationSearch]);

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return isToday ? `Today, ${formatted}` : formatted;
  };

  const handleSelectLocation = (name: string, address?: string, latitude?: number, longitude?: number) => {
    setLocation({ name, address, latitude, longitude });
    setLocationSearch('');
    setShowLocationPicker(false);
  };

  // 选择 POI 位置
  const handleSelectPOI = (poi: POIResult) => {
    setLocation({
      name: poi.name,
      address: poi.address,
      latitude: poi.location.lat,
      longitude: poi.location.lng,
    });
    setLocationSearch('');
    setPOIResults([]);
    setShowLocationPicker(false);
  };

  // 使用自定义位置名称
  const handleUseCustomLocation = () => {
    if (!locationSearch.trim()) return;
    if (currentPosition) {
      setLocation({
        name: locationSearch.trim(),
        latitude: currentPosition.lat,
        longitude: currentPosition.lng,
      });
    } else {
      setLocation({
        name: locationSearch.trim(),
      });
    }
    setLocationSearch('');
    setPOIResults([]);
    setShowLocationPicker(false);
  };

  // 使用当前位置
  const handleUseCurrentLocation = () => {
    if (!AMapRef.current) return;

    const AMap = AMapRef.current;
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        const { lng, lat } = result.position;
        const geocoder = new AMap.Geocoder();
        geocoder.getAddress([lng, lat], (geoStatus: string, geoResult: any) => {
          if (geoStatus === 'complete' && geoResult.regeocode) {
            const address = geoResult.regeocode.formattedAddress;
            const poi = geoResult.regeocode.pois?.[0];
            setLocation({
              name: poi?.name || 'Current Location',
              address: address,
              latitude: lat,
              longitude: lng,
            });
          } else {
            setLocation({
              name: 'Current Location',
              latitude: lat,
              longitude: lng,
            });
          }
          setShowLocationPicker(false);
        });
      }
    });
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getIconForType = (type: string) => {
    if (type.includes('餐') || type.includes('食')) return 'restaurant';
    if (type.includes('咖啡') || type.includes('茶')) return 'local_cafe';
    if (type.includes('酒店') || type.includes('宾馆')) return 'hotel';
    if (type.includes('公园') || type.includes('景')) return 'park';
    if (type.includes('商场') || type.includes('购物')) return 'shopping_bag';
    return 'location_on';
  };

  // 要显示的 POI 列表
  const displayPOIs = locationSearch.trim() ? poiResults : nearbyPOIs;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadApi.uploadFile(file));
      const results = await Promise.all(uploadPromises);
      setPhotos(prev => [...prev, ...results.map(r => r.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const defaultCategories = [
    { icon: 'celebration', label: 'Milestone' },
    { icon: 'flight', label: 'Trip' },
    { icon: 'favorite_border', label: 'Anniversary' },
    { icon: 'home', label: 'Life Event' },
  ];

  const allCategories = [
    ...defaultCategories,
    ...customCategories.map(cat => ({ icon: 'bookmark', label: cat })),
  ];

  const handleAddCustomCategory = () => {
    if (!customCategory.trim()) return;
    if (allCategories.some(cat => cat.label.toLowerCase() === customCategory.trim().toLowerCase())) {
      return; // Already exists
    }
    setCustomCategories(prev => [...prev, customCategory.trim()]);
    setType(customCategory.trim());
    setCustomCategory('');
    setShowCustomCategoryModal(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await milestonesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        type,
        photos: photos.length > 0 ? photos : undefined,
        location: location || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: MILESTONES_QUERY_KEY });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="bg-milestone-pink hover:bg-milestone-pink/90 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-milestone-pink/20 transition-all transform active:scale-95 flex items-center gap-1 disabled:opacity-50"
          >
            <span>{isLoading ? 'Saving...' : 'Save'}</span>
          </button>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 flex flex-col px-6 pb-10 pt-2 gap-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Hero Cover Photo Slot */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden group cursor-pointer transition-all">
            {photos.length > 0 ? (
              /* Show uploaded photos */
              <div className="absolute inset-0">
                <img
                  src={photos[0]}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with photo count and actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-white text-sm font-medium">
                      {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-white/30 transition-colors"
                      >
                        Add more
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(0)}
                        className="px-3 py-1.5 bg-red-500/80 backdrop-blur-sm text-white text-sm font-medium rounded-full hover:bg-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
                {/* Photo thumbnails if multiple */}
                {photos.length > 1 && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    {photos.slice(1, 4).map((photo, index) => (
                      <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(index + 1);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}
                    {photos.length > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-white text-xs font-bold">+{photos.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state - upload prompt */
              <>
                <div className="absolute inset-0 border-[1.5px] border-dashed border-gold/40 rounded-2xl group-hover:border-gold/70 transition-colors"></div>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="absolute inset-0 bg-gold/5 dark:bg-gold/10 flex flex-col items-center justify-center gap-4 p-6 transition-colors group-hover:bg-gold/10 dark:group-hover:bg-gold/20"
                >
                  {isUploading ? (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-900 dark:text-zinc-100 text-base font-bold">Uploading...</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Please wait</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-gold">
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-900 dark:text-zinc-100 text-base font-bold">Add Cover Photo</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Capture the essence of this moment</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {/* Date Picker Pill */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="group flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:border-gold/30 transition-all"
              >
                <span className="material-symbols-outlined text-gold text-[20px]">calendar_month</span>
                <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 group-hover:text-milestone-pink transition-colors">{formatDisplayDate(date)}</span>
                <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-[16px]">edit</span>
              </button>
              {showDatePicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700 p-4 z-50">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setShowDatePicker(false);
                    }}
                    className="bg-transparent border border-zinc-200 dark:border-zinc-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-milestone-pink/30"
                  />
                </div>
              )}
            </div>
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Categorization Tags */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Categorize</p>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const isActive = type === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setType(cat.label)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-milestone-pink text-white shadow-md shadow-milestone-pink/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-gold/10 hover:text-gold'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
              <button
                onClick={() => setShowCustomCategoryModal(true)}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 hover:border-milestone-pink hover:text-milestone-pink transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          {/* Location (Optional Footer Item) */}
          <div className="mt-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
            {location ? (
              <div className="flex items-center gap-3 w-full p-3 rounded-xl bg-gold/5 border border-gold/20">
                <div className="size-10 rounded-full bg-gold flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{location.name}</span>
                  {location.address && (
                    <span className="text-xs text-zinc-400">{location.address}</span>
                  )}
                </div>
                <button
                  onClick={() => setLocation(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-zinc-400 text-[18px]">close</span>
                </button>
              </div>
            ) : (
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
            )}
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
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                            />
                            {locationSearch && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setLocationSearch('')}>
                                  <span className="material-symbols-outlined text-loc-primary/40 text-sm bg-loc-primary/10 rounded-full p-1 hover:bg-loc-primary/20 transition-colors">close</span>
                              </div>
                            )}
                        </div>
                        {/* Custom location input */}
                        {locationSearch.trim() && (
                          <button
                            className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-loc-primary/10 hover:bg-loc-primary/20 transition-colors text-left"
                            onClick={handleUseCustomLocation}
                          >
                            <span className="material-symbols-outlined text-loc-primary">add_location</span>
                            <span className="text-loc-text font-medium">Use "{locationSearch}"</span>
                          </button>
                        )}
                    </div>

                    {/* Scrollable List Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-8">
                        {/* Loading State */}
                        {(isSearching || isLoadingNearby) && (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-loc-primary"></div>
                          </div>
                        )}

                        {/* POI Results */}
                        {!isSearching && !isLoadingNearby && displayPOIs.length > 0 && (
                          <div>
                            <div className="px-4 pb-2 pt-2">
                              <h3 className="text-loc-text dark:text-gray-200 text-sm font-bold uppercase tracking-wider opacity-80">
                                {locationSearch.trim() ? 'Search Results' : 'Nearby Places'}
                              </h3>
                            </div>
                            <div className="flex flex-col gap-1">
                              {displayPOIs.map((poi) => (
                                <button
                                  key={poi.id}
                                  className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-loc-primary/5 transition-colors text-left"
                                  onClick={() => handleSelectPOI(poi)}
                                >
                                  <div className="shrink-0 size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-white group-hover:shadow-md group-hover:text-loc-primary transition-all duration-300">
                                    <span className="material-symbols-outlined text-[20px]">{getIconForType(poi.type)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-loc-text dark:text-gray-100 font-bold text-base truncate">{poi.name}</p>
                                    <p className="text-loc-sub dark:text-gray-400 text-sm truncate">
                                      {poi.address}
                                      {poi.distance && ` • ${formatDistance(poi.distance)}`}
                                    </p>
                                  </div>
                                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-symbols-outlined text-loc-primary text-sm">arrow_forward_ios</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {!isSearching && !isLoadingNearby && locationSearch.trim() && displayPOIs.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-loc-primary/30 mb-3">search_off</span>
                            <p className="text-loc-sub font-medium">No places found</p>
                            <p className="text-loc-sub/60 text-sm mt-1">Try a different search term</p>
                          </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/30 bg-loc-bg dark:bg-loc-bg-dark rounded-b-[2rem]">
                        <button
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-loc-primary/30 text-loc-primary font-bold hover:bg-loc-primary/5 transition-colors"
                            onClick={handleUseCurrentLocation}
                        >
                            <span className="material-symbols-outlined text-[20px]">my_location</span>
                            <span>Use current location</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* Custom Category Modal */}
      {showCustomCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCustomCategoryModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Add Custom Category</h3>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g., First Date, Proposal..."
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-milestone-pink/30"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomCategory();
                }
              }}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setCustomCategory('');
                  setShowCustomCategoryModal(false);
                }}
                className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomCategory}
                disabled={!customCategory.trim()}
                className="flex-1 py-3 rounded-xl bg-milestone-pink text-white font-bold hover:bg-milestone-pink/90 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewMilestone;