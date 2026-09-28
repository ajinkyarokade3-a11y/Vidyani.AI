import { useQuery } from "@tanstack/react-query";

import { getApiRoot, getHealth } from "@/api/systemApi";
import type { HealthApiResponse, RootApiResponse } from "@/types/system";

export const systemQueryKeys = {
  root: ["system", "root"] as const,
  health: ["system", "health"] as const,
};

export function useApiRoot(enabled = true) {
  return useQuery<RootApiResponse, Error>({
    queryKey: systemQueryKeys.root,
    queryFn: getApiRoot,
    enabled,
  });
}

export function useHealth(enabled = true) {
  return useQuery<HealthApiResponse, Error>({
    queryKey: systemQueryKeys.health,
    queryFn: getHealth,
    enabled,
  });
}
