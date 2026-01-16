import { useLocationContext, SearchResult } from "@/contexts/LocationContext";

// Re-export SearchResult for consumers that need it
export type { SearchResult };

export function useUserLocation() {
  return useLocationContext();
}
