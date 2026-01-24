// 高德地图全局类型声明
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

// Core Business Types

export interface User {
  id: string;
  email?: string;
  nickname: string;
  avatar?: string;
  createdAt?: Date;
}

export interface Partner {
  user: User;
}

export interface Space {
  id: string;
  createdAt: Date;
  anniversaryDate: Date;
  partners: [User, User];
  inviteCode?: string;
}

export interface Location {
  id?: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isSaved?: boolean;
  icon?: string;
}

export type MediaType = 'image' | 'gif' | 'video';

export interface MediaItem {
  url: string;
  type: MediaType;
  thumbnail?: string; // For video thumbnails
}

export interface Memory {
  id: string;
  spaceId: string;
  content: string;
  mood?: MoodType;
  photos: string[]; // Legacy: simple URL array for backwards compatibility
  media?: MediaItem[]; // New: typed media array with type info
  location?: Location;
  voiceNote?: string;
  stickers?: string[];
  createdAt: Date;
  createdBy: string;
  wordCount?: number;
}

export interface Milestone {
  id: string;
  spaceId: string;
  title: string;
  description?: string;
  date: Date;
  type: MilestoneType;
  icon?: string;
  photos?: string[];
  createdAt: Date;
  createdBy: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

// Enums and Union Types

export type MoodType =
  | 'happy'
  | 'calm'
  | 'together'
  | 'excited'
  | 'moody';

export type MilestoneType =
  | 'anniversary'
  | 'first_date'
  | 'first_kiss'
  | 'first_trip'
  | 'moving_in'
  | 'engagement'
  | 'wedding'
  | 'custom';

export type NotificationType =
  | 'memory_added'
  | 'milestone_reminder'
  | 'partner_activity'
  | 'system';

// API Response Types

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
