import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AMapLoader from '@amap/amap-jsapi-loader';
import Cropper, { type Area } from 'react-easy-crop';
import { memoriesApi, uploadApi } from '../shared/api/client';
import { MEMORIES_QUERY_KEY } from '../shared/hooks/useMemoriesQuery';
import UnifiedDatePicker from '../components/UnifiedDatePicker';
import { useFormDraft } from '../shared/hooks';
import { useNativeGeolocation } from '../shared/hooks/useNativeGeolocation';
import { usePhotoPicker, type PhotoResult } from '../shared/hooks/usePhotoPicker';
import {
  buildAudioFilename,
  getMicrophoneErrorMessage,
  getSupportedAudioMimeType,
} from '../shared/utils/audioRecorder';
import { getPermissionDeniedMessage } from '../shared/utils/permissions';
import { Platform } from '../shared/utils/platform';
import { photoResultToFile } from '../shared/utils/photoFile';
import { cropImageToDataUrl } from '../shared/utils/imageCrop';
import { countWords } from '../shared/utils/wordCount';
import { VideoPreview } from '../shared/components/display/VideoPreview';
import { useFixedTopBar } from '../shared/hooks/useFixedTopBar';

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

interface MediaItem {
  url: string;
  type: 'image' | 'gif' | 'video';
}

// Draft state interface for persistence
interface MemoryDraft {
  content: string;
  mood: string;
  location: LocationData | null;
  stickers: string[];
  media: MediaItem[];
  voiceNote: string | null;
}

const initialDraft: MemoryDraft = {
  content: '',
  mood: 'Happy',
  location: null,
  stickers: [],
  media: [],
  voiceNote: null,
};

const reorderMediaItems = (items: MediaItem[], fromIndex: number, toIndex: number): MediaItem[] => {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const NewMemory: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [previewMediaIndex, setPreviewMediaIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date().toISOString());
  const { getCurrentPosition, checkPermissions } = useNativeGeolocation();
  const { pickMultiple, takePhoto, checkPhotosPermission, checkCameraPermission } = usePhotoPicker();

  // Use draft hook for form persistence
  const { state: draft, updateField, clearDraft } = useFormDraft<MemoryDraft>(
    'new-memory-draft',
    initialDraft
  );

  // Destructure draft state for easier access
  const { content, mood, location, stickers, media, voiceNote } = draft;

  // Helper setters that update draft
  const setContent = (value: string) => updateField('content', value);
  const setMood = (value: string) => updateField('mood', value);
  const setLocation = (value: LocationData | null) => updateField('location', value);
  const setStickers = (value: string[] | ((prev: string[]) => string[])) => {
    if (typeof value === 'function') {
      updateField('stickers', value(stickers));
    } else {
      updateField('stickers', value);
    }
  };
  const setMedia = (value: MediaItem[] | ((prev: MediaItem[]) => MediaItem[])) => {
    if (typeof value === 'function') {
      updateField('media', value(media));
    } else {
      updateField('media', value);
    }
  };
  const setVoiceNote = (value: string | null) => updateField('voiceNote', value);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [draggingMediaIndex, setDraggingMediaIndex] = useState<number | null>(null);
  const [mediaDragOverIndex, setMediaDragOverIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewGestureRef = useRef<{
    pinchStartDistance: number;
    pinchStartZoom: number;
    dragStartX: number;
    dragStartY: number;
    dragOriginX: number;
    dragOriginY: number;
    lastTapAt: number;
    touchStartX: number;
    touchStartY: number;
    hasMoved: boolean;
  }>({
    pinchStartDistance: 0,
    pinchStartZoom: 1,
    dragStartX: 0,
    dragStartY: 0,
    dragOriginX: 0,
    dragOriginY: 0,
    lastTapAt: 0,
    touchStartX: 0,
    touchStartY: 0,
    hasMoved: false,
  });
  const previewTapCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PhotoResult[]>([]);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [photoEditorTranslateY, setPhotoEditorTranslateY] = useState(0);
  const [isPhotoEditorDragging, setIsPhotoEditorDragging] = useState(false);
  const photoEditorScrollRef = useRef<HTMLDivElement>(null);
  const photoEditorGestureRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    lastTranslateY: number;
    lastMoveTime: number;
    velocityY: number;
    isActive: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTranslateY: 0,
    lastMoveTime: 0,
    velocityY: 0,
    isActive: false,
  });
  const [photoCrop, setPhotoCrop] = useState({ x: 0, y: 0 });
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoCroppedAreaPixels, setPhotoCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplyingPhotoCrop, setIsApplyingPhotoCrop] = useState(false);
  const [isSubmittingPhotoEdits, setIsSubmittingPhotoEdits] = useState(false);
  const mediaDragGestureRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    sourceIndex: number;
    currentIndex: number;
    isDragging: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    sourceIndex: -1,
    currentIndex: -1,
    isDragging: false,
  });
  const suppressMediaClickRef = useRef(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const shouldSaveRef = React.useRef<boolean>(true);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Maximum recording duration in seconds (60 seconds)
  const MAX_RECORDING_DURATION = 60;
  const PREVIEW_MIN_ZOOM = 1;
  const PREVIEW_MAX_ZOOM = 4;
  const PHOTO_EDITOR_MIN_ZOOM = 1;
  const PHOTO_EDITOR_MAX_ZOOM = 4;
  const PHOTO_EDITOR_CLOSE_SWIPE_THRESHOLD = 120;
  const PHOTO_EDITOR_MAX_DRAG = 260;
  const PHOTO_EDITOR_CLOSE_FLING_VELOCITY = 0.6;

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
      console.warn('AMap key not configured. Please set VITE_AMAP_KEY in .env file');
      return;
    }
    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.PlaceSearch', 'AMap.Geolocation', 'AMap.Geocoder'],
    })
      .then((AMap) => {
        AMapRef.current = AMap;
        // 创建 PlaceSearch 实例
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
    if (!(showLocationPicker && AMapRef.current && !currentPosition)) return;

    setIsLoadingNearby(true);
    void (async () => {
      const hasPermission = await checkPermissions();
      if (!hasPermission) {
        setIsLoadingNearby(false);
        return;
      }

      const pos = await getCurrentPosition();
      if (pos) {
        const nextPos = { lng: pos.longitude, lat: pos.latitude };
        setCurrentPosition(nextPos);
        searchNearbyPOIs(nextPos);
      } else {
        setIsLoadingNearby(false);
      }
    })();
    return () => {
      setIsLoadingNearby(false);
    }
  }, [showLocationPicker, currentPosition, checkPermissions, getCurrentPosition]);

  // 搜索附近 POI
  const searchNearbyPOIs = useCallback((position: { lng: number; lat: number }) => {
    if (!placeSearchRef.current) return;

    placeSearchRef.current.searchNearBy(
      '',
      [position.lng, position.lat],
      1000, // 1公里范围
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

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please write something before saving');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Use media URLs directly
      const allMediaUrls = media.map(m => m.url);
      await memoriesApi.create({
        content: content.trim(),
        mood,
        photos: allMediaUrls.length > 0 ? allMediaUrls : undefined,
        location: location || undefined,
        voiceNote: voiceNote || undefined,
        stickers: stickers.length > 0 ? stickers : undefined,
        date,
      });
      // Clear draft after successful save
      clearDraft();
      await queryClient.invalidateQueries({ queryKey: MEMORIES_QUERY_KEY });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Media upload handler (images, GIFs, videos) - uses direct upload for large files
  const uploadMediaFiles = async (files: File[]): Promise<boolean> => {
    if (files.length === 0) return true;
    setIsUploading(true);
    setError('');
    setUploadProgress('');

    try {
      const uploadResults: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        const folder = isVideo ? 'videos' : 'images';
        const maxAttempts = 2;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            setUploadProgress(`Uploading ${i + 1}/${files.length} (${formatFileSize(file.size)}) - 0% (try ${attempt}/${maxAttempts})`);
            const result = await uploadApi.uploadDirect(file, folder, (progress) => {
              setUploadProgress(`Uploading ${i + 1}/${files.length} (${formatFileSize(file.size)}) - ${progress}% (try ${attempt}/${maxAttempts})`);
            });
            uploadResults.push({
              url: result.url,
              type: result.type,
            });
            lastError = null;
            break;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error('Upload failed');
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        }

        if (lastError) {
          throw lastError;
        }
      }

      setMedia(prev => [...prev, ...uploadResults]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
      return false;
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files) as File[];
    await uploadMediaFiles(filesArray);
  };

  const handleAddPhotos = async () => {
    if (!Platform.isNative()) {
      fileInputRef.current?.click();
      return;
    }

    setShowPhotoActions(true);
  };

  const resetPhotoCropState = () => {
    setPhotoCrop({ x: 0, y: 0 });
    setPhotoZoom(1);
    setPhotoCroppedAreaPixels(null);
  };

  const handleOpenPhotoEditor = (photos: PhotoResult[]) => {
    setPendingPhotos(photos);
    setEditingPhotoIndex(null);
    setPhotoEditorTranslateY(0);
    setIsPhotoEditorDragging(false);
    photoEditorGestureRef.current.isActive = false;
    setShowPhotoEditor(true);
    resetPhotoCropState();
  };

  const handleClosePhotoEditor = () => {
    setPhotoEditorTranslateY(0);
    setIsPhotoEditorDragging(false);
    photoEditorGestureRef.current.isActive = false;
    setShowPhotoEditor(false);
    setPendingPhotos([]);
    setEditingPhotoIndex(null);
    setIsApplyingPhotoCrop(false);
    setIsSubmittingPhotoEdits(false);
    resetPhotoCropState();
  };

  const handlePhotoEditorTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (editingPhotoIndex !== null || isSubmittingPhotoEdits || isApplyingPhotoCrop) return;
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const now = Date.now();
    photoEditorGestureRef.current.startX = touch.clientX;
    photoEditorGestureRef.current.startY = touch.clientY;
    photoEditorGestureRef.current.startTime = now;
    photoEditorGestureRef.current.lastTranslateY = 0;
    photoEditorGestureRef.current.lastMoveTime = now;
    photoEditorGestureRef.current.velocityY = 0;
    photoEditorGestureRef.current.isActive = true;
    setIsPhotoEditorDragging(false);
  };

  const handlePhotoEditorTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!photoEditorGestureRef.current.isActive || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - photoEditorGestureRef.current.startX;
    const deltaY = touch.clientY - photoEditorGestureRef.current.startY;
    const canStartDrag = (photoEditorScrollRef.current?.scrollTop ?? 0) <= 0;

    if (!canStartDrag) {
      setPhotoEditorTranslateY(0);
      setIsPhotoEditorDragging(false);
      return;
    }

    if (deltaY <= 0 || Math.abs(deltaY) <= Math.abs(deltaX)) {
      setPhotoEditorTranslateY(0);
      setIsPhotoEditorDragging(false);
      return;
    }

    event.preventDefault();
    const now = Date.now();
    const nextTranslateY = Math.min(deltaY, PHOTO_EDITOR_MAX_DRAG);
    const deltaTranslate = nextTranslateY - photoEditorGestureRef.current.lastTranslateY;
    const elapsed = Math.max(1, now - photoEditorGestureRef.current.lastMoveTime);
    photoEditorGestureRef.current.velocityY = Math.max(0, deltaTranslate / elapsed);
    photoEditorGestureRef.current.lastTranslateY = nextTranslateY;
    photoEditorGestureRef.current.lastMoveTime = now;

    setIsPhotoEditorDragging(true);
    setPhotoEditorTranslateY(nextTranslateY);
  };

  const handlePhotoEditorTouchEnd = () => {
    if (!photoEditorGestureRef.current.isActive) return;
    const now = Date.now();
    const totalDuration = Math.max(1, now - photoEditorGestureRef.current.startTime);
    const averageVelocity = photoEditorTranslateY / totalDuration;
    const swipeVelocity = Math.max(photoEditorGestureRef.current.velocityY, averageVelocity);

    photoEditorGestureRef.current.isActive = false;

    if (
      photoEditorTranslateY >= PHOTO_EDITOR_CLOSE_SWIPE_THRESHOLD ||
      swipeVelocity >= PHOTO_EDITOR_CLOSE_FLING_VELOCITY
    ) {
      handleClosePhotoEditor();
      return;
    }

    setIsPhotoEditorDragging(false);
    setPhotoEditorTranslateY(0);
  };

  const handleOpenSinglePhotoCrop = (index: number) => {
    setEditingPhotoIndex(index);
    resetPhotoCropState();
  };

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setPhotoCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCurrentPhotoCrop = async () => {
    if (editingPhotoIndex === null) return;
    const target = pendingPhotos[editingPhotoIndex];
    if (!target || !photoCroppedAreaPixels) return;

    setIsApplyingPhotoCrop(true);
    try {
      const croppedDataUrl = await cropImageToDataUrl(target.source, {
        x: Math.round(photoCroppedAreaPixels.x),
        y: Math.round(photoCroppedAreaPixels.y),
        width: Math.round(photoCroppedAreaPixels.width),
        height: Math.round(photoCroppedAreaPixels.height),
      });

      setPendingPhotos((previous) =>
        previous.map((photo, index) =>
          index === editingPhotoIndex
            ? {
                source: croppedDataUrl,
                sourceType: 'data-url',
                format: 'jpeg',
              }
            : photo
        )
      );
      setEditingPhotoIndex(null);
      resetPhotoCropState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop photo');
    } finally {
      setIsApplyingPhotoCrop(false);
    }
  };

  const handleSubmitEditedPhotos = async () => {
    if (pendingPhotos.length === 0) return;

    setIsSubmittingPhotoEdits(true);
    try {
      const baseName = `memory-${Date.now()}`;
      const files = await Promise.all(
        pendingPhotos.map((photo, index) => photoResultToFile(photo, `${baseName}-${index + 1}`))
      );
      const success = await uploadMediaFiles(files);
      if (success) {
        handleClosePhotoEditor();
      }
    } finally {
      setIsSubmittingPhotoEdits(false);
    }
  };

  const handlePickPhotosNative = async () => {
    setShowPhotoActions(false);

    try {
      const hasPermission = await checkPhotosPermission();
      if (!hasPermission) {
        setError(getPermissionDeniedMessage('photo'));
        return;
      }

      const photos = await pickMultiple(10);
      if (photos.length === 0) return;
      handleOpenPhotoEditor(photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick photos');
      // Fallback to browser file input for edge devices/webviews.
      fileInputRef.current?.click();
    }
  };

  const handleTakePhotoNative = async () => {
    setShowPhotoActions(false);

    try {
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setError(getPermissionDeniedMessage('camera'));
        return;
      }

      const photo = await takePhoto();
      if (!photo) return;

      const file = await photoResultToFile(photo, `memory-camera-${Date.now()}`);
      await uploadMediaFiles([file]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to take photo');
      fileInputRef.current?.click();
    }
  };

  const handleRemoveMedia = async (index: number) => {
    const item = media[index];
    // Remove from UI immediately
    setMedia(prev => prev.filter((_, i) => i !== index));
    // Delete from COS in background (don't block UI)
    try {
      await uploadApi.deleteFile(item.url);
    } catch (err) {
      console.error('Failed to delete file from COS:', err);
      // Don't show error to user - file is already removed from UI
    }
  };

  const moveMediaItem = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setMedia((previous) => {
      const reordered = reorderMediaItems(previous, fromIndex, toIndex);
      return reordered;
    });

    setPreviewMediaIndex((previous) => {
      if (previous === null) return previous;
      if (previous === fromIndex) return toIndex;
      if (fromIndex < toIndex && previous > fromIndex && previous <= toIndex) return previous - 1;
      if (fromIndex > toIndex && previous >= toIndex && previous < fromIndex) return previous + 1;
      return previous;
    });
  }, [setMedia]);

  const handleMediaPointerDown = (event: React.PointerEvent<HTMLDivElement>, index: number) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    mediaDragGestureRef.current.pointerId = event.pointerId;
    mediaDragGestureRef.current.startX = event.clientX;
    mediaDragGestureRef.current.startY = event.clientY;
    mediaDragGestureRef.current.sourceIndex = index;
    mediaDragGestureRef.current.currentIndex = index;
    mediaDragGestureRef.current.isDragging = false;
  };

  const handleMediaPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = mediaDragGestureRef.current;
    if (gesture.pointerId === null || event.pointerId !== gesture.pointerId) return;

    if (!gesture.isDragging) {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) return;

      gesture.isDragging = true;
      suppressMediaClickRef.current = true;
      setDraggingMediaIndex(gesture.sourceIndex);
      setMediaDragOverIndex(gesture.sourceIndex);
    }

    event.preventDefault();
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-media-index]');
    if (!target) return;

    const targetIndex = Number.parseInt(target.dataset.mediaIndex ?? '', 10);
    if (Number.isNaN(targetIndex) || targetIndex === gesture.currentIndex) return;

    gesture.currentIndex = targetIndex;
    setMediaDragOverIndex(targetIndex);
  };

  const handleMediaPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const activePointerId = mediaDragGestureRef.current.pointerId;
    if (activePointerId !== null && event.pointerId !== activePointerId) return;
    if (activePointerId !== null && event.currentTarget.hasPointerCapture(activePointerId)) {
      event.currentTarget.releasePointerCapture(activePointerId);
    }
    const sourceIndex = mediaDragGestureRef.current.sourceIndex;
    const targetIndex = mediaDragGestureRef.current.currentIndex;
    const shouldCommitMove = mediaDragGestureRef.current.isDragging && sourceIndex >= 0 && targetIndex >= 0;
    mediaDragGestureRef.current.pointerId = null;
    mediaDragGestureRef.current.isDragging = false;
    mediaDragGestureRef.current.sourceIndex = -1;
    mediaDragGestureRef.current.currentIndex = -1;
    setDraggingMediaIndex(null);
    setMediaDragOverIndex(null);

    if (shouldCommitMove && sourceIndex !== targetIndex) {
      moveMediaItem(sourceIndex, targetIndex);
    }

    window.setTimeout(() => {
      suppressMediaClickRef.current = false;
    }, 0);
  };

  const displayMedia = useMemo(() => {
    if (draggingMediaIndex === null || mediaDragOverIndex === null) return media;
    return reorderMediaItems(media, draggingMediaIndex, mediaDragOverIndex);
  }, [media, draggingMediaIndex, mediaDragOverIndex]);

  const handleOpenMediaPreview = (index: number) => {
    if (suppressMediaClickRef.current) return;
    setPreviewMediaIndex(index);
  };

  const clampPreviewOffset = useCallback((nextZoom: number, nextOffset: { x: number; y: number }) => {
    const bounds = previewContainerRef.current?.getBoundingClientRect();
    if (!bounds) return nextOffset;

    const maxX = Math.max(0, ((nextZoom - 1) * bounds.width) / 2);
    const maxY = Math.max(0, ((nextZoom - 1) * bounds.height) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  }, []);

  const resetPreviewTransform = useCallback(() => {
    setPreviewZoom(1);
    setPreviewOffset({ x: 0, y: 0 });
    setIsPreviewDragging(false);
    previewGestureRef.current.pinchStartDistance = 0;
    previewGestureRef.current.pinchStartZoom = 1;
    previewGestureRef.current.dragStartX = 0;
    previewGestureRef.current.dragStartY = 0;
    previewGestureRef.current.dragOriginX = 0;
    previewGestureRef.current.dragOriginY = 0;
    previewGestureRef.current.touchStartX = 0;
    previewGestureRef.current.touchStartY = 0;
    previewGestureRef.current.hasMoved = false;
  }, []);

  const clearPreviewTapCloseTimer = useCallback(() => {
    if (previewTapCloseTimerRef.current) {
      clearTimeout(previewTapCloseTimerRef.current);
      previewTapCloseTimerRef.current = null;
    }
  }, []);

  const togglePreviewZoom = useCallback(() => {
    if (previewZoom > PREVIEW_MIN_ZOOM) {
      resetPreviewTransform();
      return;
    }
    setPreviewZoom(2);
  }, [previewZoom, resetPreviewTransform]);

  const handleCloseMediaPreview = () => {
    clearPreviewTapCloseTimer();
    resetPreviewTransform();
    setPreviewMediaIndex(null);
  };

  const handlePrevPreviewMedia = () => {
    if (previewMediaIndex === null || media.length === 0) return;
    clearPreviewTapCloseTimer();
    resetPreviewTransform();
    setPreviewMediaIndex((previewMediaIndex - 1 + media.length) % media.length);
  };

  const handleNextPreviewMedia = () => {
    if (previewMediaIndex === null || media.length === 0) return;
    clearPreviewTapCloseTimer();
    resetPreviewTransform();
    setPreviewMediaIndex((previewMediaIndex + 1) % media.length);
  };

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handlePreviewTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    clearPreviewTapCloseTimer();
    const touchCount = event.touches.length;
    if (touchCount === 2) {
      const distance = getTouchDistance(event.touches);
      previewGestureRef.current.pinchStartDistance = distance;
      previewGestureRef.current.pinchStartZoom = previewZoom;
      previewGestureRef.current.hasMoved = true;
      setIsPreviewDragging(false);
      return;
    }

    if (touchCount === 1) {
      const touch = event.touches[0];
      previewGestureRef.current.touchStartX = touch.clientX;
      previewGestureRef.current.touchStartY = touch.clientY;
      previewGestureRef.current.hasMoved = false;

      if (previewZoom <= PREVIEW_MIN_ZOOM) return;

      previewGestureRef.current.dragStartX = touch.clientX;
      previewGestureRef.current.dragStartY = touch.clientY;
      previewGestureRef.current.dragOriginX = previewOffset.x;
      previewGestureRef.current.dragOriginY = previewOffset.y;
      setIsPreviewDragging(true);
    }
  };

  const handlePreviewTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      previewGestureRef.current.hasMoved = true;
      const distance = getTouchDistance(event.touches);
      const startDistance = previewGestureRef.current.pinchStartDistance;
      if (startDistance <= 0) return;
      const rawZoom = previewGestureRef.current.pinchStartZoom * (distance / startDistance);
      const nextZoom = Math.max(PREVIEW_MIN_ZOOM, Math.min(PREVIEW_MAX_ZOOM, rawZoom));
      setPreviewZoom(nextZoom);
      setPreviewOffset((previous) => clampPreviewOffset(nextZoom, previous));
      return;
    }

    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    const distanceFromStart = Math.hypot(
      touch.clientX - previewGestureRef.current.touchStartX,
      touch.clientY - previewGestureRef.current.touchStartY
    );
    if (distanceFromStart > 8) {
      previewGestureRef.current.hasMoved = true;
    }

    if (previewZoom > PREVIEW_MIN_ZOOM) {
      event.preventDefault();
      const deltaX = touch.clientX - previewGestureRef.current.dragStartX;
      const deltaY = touch.clientY - previewGestureRef.current.dragStartY;
      const nextOffset = {
        x: previewGestureRef.current.dragOriginX + deltaX,
        y: previewGestureRef.current.dragOriginY + deltaY,
      };
      setPreviewOffset(clampPreviewOffset(previewZoom, nextOffset));
    }
  };

  const handlePreviewTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) return;
    setIsPreviewDragging(false);
    if (previewGestureRef.current.hasMoved) return;

    const now = Date.now();
    if (now - previewGestureRef.current.lastTapAt < 280) {
      clearPreviewTapCloseTimer();
      togglePreviewZoom();
      previewGestureRef.current.lastTapAt = 0;
      return;
    }
    previewGestureRef.current.lastTapAt = now;

    if (previewZoom <= PREVIEW_MIN_ZOOM) {
      setPreviewOffset({ x: 0, y: 0 });
      previewTapCloseTimerRef.current = setTimeout(() => {
        if (previewMediaIndex !== null && media[previewMediaIndex]?.type !== 'video') {
          handleCloseMediaPreview();
        }
      }, 280);
    }
  };

  useEffect(() => {
    if (previewMediaIndex === null) {
      clearPreviewTapCloseTimer();
      resetPreviewTransform();
    }
  }, [previewMediaIndex, resetPreviewTransform, clearPreviewTapCloseTimer]);

  useEffect(() => {
    return () => {
      clearPreviewTapCloseTimer();
    };
  }, [clearPreviewTapCloseTimer]);

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

    // 如果有当前位置，使用当前位置的经纬度
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
  const handleUseCurrentLocation = async () => {
    if (!AMapRef.current) {
      setError('Map service not ready');
      return;
    }

    const hasPermission = await checkPermissions();
    if (!hasPermission) {
      setError(getPermissionDeniedMessage('location'));
      return;
    }

    const nativePos = await getCurrentPosition();
    if (!nativePos) {
      setError('Unable to get your location');
      return;
    }

    const AMap = AMapRef.current;
    const lng = nativePos.longitude;
    const lat = nativePos.latitude;

    // 反向地理编码获取地址
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
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('This device does not support audio recording');
        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        setError('Audio recording is not supported on this device');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getSupportedAudioMimeType();
      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }
      const mediaRecorder = new MediaRecorder(stream, options);
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
          const resolvedMimeType = mimeType || mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: resolvedMimeType });
          setIsUploadingVoice(true);
          try {
            const filename = buildAudioFilename(resolvedMimeType);
            const result = await uploadApi.uploadAudio(audioBlob, filename);
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
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop at max duration
          if (newTime >= MAX_RECORDING_DURATION) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      setError(getMicrophoneErrorMessage(err));
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

  const deleteVoiceNote = () => {
    // Stop preview if playing
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    setVoiceNote(null);
    setRecordingTime(0);
  };

  const togglePreviewPlayback = () => {
    if (!voiceNote) return;

    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlayingPreview(false);
      return;
    }

    audio.preload = 'auto';
    audio.volume = 1;
    audio.muted = false;
    audio.currentTime = 0;
    void audio.play()
      .then(() => {
        setIsPlayingPreview(true);
      })
      .catch(() => {
        setIsPlayingPreview(false);
        setError('Unable to play voice note preview on this device');
      });
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

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
  const wordCount = countWords(content);
  const { topBarRef, topBarHeight } = useFixedTopBar();

  return (
    <div className={`flex-1 flex flex-col bg-paper min-h-screen relative font-sans ${showStickerPicker ? 'overflow-hidden' : ''}`}>
      <header
        ref={topBarRef}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] flex items-center justify-between px-6 pb-4 pt-safe-offset-4 bg-paper/90 backdrop-blur-md border-b border-black/[0.03]"
      >
        <button
          onClick={() => navigate(-1)}
          className="text-ink/60 text-sm font-medium hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <h1 className="text-ink text-sm font-bold uppercase tracking-widest opacity-80">New Memory</h1>
        <button
          onClick={handleSave}
          disabled={isLoading || !content.trim()}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </header>
      <div aria-hidden="true" className="w-full flex-none" style={{ height: topBarHeight }} />

      <main className="flex-1 flex flex-col w-full px-6 pb-24 overflow-y-auto no-scrollbar">
        <div className="sticky top-[calc(env(safe-area-inset-top)+4.5rem)] z-30 -mx-6 px-6 pt-3 pb-2 bg-paper/90 backdrop-blur-md">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
          <div className={error ? 'mt-4 mb-2' : 'mb-2'}>
            <div className="flex items-center gap-2 text-accent/60 text-[10px] font-bold uppercase tracking-widest cursor-pointer" onClick={() => setShowDatePicker(true)}>
              <span>{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {showDatePicker && (
              <UnifiedDatePicker
                  initialDate={new Date(date)}
                  onConfirm={(newDate) => {
                    setDate(newDate.toISOString());
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                  title="New Memory"
                  subtitle="Select Moment"
              />
            )}
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
          <p className="text-[11px] text-ink/35 mb-4">Drag photos to rearrange</p>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/gif,video/*"
            multiple
            onChange={handleMediaUpload}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleMediaUpload}
            className="hidden"
          />

          {/* Upload progress */}
          {uploadProgress && (
            <div className="mb-4 text-sm text-accent font-medium">{uploadProgress}</div>
          )}

          <div className="grid grid-cols-3 gap-3 pb-2">
            {/* Uploaded Media (photos, GIFs, videos) */}
            {displayMedia.map((item, index) => (
              <div
                key={`${item.url}-${item.type}`}
                data-media-index={index}
                className={`w-full ${
                  draggingMediaIndex !== null && mediaDragOverIndex === index ? 'z-10' : ''
                }`}
                onPointerDown={(event) => handleMediaPointerDown(event, index)}
                onPointerMove={handleMediaPointerMove}
                onPointerUp={handleMediaPointerEnd}
                onPointerCancel={handleMediaPointerEnd}
              >
                <div
                  className={`bg-white p-2 pb-4 rounded-sm shadow-sm transition-transform will-change-transform ${
                    draggingMediaIndex !== null && mediaDragOverIndex === index
                      ? 'scale-[1.03] shadow-md'
                      : 'active:scale-95'
                  }`}
                >
                  <div
                    className="aspect-square bg-gray-100 overflow-hidden rounded-sm relative group cursor-zoom-in touch-none"
                    onClick={() => handleOpenMediaPreview(index)}
                  >
                    {item.type === 'video' ? (
                      <VideoPreview
                        src={item.url}
                        className="w-full h-full object-cover"
                        iconSize="sm"
                      />
                    ) : (
                      <div
                        role="img"
                        aria-label={`Memory ${index + 1}`}
                        className="w-full h-full bg-cover bg-center grayscale-[20%] sepia-[10%]"
                        style={{ backgroundImage: `url("${item.url}")` }}
                      />
                    )}
                    {item.type === 'gif' && (
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        GIF
                      </div>
                    )}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleRemoveMedia(index);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Add Photo/GIF Button */}
            <div className="w-full">
              <button
                onClick={handleAddPhotos}
                disabled={isUploading}
                className="bg-white p-2 pb-4 rounded-sm shadow-sm w-full flex flex-col items-center transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="aspect-square w-full bg-[#fdfaf7] border border-dashed border-ink/10 rounded-sm flex flex-col items-center justify-center hover:bg-gray-50 gap-1">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-ink/20 text-2xl">add_a_photo</span>
                      <span className="text-[8px] text-ink/30 font-bold">{Platform.isNative() ? 'PHOTO/GIF' : 'PHOTO/GIF/VIDEO'}</span>
                    </>
                  )}
                </div>
              </button>
            </div>
            {/* Video upload shortcut */}
            <div className="w-full">
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploading}
                className="bg-white p-2 pb-4 rounded-sm shadow-sm w-full flex flex-col items-center opacity-80 transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="aspect-square w-full bg-[#fdfaf7] border border-dashed border-ink/10 rounded-sm flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-ink/30 text-2xl">videocam</span>
                  <span className="text-[8px] text-ink/30 font-bold">VIDEO</span>
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
        <span className="text-[10px] font-bold text-ink/40">{wordCount} words</span>
      </div>

      {/* Voice Recorder Overlay */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto bg-ink/5 backdrop-blur-[2px]">
          {voiceNote && (
            <audio
              ref={previewAudioRef}
              src={voiceNote}
              preload="auto"
              onEnded={() => setIsPlayingPreview(false)}
              className="hidden"
            />
          )}
          <div className="absolute inset-0 z-0" onClick={() => !isRecording && setShowVoiceRecorder(false)}></div>
          <div className="relative w-full bg-paper/95 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/40 pb-12 pt-8 px-6 transition-all duration-300 transform translate-y-0">
            <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mb-8"></div>

            {/* Title */}
            <h3 className="text-center text-ink font-bold text-lg mb-6">
              {isUploadingVoice ? 'Uploading...' : voiceNote && !isRecording ? 'Preview Recording' : isRecording ? 'Recording...' : 'Voice Note'}
            </h3>

            {/* Waveform - only animate when recording */}
            <div className="flex items-center justify-center gap-[3px] h-16 mb-6 px-8">
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
                // Static waveform for preview
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

            {/* Timer */}
            <div className="text-center mb-4">
              <span className="font-sans font-bold text-3xl text-ink tracking-widest tabular-nums drop-shadow-sm">
                {formatTime(recordingTime)}
              </span>
              {isRecording && (
                <span className="text-ink/40 text-sm ml-2">/ {formatTime(MAX_RECORDING_DURATION)}</span>
              )}
            </div>

            {/* Progress bar for recording */}
            {isRecording && (
              <div className="w-full max-w-xs mx-auto mb-8 h-1 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dusty-rose transition-all duration-1000 ease-linear"
                  style={{ width: `${(recordingTime / MAX_RECORDING_DURATION) * 100}%` }}
                ></div>
              </div>
            )}

            {/* Preview controls when recording is done */}
            {voiceNote && !isRecording && (
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={togglePreviewPlayback}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    isPlayingPreview
                      ? 'bg-green-500 text-white'
                      : 'bg-ink/5 text-ink hover:bg-ink/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isPlayingPreview ? 'pause' : 'play_arrow'}
                  </span>
                  <span className="text-sm font-medium">
                    {isPlayingPreview ? 'Pause' : 'Play'}
                  </span>
                </button>
                <button
                  onClick={deleteVoiceNote}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            )}

            {/* Main Controls */}
            <div className="flex items-center justify-between max-w-xs mx-auto px-4">
              <button
                className="text-ink/40 font-bold text-xs uppercase tracking-widest hover:text-ink transition-colors py-4"
                onClick={cancelRecording}
              >
                Cancel
              </button>

              <div className="relative group cursor-pointer" onClick={isRecording ? stopRecording : !voiceNote ? startRecording : undefined}>
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
                  disabled={voiceNote && !isRecording}
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
                disabled={!voiceNote && !isRecording}
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
            {/* Background */}
            <div className="absolute inset-0 z-0" onClick={() => setShowLocationPicker(false)}>
                <div className="w-full h-full bg-loc-bg"></div>
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
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
                        {/* Custom location option */}
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

      {/* Native Multi-photo Editor */}
      {showPhotoEditor && (
        <div className="fixed inset-0 z-[65] bg-black/55 backdrop-blur-[2px] flex items-end">
          <div
            className="w-full h-[82vh] bg-paper rounded-t-3xl shadow-2xl flex flex-col"
            onTouchStart={handlePhotoEditorTouchStart}
            onTouchMove={handlePhotoEditorTouchMove}
            onTouchEnd={handlePhotoEditorTouchEnd}
            onTouchCancel={handlePhotoEditorTouchEnd}
            style={{
              transform: `translate3d(0, ${photoEditorTranslateY}px, 0)`,
              transition: isPhotoEditorDragging ? 'none' : 'transform 180ms ease-out',
              touchAction: 'pan-y',
            }}
          >
            <div className="w-12 h-1.5 bg-ink/10 rounded-full mx-auto mt-3 mb-4"></div>
            <div className="px-5 pb-3 flex items-center justify-between border-b border-ink/5">
              <button
                onClick={handleClosePhotoEditor}
                disabled={isSubmittingPhotoEdits || isApplyingPhotoCrop}
                className="text-sm font-semibold text-ink/60 hover:text-ink disabled:opacity-40"
              >
                Cancel
              </button>
              <h3 className="text-sm font-bold text-ink">Edit Photos ({pendingPhotos.length})</h3>
              <button
                onClick={handleSubmitEditedPhotos}
                disabled={pendingPhotos.length === 0 || isSubmittingPhotoEdits || isApplyingPhotoCrop}
                className="text-sm font-bold text-accent disabled:opacity-40"
              >
                {isSubmittingPhotoEdits ? 'Uploading...' : 'Use Photos'}
              </button>
            </div>

            <div className="px-5 py-3 text-xs text-ink/50">
              Select a photo below to crop before upload.
            </div>

            <div ref={photoEditorScrollRef} className="flex-1 overflow-y-auto px-4 pb-6">
              <div className="grid grid-cols-3 gap-3">
                {pendingPhotos.map((photo, index) => (
                  <button
                    key={`${photo.source}-${index}`}
                    onClick={() => handleOpenSinglePhotoCrop(index)}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 active:scale-[0.98] transition-transform"
                  >
                    <img src={photo.source} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-black/45 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Crop
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {editingPhotoIndex !== null && pendingPhotos[editingPhotoIndex] && (
            <div className="fixed inset-0 z-[66] bg-black/90 flex flex-col">
              <div className="px-4 pt-safe-offset-4 pb-3 flex items-center justify-between text-white border-b border-white/10">
                <button
                  onClick={() => {
                    setEditingPhotoIndex(null);
                    resetPhotoCropState();
                  }}
                  disabled={isApplyingPhotoCrop}
                  className="text-sm font-semibold disabled:opacity-40"
                >
                  Back
                </button>
                <span className="text-sm font-medium">
                  Crop {editingPhotoIndex + 1} / {pendingPhotos.length}
                </span>
                <button
                  onClick={handleApplyCurrentPhotoCrop}
                  disabled={isApplyingPhotoCrop}
                  className="text-sm font-bold text-green-300 disabled:opacity-40"
                >
                  {isApplyingPhotoCrop ? 'Saving...' : 'Done'}
                </button>
              </div>

              <div className="relative flex-1 bg-black">
                <Cropper
                  image={pendingPhotos[editingPhotoIndex].source}
                  crop={photoCrop}
                  zoom={photoZoom}
                  aspect={1}
                  minZoom={PHOTO_EDITOR_MIN_ZOOM}
                  maxZoom={PHOTO_EDITOR_MAX_ZOOM}
                  showGrid
                  onCropChange={setPhotoCrop}
                  onZoomChange={setPhotoZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>

              <div className="px-5 py-4 border-t border-white/10 bg-black/90">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white/70 text-sm">zoom_in</span>
                  <input
                    type="range"
                    min={PHOTO_EDITOR_MIN_ZOOM}
                    max={PHOTO_EDITOR_MAX_ZOOM}
                    step={0.01}
                    value={photoZoom}
                    onChange={(event) => setPhotoZoom(Number(event.target.value))}
                    className="flex-1 accent-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media Preview Overlay */}
      {previewMediaIndex !== null && media[previewMediaIndex] && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col">
          <div className="flex items-center justify-center px-4 py-3 text-white/90">
            <span className="text-sm font-medium">
              {previewMediaIndex + 1} / {media.length}
            </span>
          </div>

          <div
            ref={previewContainerRef}
            className="flex-1 relative flex items-center justify-center px-4 overflow-hidden"
            onDoubleClick={togglePreviewZoom}
            onTouchStart={handlePreviewTouchStart}
            onTouchMove={handlePreviewTouchMove}
            onTouchEnd={handlePreviewTouchEnd}
            style={{ touchAction: previewZoom > PREVIEW_MIN_ZOOM ? 'none' : 'manipulation' }}
          >
            {media[previewMediaIndex].type === 'video' ? (
              <video
                src={media[previewMediaIndex].url}
                controls
                autoPlay
                playsInline
                className="max-h-full max-w-full rounded-lg"
              />
            ) : (
              <div
                className="max-h-full max-w-full flex items-center justify-center select-none"
                style={{
                  transform: `translate3d(${previewOffset.x}px, ${previewOffset.y}px, 0) scale(${previewZoom})`,
                  transition: isPreviewDragging ? 'none' : 'transform 140ms ease-out',
                  cursor: previewZoom > PREVIEW_MIN_ZOOM ? (isPreviewDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
              >
                <img
                  src={media[previewMediaIndex].url}
                  alt={`Memory media ${previewMediaIndex + 1}`}
                  className="max-h-full max-w-full object-contain rounded-lg pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            )}

            {media.length > 1 && (
              <>
                <button
                  onClick={handlePrevPreviewMedia}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Previous media"
                  disabled={previewZoom > PREVIEW_MIN_ZOOM}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  onClick={handleNextPreviewMedia}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                  aria-label="Next media"
                  disabled={previewZoom > PREVIEW_MIN_ZOOM}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Native Photo Actions */}
      {Platform.isNative() && showPhotoActions && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" onClick={() => setShowPhotoActions(false)}></div>
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-8">
            <div className="w-10 h-1 bg-ink/10 rounded-full mx-auto mb-5"></div>
            <h3 className="text-center text-ink font-bold mb-4">Add Media</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={handleTakePhotoNative}
                className="w-full py-3 rounded-xl bg-primary/10 text-ink font-semibold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                Take Photo
              </button>
              <button
                onClick={handlePickPhotosNative}
                className="w-full py-3 rounded-xl bg-primary/10 text-ink font-semibold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">photo_library</span>
                Choose from Gallery (Multiple)
              </button>
              <button
                onClick={() => setShowPhotoActions(false)}
                className="w-full py-3 rounded-xl bg-ink/5 text-ink/70 font-medium"
              >
                Cancel
              </button>
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

                {/* Selected stickers preview */}
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

                {/* Done button */}
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

export default NewMemory;
