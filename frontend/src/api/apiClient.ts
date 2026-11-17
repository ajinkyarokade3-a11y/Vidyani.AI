import axios, { AxiosError } from "axios";

import type { ApiErrorResponse } from "@/types/api";

// The frontend and backend share one Vercel domain, so requests stay same-origin.
// `/api` is rewritten to the FastAPI service by vercel.json in production and
// proxied to the local backend by the Vite dev server.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export class ApiRequestError extends Error {
  errorCode: string | null;
  statusCode: number | null;

  constructor(
    message: string,
    options: {
      cause?: unknown;
      errorCode?: string | null;
      statusCode?: number | null;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiRequestError";
    this.errorCode = options.errorCode ?? null;
    this.statusCode = options.statusCode ?? null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const responseData = error.response?.data as ApiErrorResponse | undefined;
    const message =
      responseData && typeof responseData === "object" && "message" in responseData
        ? responseData.message
        : error.message || "Unexpected API error";

    return Promise.reject(
      new ApiRequestError(`API request failed: ${message}`, {
        cause: error,
        errorCode: responseData?.error_code ?? null,
        statusCode: error.response?.status ?? null,
      })
    );
  }
);
