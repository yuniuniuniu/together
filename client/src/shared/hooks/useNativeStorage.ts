import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@/shared/utils/platform';

/**
 * Cross-platform storage hook.
 * Uses native Capacitor Preferences on Android, falls back to localStorage on web.
 * API compatible with useLocalStorage hook.
 */
export function useNativeStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial value
  useEffect(() => {
    const loadValue = async () => {
      try {
        if (Platform.isNative()) {
          const result = await Preferences.get({ key });
          if (result.value !== null) {
            setStoredValue(JSON.parse(result.value));
          }
        } else {
          const item = window.localStorage.getItem(key);
          if (item !== null) {
            setStoredValue(JSON.parse(item));
          }
        }
      } catch (error) {
        console.error(`Error loading stored value for key "${key}":`, error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadValue();
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const serialized = JSON.stringify(valueToStore);

      if (Platform.isNative()) {
        Preferences.set({ key, value: serialized });
      } else {
        window.localStorage.setItem(key, serialized);
      }
    } catch (error) {
      console.error(`Error saving stored value for key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Async storage utilities for one-off operations
 */
export const NativeStorage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (Platform.isNative()) {
        const result = await Preferences.get({ key });
        return result.value ? JSON.parse(result.value) : null;
      } else {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    if (Platform.isNative()) {
      await Preferences.set({ key, value: serialized });
    } else {
      window.localStorage.setItem(key, serialized);
    }
  },

  async remove(key: string): Promise<void> {
    if (Platform.isNative()) {
      await Preferences.remove({ key });
    } else {
      window.localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (Platform.isNative()) {
      await Preferences.clear();
    } else {
      window.localStorage.clear();
    }
  }
};
