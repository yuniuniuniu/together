import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AMapLoader from '@amap/amap-jsapi-loader';
import { memoriesApi, uploadApi } from '../shared/api/client';
import { MEMORIES_QUERY_KEY } from '../shared/hooks/useMemoriesQuery';

// 高德地图安全配置
window._AMapSecurityConfig = {
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
};

interface LocationData {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

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

const EditMemory: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Happy');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [originalDate, setOriginalDate] = useState<string>('');
  const [stickers, setStickers] = useState<string[]>([]);

  // Photo upload states
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const shouldSaveRef = React.useRef<boolean>(true);
  const streamRef = React.useRef<MediaStream | null>(null);

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
      .catch(() => {});
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

  // Fetch existing memory data
  useEffect(() => {
    const fetchMemory = async () => {
      if (!id) return;
      try {
        const response = await memoriesApi.getById(id);
        const memory = response.data;
        setContent(memory.content);
        setMood(memory.mood || 'Happy');
        setPhotos(memory.photos || []);
        setLocation(memory.location || null);
        setVoiceNote(memory.voiceNote || null);
        setStickers(memory.stickers || []);
        setOriginalDate(memory.createdAt);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load memory');
      } finally {
        setIsFetching(false);
      }
    };
    fetchMemory();
  }, [id]);

  const handleSave = async () => {
    if (!content.trim() || !id) {
      setError('Please write something before saving');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await memoriesApi.update(id, {
        content: content.trim(),
        mood,
        photos: photos.length > 0 ? photos : undefined,
        location: location || undefined,
        voiceNote: voiceNote || undefined,
        stickers: stickers.length > 0 ? stickers : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY });
      navigate(`/memory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setIsLoading(false);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

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

  // 使用当前位置（带反向地理编码）
  const handleUseCurrentLocation = () => {
    if (!AMapRef.current) {
      setError('Map service not ready');
      return;
    }

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
      } else {
        setError('Unable to get your location');
      }
    });
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      shouldSaveRef.current = true;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Only save if shouldSaveRef is true (not cancelled)
        if (shouldSaveRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsUploadingVoice(true);
          try {
            const result = await uploadApi.uploadAudio(audioBlob);
            setVoiceNote(result.url);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload voice note');
          } finally {
            setIsUploadingVoice(false);
          }
        }
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      setError('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      shouldSaveRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    // Set flag to NOT save the recording
    shouldSaveRef.current = false;

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Also stop the stream directly if still active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setShowVoiceRecorder(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
    if (type.includes('医院') || type.includes('诊所')) return 'local_hospital';
    if (type.includes('学校') || type.includes('教育')) return 'school';
    if (type.includes('银行')) return 'account_balance';
    if (type.includes('地铁') || type.includes('公交')) return 'directions_transit';
    return 'location_on';
  };

  const moods = [
    { icon: 'sentiment_very_satisfied', label: 'Happy' },
    { icon: 'self_improvement', label: 'Calm' },
    { icon: 'favorite', label: 'Together' },
    { icon: 'auto_awesome', label: 'Excited' },
    { icon: 'filter_drama', label: 'Moody' },
  ];

  // Available stickers by category
  const stickerCategories = {
    Love: ['favorite', 'heart_plus', 'spa', 'nest_heat_link_e'],
    Daily: ['coffee', 'cake', 'restaurant', 'local_bar'],
    Moods: ['sentiment_satisfied', 'mood', 'sentiment_very_satisfied', 'sentiment_calm'],
    Travel: ['flight', 'hotel', 'beach_access', 'hiking'],
    Nature: ['sunny', 'storm', 'nightlight', 'pets'],
  };

  const [stickerCategory, setStickerCategory] = useState<keyof typeof stickerCategories>('Love');

  const handleStickerSelect = (sticker: string) => {
    if (stickers.includes(sticker)) {
      setStickers(prev => prev.filter(s => s !== sticker));
    } else {
      setStickers(prev => [...prev, sticker]);
    }
  };

  // 要显示的 POI 列表
  const displayPOIs = locationSearch.trim() ? poiResults : nearbyPOIs;

  if (isFetching) {
    return (
      <div className="flex-1 flex flex-col bg-paper min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-soft-gray text-sm mt-4">Loading memory...</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-paper min-h-screen relative font-sans ${showStickerPicker ? 'overflow-hidden' : ''}`}>
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-paper/80 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="text-ink/60 text-sm font-medium hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <h1 className="text-ink text-sm font-bold uppercase tracking-widest opacity-80">Edit Memory</h1>
        <button
          onClick={handleSave}
          disabled={isLoading || !content.trim()}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </header>

      <main className="flex-1 flex flex-col w-full px-6 pb-24 overflow-y-auto no-scrollbar">
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2 text-accent/60 text-[10px] font-bold uppercase tracking-widest">
            <span>{originalDate ? new Date(originalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
          </div>
        </div>

        <div className="flex-1">
          <textarea
            className="w-full bg-transparent border-none focus:ring-0 text-ink text-xl leading-relaxed placeholder:text-ink/20 resize-none min-h-[120px] p-0 font-serif"
            placeholder="Dear You... what's on your mind today?"
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>

        <div className="py-8">
          <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-4">Attach Moments</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
            {photos.map((photo, index) => (
              <div key={index} className="flex-shrink-0 w-32">
                <div className="bg-white p-2 pb-6 rounded-sm shadow-sm transition-transform active:scale-95" style={{ transform: `rotate(${(index % 3 - 1) * 2}deg)` }}>
                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-sm relative group">
                    <img
                      alt={`Memory ${index + 1}`}
                      className="w-full h-full object-cover grayscale-[20%] sepia-[10%]"
                      src={photo}
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex-shrink-0 w-32">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-white p-2 pb-6 rounded-sm shadow-sm rotate-[1deg] w-full flex flex-col items-center transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="aspect-square w-full bg-[#fdfaf7] border border-dashed border-ink/10 rounded-sm flex items-center justify-center hover:bg-gray-50">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  ) : (
                    <span className="material-symbols-outlined text-ink/20 text-3xl">add_a_photo</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-ink/5">
          <h3 className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-6 text-center">How are you feeling together?</h3>
          <div className="flex justify-between items-center px-2">
            {moods.map((m) => {
              const isActive = mood === m.label;
              return (
                <button
                  key={m.label}
                  onClick={() => setMood(m.label)}
                  className={`flex flex-col items-center gap-2 group ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-primary/30 text-accent' : 'bg-white/50 text-ink/40 group-hover:bg-white'}`}>
                    <span className="material-symbols-outlined text-2xl" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>{m.icon}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'text-accent' : 'text-ink/30'}`}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-ink/30 text-[10px] font-medium italic">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Only visible to you and your partner</span>
          </div>
        </div>
      </main>

      {/* Location Badge */}
      {location && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-primary/20 z-40 max-w-[80%]">
          <span className="material-symbols-outlined text-accent text-sm">location_on</span>
          <span className="text-sm font-medium text-ink truncate">{location.name}</span>
          {location.latitude && (
            <span className="material-symbols-outlined text-green-500 text-xs">check_circle</span>
          )}
          <button
            onClick={() => setLocation(null)}
            className="ml-1 text-ink/40 hover:text-ink transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Voice Note Badge */}
      {voiceNote && !showVoiceRecorder && (
        <div className="fixed bottom-24 right-6 bg-white/90 backdrop-blur-lg rounded-full px-4 py-2 flex items-center gap-2 shadow-lg border border-accent/20 z-40">
          <span className="material-symbols-outlined text-accent text-sm">mic</span>
          <span className="text-sm font-medium text-ink">Voice note attached</span>
          <button
            onClick={() => setVoiceNote(null)}
            className="ml-1 text-ink/40 hover:text-ink transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-fit bg-ink/5 backdrop-blur-lg rounded-full px-6 py-3 flex items-center gap-6 shadow-xl border border-white/20 z-40">
        <button
          className={`${location ? 'text-accent' : 'text-ink/60 hover:text-accent'} transition-colors`}
          onClick={() => setShowLocationPicker(true)}
        >
          <span className="material-symbols-outlined" style={location ? { fontVariationSettings: "'FILL' 1" } : {}}>location_on</span>
        </button>
        <button
          className={`relative ${showStickerPicker || stickers.length > 0 ? 'text-accent' : 'text-ink/60 hover:text-accent'} transition-colors`}
          onClick={() => setShowStickerPicker(!showStickerPicker)}
        >
          <span
            className="material-symbols-outlined"
            style={showStickerPicker || stickers.length > 0 ? {fontVariationSettings: "'FILL' 1"} : {}}
          >
            sentiment_satisfied
          </span>
          {stickers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {stickers.length}
            </span>
          )}
        </button>
        <button
          className="text-ink/60 hover:text-accent transition-colors"
          onClick={() => setShowVoiceRecorder(true)}
        >
          <span className="material-symbols-outlined">mic</span>
        </button>
        <div className="w-px h-4 bg-ink/10"></div>
        <span className="text-[10px] font-bold text-ink/40">{content.trim().split(/\s+/).filter(Boolean).length} words</span>
      </div>

      {/* Voice Recorder Overlay */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto bg-ink/5 backdrop-blur-[2px]">
          <div className="absolute inset-0 z-0" onClick={() => !isRecording && !isUploadingVoice && setShowVoiceRecorder(false)}></div>
          <div className="relative w-full bg-paper/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 pb-12 pt-8 px-6 transition-all duration-300 transform translate-y-0">
            <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-8"></div>

            {/* Title */}
            <h3 className="text-center text-ink font-bold text-lg mb-6">
              {isUploadingVoice ? 'Uploading...' : voiceNote && !isRecording ? 'Voice Note Ready' : isRecording ? 'Recording...' : 'Voice Note'}
            </h3>

            <div className="flex items-center justify-center gap-[3px] h-16 mb-8 px-8">
              {isUploadingVoice ? (
                // Uploading state - spinner
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : isRecording ? (
                <>
                  <div className="w-1.5 bg-accent/30 rounded-full h-4 animate-[pulse_1s_ease-in-out_infinite]"></div>
                  <div className="w-1.5 bg-accent/40 rounded-full h-8 animate-[pulse_1.2s_ease-in-out_infinite] delay-75"></div>
                  <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_0.8s_ease-in-out_infinite] delay-100"></div>
                  <div className="w-1.5 bg-accent rounded-full h-16 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                  <div className="w-1.5 bg-accent/80 rounded-full h-10 animate-[pulse_1.1s_ease-in-out_infinite] delay-150"></div>
                  <div className="w-1.5 bg-accent/60 rounded-full h-14 animate-[pulse_0.9s_ease-in-out_infinite] delay-75"></div>
                  <div className="w-1.5 bg-accent/40 rounded-full h-6 animate-[pulse_1.3s_ease-in-out_infinite]"></div>
                  <div className="w-1.5 bg-accent/50 rounded-full h-12 animate-[pulse_1s_ease-in-out_infinite] delay-200"></div>
                  <div className="w-1.5 bg-accent/30 rounded-full h-5 animate-[pulse_1.4s_ease-in-out_infinite] delay-100"></div>
                </>
              ) : voiceNote ? (
                // Static waveform for completed upload
                <>
                  <div className="w-1.5 bg-green-400/30 rounded-full h-4"></div>
                  <div className="w-1.5 bg-green-400/40 rounded-full h-8"></div>
                  <div className="w-1.5 bg-green-400/50 rounded-full h-12"></div>
                  <div className="w-1.5 bg-green-500 rounded-full h-16"></div>
                  <div className="w-1.5 bg-green-400/80 rounded-full h-10"></div>
                  <div className="w-1.5 bg-green-400/60 rounded-full h-14"></div>
                  <div className="w-1.5 bg-green-400/40 rounded-full h-6"></div>
                  <div className="w-1.5 bg-green-400/50 rounded-full h-12"></div>
                  <div className="w-1.5 bg-green-400/30 rounded-full h-5"></div>
                </>
              ) : (
                // Inactive waveform
                <>
                  <div className="w-1.5 bg-ink/10 rounded-full h-4"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-8"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-12"></div>
                  <div className="w-1.5 bg-ink/20 rounded-full h-16"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-10"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-14"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-6"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-12"></div>
                  <div className="w-1.5 bg-ink/10 rounded-full h-5"></div>
                </>
              )}
            </div>

            <div className="text-center mb-10">
              <span className="font-sans font-bold text-3xl text-ink tracking-widest tabular-nums drop-shadow-sm">{formatTime(recordingTime)}</span>
            </div>

            <div className="flex items-center justify-between max-w-xs mx-auto px-4">
              <button
                className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
                onClick={cancelRecording}
                disabled={isUploadingVoice}
              >
                Cancel
              </button>

              <div className="relative group cursor-pointer" onClick={isRecording ? stopRecording : !voiceNote && !isUploadingVoice ? startRecording : undefined}>
                {isRecording && (
                  <>
                    <div className="absolute inset-0 bg-dusty-rose rounded-full animate-ping opacity-40"></div>
                    <div className="absolute inset-0 bg-dusty-rose rounded-full animate-pulse opacity-60 delay-75"></div>
                  </>
                )}
                <button
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 border-4 border-white/40 ${
                    voiceNote && !isRecording ? 'bg-green-500' : 'bg-dusty-rose'
                  }`}
                  disabled={voiceNote && !isRecording || isUploadingVoice}
                >
                  {isRecording ? (
                    <div className="w-6 h-6 bg-white rounded-sm shadow-sm"></div>
                  ) : voiceNote ? (
                    <span className="material-symbols-outlined text-white text-3xl">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-white text-3xl">mic</span>
                  )}
                </button>
              </div>

              <button
                className="text-accent font-bold text-xs uppercase tracking-widest hover:text-accent/80 transition-colors py-4 disabled:opacity-30 disabled:text-ink/40"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setShowVoiceRecorder(false);
                }}
                disabled={(!voiceNote && !isRecording) || isUploadingVoice}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Overlay */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 overflow-hidden font-manrope">
          <div className="absolute inset-0 z-0" onClick={() => setShowLocationPicker(false)}>
            <div className="w-full h-full bg-loc-bg"></div>
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
            <div className="pointer-events-auto w-full bg-loc-bg dark:bg-loc-bg-dark rounded-t-[2rem] shadow-soft-up flex flex-col h-[85%] transition-transform duration-300 ease-out transform translate-y-0">

              <div
                className="w-full flex items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing"
                onClick={() => setShowLocationPicker(false)}
              >
                <div className="w-12 h-1.5 bg-[#dfd7d9] rounded-full"></div>
              </div>

              <div className="px-6 pb-4 pt-2 shrink-0">
                <h2 className="text-loc-text dark:text-gray-100 text-2xl font-bold tracking-tight mb-4">Add Location</h2>
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

              <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-8">
                {(isSearching || isLoadingNearby) && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-loc-primary"></div>
                  </div>
                )}

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

                {!isSearching && !isLoadingNearby && locationSearch.trim() && displayPOIs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-loc-primary/30 mb-3">search_off</span>
                    <p className="text-loc-sub font-medium">No places found</p>
                    <p className="text-loc-sub/60 text-sm mt-1">Try a different search term</p>
                  </div>
                )}
              </div>

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

            {stickers.length > 0 && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-ink/40 font-medium">Selected:</span>
                  {stickers.map((sticker, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
                      <span className="material-symbols-outlined text-lg text-primary" style={{fontVariationSettings: "'FILL' 1"}}>{sticker}</span>
                      <button onClick={() => handleStickerSelect(sticker)} className="text-ink/40 hover:text-ink">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar border-b border-ink/5 pb-2">
              {(Object.keys(stickerCategories) as Array<keyof typeof stickerCategories>).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setStickerCategory(cat)}
                  className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-widest pb-2 transition-colors ${
                    stickerCategory === cat
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-ink/40 hover:text-ink/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <div className="grid grid-cols-4 gap-4 pb-20">
                {stickerCategories[stickerCategory].map((icon, idx) => {
                  const isSelected = stickers.includes(icon);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleStickerSelect(icon)}
                      className={`aspect-square rounded-2xl flex items-center justify-center transition-colors group ${
                        isSelected ? 'bg-primary/20 ring-2 ring-primary' : 'bg-paper/30 hover:bg-sticker-rose/10'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-4xl transition-transform group-hover:scale-110 ${
                          isSelected ? 'text-primary' : 'text-sticker-rose'
                        }`}
                        style={{fontVariationSettings: "'FILL' 1, 'wght' 300"}}
                      >
                        {icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 pt-2">
              <button
                onClick={() => setShowStickerPicker(false)}
                className="w-full py-3 bg-primary text-white rounded-full font-bold"
              >
                Done {stickers.length > 0 && `(${stickers.length} selected)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMemory;
