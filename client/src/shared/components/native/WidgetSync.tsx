import { useWidgetSync } from '@/shared/hooks/useWidgetSync';

/**
 * 小部件数据同步组件
 * 放在 SpaceProvider 内部，自动同步数据到 Android 小部件
 */
export function WidgetSync() {
  useWidgetSync();
  return null;
}
