import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/apiClient";

export interface MoonSummary {
  date: string;
  phase: string;
  illumination: number;
  distance_km: number;
}

// Shared moon summary hook with aggressive caching to avoid rapid polling
export function useMoonSummary(date?: string, lat = 28.5, lon = -80.6) {
  const { request } = useApiClient();
  const day = date || new Date().toISOString().split("T")[0];
  const queryKey = ["moon-summary", day, lat, lon];

  return useQuery<MoonSummary>({
    queryKey,
    // Single source of truth call; all components share cache
    queryFn: async () => {
      const qs = new URLSearchParams({ date: day, lat: String(lat), lon: String(lon) }).toString();
      const data = await request<MoonSummary>(`/api/space/moon?${qs}`, { method: "GET", label: "Moon summary" });
      return {
        date: data.date,
        phase: data.phase ?? "Unknown",
        illumination: Number(data.illumination ?? 0),
        distance_km: Number(data.distance_km ?? 384400),
      } as MoonSummary;
    },
    // Avoid refetch storms
    staleTime: 30 * 60 * 1000, // 30 minutes considered fresh
    gcTime: 2 * 60 * 60 * 1000, // 2 hours in cache (v5: gcTime replaces cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

export default useMoonSummary;
