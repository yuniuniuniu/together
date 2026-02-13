import { registerPlugin } from '@capacitor/core';

export interface WidgetData {
  anniversaryDate: string;
  user1Name: string;
  user2Name: string;
  user1Avatar?: string;
  user2Avatar?: string;
}

export interface WidgetPlugin {
  updateWidgetData(data: WidgetData): Promise<{ success: boolean }>;
  refreshWidget(): Promise<{ success: boolean }>;
  clearWidgetData(): Promise<{ success: boolean }>;
}

const Widget = registerPlugin<WidgetPlugin>('Widget');

export { Widget };
