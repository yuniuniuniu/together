import { useQuery } from '@tanstack/react-query';
import { milestonesApi } from '../api/client';

const QUERY_KEY = ['milestones'];

const fetchMilestones = async () => {
  const response = await milestonesApi.list();
  return response.data ?? [];
};

export function useMilestonesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMilestones,
    // Refresh periodically so new milestones from self/partner appear without reload
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 15_000,
  });
}

export { QUERY_KEY as MILESTONES_QUERY_KEY };
