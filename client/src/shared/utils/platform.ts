import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for cross-platform support.
 * Uses Capacitor to detect if running as a native app or in web browser.
 */
export const Platform = {
  /**
   * Check if running in a native app (Android or iOS)
   */
  isNative: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  /**
   * Check if running on Android
   */
  isAndroid: (): boolean => {
    return Platform.isNative() && Capacitor.getPlatform() === 'android';
  },

  /**
   * Check if running on iOS
   */
  isIOS: (): boolean => {
    return Platform.isNative() && Capacitor.getPlatform() === 'ios';
  },

  /**
   * Check if running in web browser
   */
  isWeb: (): boolean => {
    return !Platform.isNative();
  },

  /**
   * Get current platform name
   */
  getPlatform: (): 'android' | 'ios' | 'web' => {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  }
};

export default Platform;
