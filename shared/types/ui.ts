// UI-related Types

import type { MoodType, MilestoneType } from './index';

// Mood UI Configuration
export interface MoodConfig {
  type: MoodType;
  icon: string;
  label: string;
}

export const MOOD_CONFIGS: MoodConfig[] = [
  { type: 'happy', icon: 'sentiment_very_satisfied', label: 'Happy' },
  { type: 'calm', icon: 'self_improvement', label: 'Calm' },
  { type: 'together', icon: 'favorite', label: 'Together' },
  { type: 'excited', icon: 'auto_awesome', label: 'Excited' },
  { type: 'moody', icon: 'filter_drama', label: 'Moody' },
];

// Milestone UI Configuration
export interface MilestoneTypeConfig {
  type: MilestoneType;
  icon: string;
  label: string;
  defaultTitle: string;
}

export const MILESTONE_TYPE_CONFIGS: MilestoneTypeConfig[] = [
  { type: 'anniversary', icon: 'celebration', label: 'Anniversary', defaultTitle: 'Our Anniversary' },
  { type: 'first_date', icon: 'favorite', label: 'First Date', defaultTitle: 'Our First Date' },
  { type: 'first_kiss', icon: 'favorite', label: 'First Kiss', defaultTitle: 'Our First Kiss' },
  { type: 'first_trip', icon: 'flight', label: 'First Trip', defaultTitle: 'Our First Trip' },
  { type: 'moving_in', icon: 'home', label: 'Moving In', defaultTitle: 'Moving In Together' },
  { type: 'engagement', icon: 'diamond', label: 'Engagement', defaultTitle: 'Our Engagement' },
  { type: 'wedding', icon: 'church', label: 'Wedding', defaultTitle: 'Our Wedding' },
  { type: 'custom', icon: 'star', label: 'Custom', defaultTitle: 'Special Moment' },
];

// Button Variants
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Header Action Types
export interface HeaderAction {
  icon: string;
  onClick: () => void;
  label?: string;
}

// Bottom Sheet State
export interface BottomSheetState {
  isOpen: boolean;
  onClose: () => void;
}

// Navigation Item
export interface NavItem {
  icon: string;
  label: string;
  path: string;
  isActive?: boolean;
}

// Sticker Category
export interface StickerCategory {
  id: string;
  label: string;
  icons: string[];
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    id: 'love',
    label: 'Love',
    icons: ['favorite', 'spa', 'storm', 'nightlight', 'sunny', 'pets', 'coffee', 'cake', 'wine_bar', 'flight', 'home', 'camera']
  },
  {
    id: 'daily',
    label: 'Daily',
    icons: ['restaurant', 'local_cafe', 'shopping_bag', 'work', 'fitness_center', 'movie', 'music_note', 'book']
  },
  {
    id: 'moods',
    label: 'Moods',
    icons: ['sentiment_very_satisfied', 'sentiment_satisfied', 'sentiment_neutral', 'sentiment_dissatisfied', 'mood', 'face']
  },
  {
    id: 'travel',
    label: 'Travel',
    icons: ['flight', 'directions_car', 'train', 'beach_access', 'landscape', 'hotel']
  },
  {
    id: 'nature',
    label: 'Nature',
    icons: ['park', 'forest', 'water', 'wb_sunny', 'nights_stay', 'eco']
  },
];
