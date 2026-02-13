import { useEffect, useCallback } from 'react';
import { Platform } from '@/shared/utils/platform';
import { Widget } from '@/shared/plugins/widget';
import { useAuth } from '@/shared/context/AuthContext';
import { useSpace } from '@/shared/context/SpaceContext';

/**
 * 同步小部件数据的 Hook
 * 当用户信息或空间信息变化时，自动更新 Android 小部件
 */
export function useWidgetSync() {
  const { user } = useAuth();
  const { space, partner } = useSpace();

  const syncWidgetData = useCallback(async () => {
    // 只在 Android 原生环境下执行
    if (!Platform.isNative()) {
      return;
    }

    try {
      if (space && user) {
        // 确定两个用户的顺序（当前用户在前）
        const user1 = user;
        const user2 = partner?.user;

        await Widget.updateWidgetData({
          anniversaryDate: space.anniversaryDate.toISOString(),
          user1Name: user1.nickname || '我',
          user2Name: user2?.nickname || 'TA',
          user1Avatar: user1.avatar,
          user2Avatar: user2?.avatar,
        });

        console.log('[Widget] Data synced successfully');
      } else {
        // 没有空间数据时清除小部件
        await Widget.clearWidgetData();
        console.log('[Widget] Data cleared');
      }
    } catch (error) {
      // 插件可能不存在（Web 环境），静默忽略
      console.warn('[Widget] Sync failed:', error);
    }
  }, [user, space, partner]);

  // 当数据变化时自动同步
  useEffect(() => {
    syncWidgetData();
  }, [syncWidgetData]);

  // 暴露手动刷新方法
  const refreshWidget = useCallback(async () => {
    if (!Platform.isNative()) {
      return;
    }

    try {
      await Widget.refreshWidget();
    } catch (error) {
      console.warn('[Widget] Refresh failed:', error);
    }
  }, []);

  return { syncWidgetData, refreshWidget };
}
