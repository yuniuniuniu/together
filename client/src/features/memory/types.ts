import type { Memory, MoodType, Location } from '../../shared/types';

export interface CreateMemoryData {
  content: string;
  mood?: MoodType;
  photos?: string[];
  location?: Location;
  voiceNote?: string;
  stickers?: string[];
}

export interface MemoryFilters {
  mood?: MoodType;
  startDate?: Date;
  endDate?: Date;
  hasPhotos?: boolean;
  hasLocation?: boolean;
}

export type { Memory, MoodType, Location };
