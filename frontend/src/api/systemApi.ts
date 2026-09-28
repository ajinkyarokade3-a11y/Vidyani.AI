import { apiClient } from "@/api/apiClient";
import type { HealthApiResponse, RootApiResponse } from "@/types/system";

export async function getApiRoot(): Promise<RootApiResponse> {
  const response = await apiClient.get<RootApiResponse>("/");
  return response.data;
}

export async function getHealth(): Promise<HealthApiResponse> {
  const response = await apiClient.get<HealthApiResponse>("/health");
  return response.data;
}
