import { useCallback, useState } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Platform } from '@/shared/utils/platform';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Cross-platform geolocation hook.
 * Uses native Capacitor Geolocation on Android, falls back to web API.
 */
export function useNativeGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Get current position once
   */
  const getCurrentPosition = useCallback(async (): Promise<GeoPosition | null> => {
    setLoading(true);
    setError(null);

    try {
      if (Platform.isNative()) {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        const result: GeoPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        };
        setPosition(result);
        return result;
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            const err = 'Geolocation is not supported by this browser';
            setError(err);
            reject(err);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const result: GeoPosition = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp
              };
              setPosition(result);
              resolve(result);
            },
            (err) => {
              setError(err.message);
              reject(err.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000
            }
          );
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check and request location permissions
   */
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    if (!Platform.isNative()) {
      // On web, permissions are handled by the browser automatically
      return true;
    }

    try {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted') {
        return true;
      }

      const requested = await Geolocation.requestPermissions();
      return requested.location === 'granted';
    } catch {
      return false;
    }
  }, []);

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    checkPermissions
  };
}
