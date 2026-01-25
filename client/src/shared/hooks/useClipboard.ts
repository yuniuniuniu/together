import { useCallback } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { Platform } from '@/shared/utils/platform';

/**
 * Cross-platform clipboard hook.
 * Uses native Capacitor Clipboard on Android, falls back to web API on browser.
 */
export function useClipboard() {
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (Platform.isNative()) {
        await Clipboard.write({ string: text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, []);

  const readFromClipboard = useCallback(async (): Promise<string | null> => {
    try {
      if (Platform.isNative()) {
        const result = await Clipboard.read();
        return result.value;
      } else {
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  }, []);

  return { copyToClipboard, readFromClipboard };
}
