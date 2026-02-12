import { useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@/shared/utils/platform';

export interface PhotoResult {
  // Unified media source. Can be a data URL, a file/content URL, or a web URL.
  source: string;
  sourceType: 'data-url' | 'native-file-url' | 'web-url';
  format: string;
}

type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'limited';

function isGranted(state?: PermissionState): boolean {
  return state === 'granted' || state === 'limited';
}

function inferFormatFromPath(path?: string): string {
  if (!path) return 'jpeg';
  const cleanedPath = path.split('?')[0];
  const extension = cleanedPath.split('.').pop()?.toLowerCase();
  if (!extension) return 'jpeg';
  if (extension === 'jpg') return 'jpeg';
  return extension;
}

function resolveNativePhotoSource(photo: { webPath?: string; path?: string }): string | null {
  if (photo.webPath) return photo.webPath;
  if (photo.path) return Capacitor.convertFileSrc(photo.path);
  return null;
}

/**
 * Cross-platform photo picker hook.
 * Uses native Capacitor Camera on Android, falls back to file input on web.
 */
export function usePhotoPicker() {
  /**
   * Pick photo from gallery
   */
  const pickFromGallery = useCallback(async (): Promise<PhotoResult | null> => {
    try {
      if (Platform.isNative()) {
        const photo = await Camera.getPhoto({
          quality: 90,
          // Enable native crop/edit sheet for single-photo flow.
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });

        if (photo.dataUrl) {
          return {
            source: photo.dataUrl,
            sourceType: 'data-url',
            format: photo.format
          };
        }
        return null;
      } else {
        // Web fallback - create file input
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  source: reader.result as string,
                  sourceType: 'data-url',
                  format: file.type.split('/')[1] || 'jpeg'
                });
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
    } catch (error) {
      console.error('Failed to pick photo:', error);
      return null;
    }
  }, []);

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(async (): Promise<PhotoResult | null> => {
    try {
      if (Platform.isNative()) {
        const photo = await Camera.getPhoto({
          quality: 90,
          // Keep behavior close to WeChat: capture then edit/crop before confirm.
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        if (photo.dataUrl) {
          return {
            source: photo.dataUrl,
            sourceType: 'data-url',
            format: photo.format
          };
        }
        return null;
      } else {
        // Web fallback - try to use camera via file input
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  source: reader.result as string,
                  sourceType: 'data-url',
                  format: file.type.split('/')[1] || 'jpeg'
                });
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  }, []);

  /**
   * Pick multiple photos from gallery
   */
  const pickMultiple = useCallback(async (limit: number = 10): Promise<PhotoResult[]> => {
    try {
      if (Platform.isNative()) {
        const result = await Camera.pickImages({
          quality: 90,
          limit
        });

        return result.photos
          .map((p) => {
            const source = resolveNativePhotoSource(p);
            if (!source) return null;
            return {
              source,
              sourceType: 'native-file-url',
              format: p.format || inferFormatFromPath(p.path || p.webPath),
            } satisfies PhotoResult;
          })
          .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
      } else {
        // Web fallback
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              const photos: PhotoResult[] = [];
              for (let i = 0; i < Math.min(files.length, limit); i++) {
                const file = files[i];
                const dataUrl = await new Promise<string>((res) => {
                  const reader = new FileReader();
                  reader.onload = () => res(reader.result as string);
                  reader.readAsDataURL(file);
                });
                photos.push({
                  source: dataUrl,
                  sourceType: 'data-url',
                  format: file.type.split('/')[1] || 'jpeg'
                });
              }
              resolve(photos);
            } else {
              resolve([]);
            }
          };
          input.click();
        });
      }
    } catch (error) {
      console.error('Failed to pick multiple photos:', error);
      return [];
    }
  }, []);

  /**
   * Check and request gallery/photos permission.
   */
  const checkPhotosPermission = useCallback(async (): Promise<boolean> => {
    if (!Platform.isNative()) return true;

    try {
      const status = await Camera.checkPermissions();
      if (isGranted(status.photos as PermissionState)) {
        return true;
      }

      const requested = await Camera.requestPermissions({ permissions: ['photos'] });
      return isGranted(requested.photos as PermissionState);
    } catch {
      return false;
    }
  }, []);

  /**
   * Check and request camera capture permission.
   */
  const checkCameraPermission = useCallback(async (): Promise<boolean> => {
    if (!Platform.isNative()) return true;

    try {
      const status = await Camera.checkPermissions();
      if (isGranted(status.camera as PermissionState)) {
        return true;
      }

      const requested = await Camera.requestPermissions({ permissions: ['camera'] });
      return isGranted(requested.camera as PermissionState);
    } catch {
      return false;
    }
  }, []);

  // Backward-compatible alias.
  const checkPermissions = checkPhotosPermission;

  return {
    pickFromGallery,
    takePhoto,
    pickMultiple,
    checkPermissions,
    checkPhotosPermission,
    checkCameraPermission,
  };
}
