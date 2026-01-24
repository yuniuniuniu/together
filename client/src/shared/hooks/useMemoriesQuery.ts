import { useQuery } from '@tanstack/react-query';
import { memoriesApi } from '../api/client';

const QUERY_KEY = ['memories'];

const fetchMemories = async () => {
  const response = await memoriesApi.list(1, 200);
  return response.data?.data ?? [];
};

export function useMemoriesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMemories,
    // Refresh periodically so new memories from self/partner appear without reload
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5_000,
  });
}

export { QUERY_KEY as MEMORIES_QUERY_KEY };
