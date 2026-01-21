import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import { memoriesApi } from '../shared/api/client';

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
        setIsLoading(false);
      });

    return () => {
      // 清理地图实例
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  // 获取回忆数据
  useEffect(() => {
    const fetchMemoriesWithLocations = async () => {
      try {
        const response = await memoriesApi.list(1, 100);
        const memoriesWithLocations = (response.data.data || [])
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
        if (memoriesWithLocations.length > 0) {
          setSelectedLocation(memoriesWithLocations[0]);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemoriesWithLocations();
  }, []);

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
    <div className="bg-cream text-[#4a4244] font-sans h-screen flex flex-col overflow-hidden selection:bg-map-primary/20">
      {/* Header */}
      <header className="relative z-[1000] pt-14 pb-4 flex flex-col items-center bg-cream w-full shrink-0 border-b border-stone-100/50">
        <div className="flex flex-col items-center gap-4 w-full px-6">
          <h1 className="font-serif text-3xl font-bold text-[#2c2426] tracking-tight">Memories</h1>
          <div className="flex items-center p-1 bg-white rounded-full border border-stone-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] w-[240px] relative">
            <button
              onClick={() => navigate('/memory/timeline')}
              className="flex-1 py-2 rounded-full text-[15px] font-medium text-[#9e8c93] hover:text-map-primary transition-colors font-serif"
            >
              Timeline
            </button>
            <button className="flex-1 py-2 rounded-full text-[15px] font-bold text-map-primary bg-map-rose shadow-[0_2px_8px_rgba(172,57,96,0.15)] font-serif">
              Map
            </button>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <main className="flex-1 relative w-full overflow-hidden">
        {isLoading && !mapReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-map-bg">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-map-rose border-t-map-primary rounded-full animate-spin"></div>
              <p className="text-[#9e8c93] font-medium">Loading map...</p>
            </div>
          </div>
        ) : null}

        {/* 高德地图容器 */}
        <div ref={mapContainerRef} className="w-full h-full" style={{ display: mapReady ? 'block' : 'none' }} />

        {mapReady && locations.length > 0 && selectedLocation && (
          <>
            {/* Selected Location Card */}
            <div className="absolute top-4 left-4 right-4 z-[1000]">
              <div
                className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-map-float flex items-center gap-3.5 border border-white/60 transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                onClick={() => navigate(`/memory/${selectedLocation.memoryId}`)}
              >
                <div className="w-14 h-14 rounded-xl bg-map-rose/30 flex items-center justify-center shrink-0 shadow-inner ring-1 ring-black/5">
                  <span className="material-symbols-outlined text-2xl text-map-primary">location_on</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-[16px] font-bold text-[#2c2426] leading-tight truncate">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-[13px] text-[#9e8c93] mt-0.5 line-clamp-1">{selectedLocation.memoryContent}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[12px] text-map-rose">calendar_today</span>
                    <p className="text-[11px] font-semibold text-map-primary uppercase tracking-wide">
                      {formatDate(selectedLocation.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-[#9e8c93]">chevron_right</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-28 right-4 z-[1000] flex flex-col gap-3">
              <button
                onClick={handleLocateMe}
                className="w-12 h-12 bg-white rounded-2xl shadow-map-soft flex items-center justify-center text-[#5c4048] hover:text-map-primary transition-colors border border-white/50 active:scale-95"
              >
                <span className="material-symbols-outlined text-[24px]">my_location</span>
              </button>
              <button
                onClick={() => navigate('/memory/new')}
                className="w-12 h-12 bg-map-primary rounded-2xl shadow-map-soft flex items-center justify-center text-white hover:bg-[#8a2d4d] transition-colors border border-white/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[26px]">add</span>
              </button>
            </div>
          </>
        )}

        {mapReady && locations.length === 0 && !isLoading && (
          /* Empty State */
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[500]">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2.5rem] shadow-float flex flex-col items-center text-center w-full max-w-[320px] border border-white/60 animate-float-gentle">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-map-rose/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-gradient-to-tr from-map-rose/30 to-[#fff0f0] rounded-full flex items-center justify-center ring-1 ring-white">
                  <span className="material-symbols-outlined text-[42px] text-map-primary drop-shadow-sm">luggage</span>
                </div>
                <div className="absolute right-0 -top-1 bg-white rounded-full p-1.5 shadow-md border border-map-rose/40 transform rotate-12">
                  <span
                    className="material-symbols-outlined text-[18px] text-map-primary filled"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    favorite
                  </span>
                </div>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2c2426] mb-3">No footprints yet</h2>
              <p className="text-[#9e8c93] font-medium text-[15px] leading-relaxed px-4 mb-8">
                Mark your first location in a story!
              </p>
              <button
                onClick={() => navigate('/record-type')}
                className="w-full py-4 bg-map-primary hover:bg-[#8a2d4d] active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-map-primary/20 transition-all flex items-center justify-center gap-2.5 group"
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

      {/* Navigation */}
      <nav className="glass-panel fixed bottom-0 w-full pb-8 pt-4 px-8 flex justify-between items-center z-[1001] rounded-t-[32px] shadow-map-nav">
        <button className="group flex flex-col items-center gap-1.5 w-16" onClick={() => navigate('/dashboard')}>
          <span className="material-symbols-outlined text-[#9e8c93] group-hover:text-map-primary transition-colors text-[26px]">
            home
          </span>
          <span className="text-[11px] font-medium text-[#9e8c93] group-hover:text-map-primary">Home</span>
        </button>
        <button className="group flex flex-col items-center gap-1.5 w-16 relative top-[-4px]">
          <div className="absolute -top-1 w-12 h-12 bg-map-primary/5 rounded-full scale-110 blur-sm"></div>
          <span
            className="material-symbols-outlined text-map-primary text-[28px] filled drop-shadow-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span className="text-[11px] font-bold text-map-primary">Memories</span>
        </button>
        <button className="group flex flex-col items-center gap-1.5 w-16" onClick={() => navigate('/settings')}>
          <span className="material-symbols-outlined text-[#9e8c93] group-hover:text-map-primary transition-colors text-[26px]">
            settings
          </span>
          <span className="text-[11px] font-medium text-[#9e8c93] group-hover:text-map-primary">Settings</span>
        </button>
      </nav>
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-map-cream/30 to-transparent pointer-events-none z-[1000]"></div>
    </div>
  );
};

export default MemoryMap;
