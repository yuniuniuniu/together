import { useQuery } from '@tanstack/react-query';
import { memoriesApi } from '../api/client';

export interface Memory {
  id: string;
  spaceId: string;
  content: string;
  mood?: string;
  photos: string[];
  location?: { name: string; address?: string; latitude?: number; longitude?: number };
  voiceNote?: string;
  stickers: string[];
  createdAt: string;
  createdBy: string;
  wordCount?: number;
}

const QUERY_KEY = ['memories'];

const fetchMemories = async (): Promise<Memory[]> => {
  const response = await memoriesApi.list(1, 200);
  const payload = response.data as unknown;
  
  if (Array.isArray(payload)) {
    return payload as Memory[];
  }
  
  if (payload && typeof payload === 'object') {
    const objectPayload = payload as { data?: unknown };
    if (Array.isArray(objectPayload.data)) {
      return objectPayload.data as Memory[];
    }
  }
  
  return [];
};

export function useMemoriesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMemories,
    // Refresh periodically so new memories from self/partner appear without reload
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 15_000,
  });
}

export { QUERY_KEY as MEMORIES_QUERY_KEY };
