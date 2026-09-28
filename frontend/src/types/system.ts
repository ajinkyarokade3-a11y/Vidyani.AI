import type { ApiSuccessResponse } from "@/types/api";

export type RootData = {
  service: string;
  version: string;
  docs: string;
};

export type HealthData = {
  status: string;
  database: string;
  version: string;
};

export type RootApiResponse = ApiSuccessResponse<RootData>;
export type HealthApiResponse = ApiSuccessResponse<HealthData>;
