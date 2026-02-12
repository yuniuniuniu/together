import { Platform } from './platform';

type ImpactStyle = 'light' | 'medium' | 'heavy';

/**
 * Lightweight haptics wrapper.
 *
 * - Native (Capacitor): uses @capacitor/haptics when available
 * - Web fallback: uses navigator.vibrate when available
 *
 * All methods are "fire-and-forget" and never throw.
 */
export const Haptics = {
  impact: async (style: ImpactStyle = 'light') => {
    try {
      if (Platform.isNative()) {
        const mod = await import('@capacitor/haptics');
        const ImpactStyleEnum = mod.ImpactStyle;
        const mapped =
          style === 'heavy'
            ? ImpactStyleEnum.Heavy
            : style === 'medium'
              ? ImpactStyleEnum.Medium
              : ImpactStyleEnum.Light;
        await mod.Haptics.impact({ style: mapped });
        return;
      }

      // Web fallback (mostly Android)
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        const duration = style === 'heavy' ? 20 : style === 'medium' ? 12 : 8;
        navigator.vibrate(duration);
      }
    } catch {
      // ignore
    }
  },

  selectionChanged: async () => {
    try {
      if (Platform.isNative()) {
        const mod = await import('@capacitor/haptics');
        await mod.Haptics.selectionChanged();
        return;
      }

      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(6);
      }
    } catch {
      // ignore
    }
  },
};

export default Haptics;
