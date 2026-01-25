import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useMemoriesQuery } from '../shared/hooks/useMemoriesQuery';
import { LoadingScreen } from '../shared/components/feedback';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  memoryId: string;
  memoryContent: string;
  createdAt: string;
}

// 高德地图安全配置
window._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
};

const MemoryMap: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const AMapRef = useRef<any>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { data: memories = [], isLoading: isLoadingMemories } = useMemoriesQuery();
  const isLoading = isLoadingMemories || !mapReady;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // 初始化高德地图
  useEffect(() => {
    const amapKey = import.meta.env.VITE_AMAP_KEY || '';
    if (!amapKey) {
      console.warn('AMap key not configured. Please set VITE_AMAP_KEY in .env file');
    }
    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.Geolocation'],
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        if (mapContainerRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            viewMode: '2D',
            zoom: 13,
            center: [121.4737, 31.2304], // 默认上海
            mapStyle: 'amap://styles/whitesmoke', // 浅色风格
          });
          setMapReady(true);
        }
      })
      .catch((e) => {
        console.error('地图加载失败:', e);
        // Map failed to load; keep UX responsive
        console.error('地图加载失败:', e);
      });

    return () => {
      // 清理地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  // 获取回忆数据（随轮询更新）
  useEffect(() => {
    const memoriesWithLocations = (memories as any[])
      .filter((m) => m.location && m.location.name && m.location.latitude && m.location.longitude)
      .map((m) => ({
        id: m.id,
        name: m.location!.name,
        latitude: m.location!.latitude!,
        longitude: m.location!.longitude!,
        memoryId: m.id,
        memoryContent: m.content,
        createdAt: m.createdAt,
      }));

    setLocations(memoriesWithLocations);
    if (memoriesWithLocations.length === 0) {
      setSelectedLocation(null);
      return;
    }

    setSelectedLocation((prev) => {
      if (prev) {
        const exists = memoriesWithLocations.find((loc) => loc.id === prev.id);
        if (exists) return prev;
      }
      return memoriesWithLocations[0];
    });
  }, [memories]);

  // 添加标记点
  useEffect(() => {
    if (!mapReady || !mapRef.current || !AMapRef.current || locations.length === 0) return;

    const AMap = AMapRef.current;
    const map = mapRef.current;

    // 清除旧标记
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 创建标记
    locations.forEach((location, index) => {
      const isSelected = selectedLocation?.id === location.id;

      // 自定义标记内容
      const markerContent = document.createElement('div');
      markerContent.className = 'amap-custom-marker';
      markerContent.innerHTML = `
        <div style="
          width: ${isSelected ? 44 : 32}px;
          height: ${isSelected ? 44 : 32}px;
          background: ${isSelected ? '#ac3960' : '#F3C6C6'};
          border: 3px solid ${isSelected ? '#fff' : '#ac3960'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(172, 57, 96, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
        ">
          <span class="material-symbols-outlined" style="
            font-size: ${isSelected ? 20 : 16}px;
            color: ${isSelected ? '#fff' : '#ac3960'};
            font-variation-settings: 'FILL' 1;
          ">favorite</span>
        </div>
        ${
          isSelected
            ? `<div style="
            position: absolute;
            width: 64px;
            height: 64px;
            background: rgba(172, 57, 96, 0.2);
            border-radius: 50%;
            top: -10px;
            left: -10px;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            z-index: -1;
          "></div>`
            : ''
        }
      `;

      const marker = new AMap.Marker({
        position: new AMap.LngLat(location.longitude, location.latitude),
        content: markerContent,
        offset: new AMap.Pixel(isSelected ? -22 : -16, isSelected ? -22 : -16),
        zIndex: isSelected ? 100 : 10,
      });

      marker.on('click', () => {
        setSelectedLocation(location);
        map.setCenter([location.longitude, location.latitude]);
        map.setZoom(15);
      });

      marker.setMap(map);
      markersRef.current.push(marker);

      // 第一个标记时调整视野
      if (index === 0 && locations.length === 1) {
        map.setCenter([location.longitude, location.latitude]);
        map.setZoom(15);
      }
    });

    // 多个标记时自动适应视野
    if (locations.length > 1) {
      const bounds = locations.map((loc) => [loc.longitude, loc.latitude]);
      map.setBounds(new AMap.Bounds(...bounds), false, [60, 60, 60, 60]);
    }
  }, [mapReady, locations, selectedLocation]);

  // 定位到当前位置
  const handleLocateMe = () => {
    if (!mapRef.current || !AMapRef.current) return;

    const AMap = AMapRef.current;
    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        mapRef.current.setCenter([result.position.lng, result.position.lat]);
        mapRef.current.setZoom(15);
      }
    });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#4A2B2B] dark:text-gray-100 font-sans h-screen flex flex-col overflow-hidden selection:bg-dusty-rose/30 relative">
      {isLoading && (
        <div className="absolute inset-0 z-[2000]">
          <LoadingScreen />
        </div>
      )}
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-stone-100 dark:border-zinc-800 shadow-sm transition-all duration-300 flex-none w-full pt-safe">
        <div className="max-w-3xl mx-auto w-full">
          {/* Header Title Area */}
          <div className="pt-6 pb-2 text-center">
            <h1 className="text-3xl font-serif font-medium tracking-tight text-[#4A2B2B] dark:text-zinc-100 italic">Our Footprints</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#8c5a5a] dark:text-zinc-500 uppercase mt-2">
              EXPLORING THE WORLD TOGETHER
            </p>
          </div>
          
          {/* Controls */}
          <div className="px-4 pb-4 mt-4 flex items-center justify-center">
             <div className="w-full bg-stone-100 dark:bg-zinc-900 p-1 rounded-full flex items-center relative">
               <button 
                 onClick={() => navigate('/memory/timeline')}
                 className="flex-1 py-1.5 rounded-full text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300 text-[10px] font-bold tracking-widest uppercase transition-all"
               >
                 Timeline
               </button>
               <button className="flex-1 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-charcoal dark:text-zinc-200 shadow-sm text-[10px] font-bold tracking-widest uppercase transition-all">Map</button>
             </div>
          </div>
        </div>
      </nav>

      {/* Map Container */}
      <main className="flex-1 relative w-full overflow-hidden pb-32">
        {/* 高德地图容器 */}
        <div ref={mapContainerRef} className="w-full h-full" style={{ display: mapReady ? 'block' : 'none', touchAction: 'none' }} />

        {mapReady && locations.length > 0 && selectedLocation && (
          <>
            {/* Selected Location Card */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <div
                className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-soft flex items-center gap-3.5 border border-white/60 transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                onClick={() => navigate(`/memory/${selectedLocation.memoryId}`)}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-black/5">
                  <span className="material-symbols-outlined text-2xl text-primary">location_on</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[16px] font-bold text-charcoal dark:text-zinc-100 leading-tight truncate">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-[13px] text-stone-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{selectedLocation.memoryContent}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[12px] text-primary">calendar_today</span>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                      {formatDate(selectedLocation.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-stone-400">chevron_right</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-3">
              <button
                onClick={handleLocateMe}
                className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center text-stone-600 hover:text-primary transition-colors border border-white/50 active:scale-95"
              >
                <span className="material-symbols-outlined text-[24px]">my_location</span>
              </button>
              <button
                onClick={() => navigate('/memory/new')}
                className="w-12 h-12 bg-wine rounded-2xl shadow-soft flex items-center justify-center text-white hover:bg-wine/90 transition-colors border border-white/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[26px]">add</span>
              </button>
            </div>
          </>
        )}

        {mapReady && locations.length === 0 && !isLoadingMemories && (
          /* Empty State */
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[500]">
            <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-soft flex flex-col items-center text-center w-full max-w-[320px] border border-white/60 dark:border-zinc-700 animate-float-gentle">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-primary/30 to-background-light dark:to-zinc-800 rounded-full flex items-center justify-center ring-1 ring-white dark:ring-zinc-700">
                  <span className="material-symbols-outlined text-[42px] text-primary drop-shadow-sm">luggage</span>
                </div>
                <div className="absolute right-0 -top-1 bg-white dark:bg-zinc-800 rounded-full p-1.5 shadow-md border border-primary/40 transform rotate-12">
                  <span
                    className="material-symbols-outlined text-[18px] text-primary filled"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </div>
              </div>
              <h2 className="font-serif text-2xl font-bold text-charcoal dark:text-zinc-100 mb-3">No footprints yet</h2>
              <p className="text-stone-500 dark:text-zinc-400 font-medium text-[15px] leading-relaxed px-4 mb-8">
                Mark your first location in a story!
              </p>
              <button
                onClick={() => navigate('/memory/new')}
                className="w-full py-4 bg-wine hover:bg-wine/90 active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-wine/20 transition-all flex items-center justify-center gap-2.5 group"
              >
                <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">
                  add_location_alt
                </span>
                Create Story
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 pb-8 pt-4 z-50 flex justify-center">
        <div className="flex items-center justify-around max-w-3xl w-full px-4">
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">home</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 group w-16">
            <div className="bg-primary/10 rounded-2xl px-4 py-1 flex flex-col items-center">
              <span className="material-symbols-outlined text-primary text-[26px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            <span className="text-[10px] font-bold text-primary">Memories</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/milestones')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">flag</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Milestones</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 group w-16"
            onClick={() => navigate('/settings')}
          >
            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors text-[26px]">settings</span>
            <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-300">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryMap;
