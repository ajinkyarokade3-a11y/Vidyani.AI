import { useState } from "react";
import type { QueryObserverResult } from "@tanstack/react-query";

import {
  useFeedback,
  useLatestIntent,
  useLearningPlan,
  useNudges,
  useProgress,
  useStartLearningSession,
  useUser,
} from "@/hooks/useLearningApi";
import { useApiRoot, useHealth } from "@/hooks/useSystemApi";

type ApiTestResult = {
  label: string;
  status: "idle" | "loading" | "success" | "error";
  data?: unknown;
  error?: string;
};

const initialPrompt =
  "I want to become job-ready in Python for Data Science within 4 months. I am currently a beginner with basic programming knowledge. I can study for 2 hours every weekday and 4 hours on weekends. I prefer hands-on learning with projects and coding exercises over long theoretical lessons. My goal is to build a strong portfolio, complete 3 end-to-end projects, and prepare for technical interviews for Data Science internships.";

export function ApiTestPage() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [userIdInput, setUserIdInput] = useState("");
  const [result, setResult] = useState<ApiTestResult>({
    label: "No request run yet",
    status: "idle",
  });

  const userId = Number(userIdInput);
  const validUserId = Number.isInteger(userId) && userId > 0 ? userId : null;

  const learningSessionMutation = useStartLearningSession();
  const rootQuery = useApiRoot(false);
  const healthQuery = useHealth(false);
  const userQuery = useUser(validUserId, false);
  const intentQuery = useLatestIntent(validUserId, false);
  const planQuery = useLearningPlan(validUserId, false);
  const progressQuery = useProgress(validUserId, false);
  const feedbackQuery = useFeedback(validUserId, false);
  const nudgesQuery = useNudges(validUserId, false);

  const isLoading =
    learningSessionMutation.isPending ||
    rootQuery.isFetching ||
    healthQuery.isFetching ||
    userQuery.isFetching ||
    intentQuery.isFetching ||
    planQuery.isFetching ||
    progressQuery.isFetching ||
    feedbackQuery.isFetching ||
    nudgesQuery.isFetching;

  async function runRequest<TData>(
    label: string,
    request: () => Promise<TData>
  ) {
    setResult({ label, status: "loading" });
    try {
      const data = await request();
      setResult({ label, status: "success", data });
    } catch (error) {
      setResult({
        label,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown API error",
      });
    }
  }

  async function runQueryRequest<TData>(
    label: string,
    request: () => Promise<QueryObserverResult<TData, Error>>
  ) {
    setResult({ label, status: "loading" });
    const queryResult = await request();
    if (queryResult.error) {
      setResult({
        label,
        status: "error",
        error: queryResult.error.message,
      });
      return;
    }

    setResult({ label, status: "success", data: queryResult.data });
  }

  function requireUserId() {
    if (validUserId === null) {
      setResult({
        label: "Validation",
        status: "error",
        error: "Enter a valid positive user ID before calling this endpoint.",
      });
      return false;
    }
    return true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">API Test</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Temporary endpoint verification page for the frontend API layer.
        </p>
      </div>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <ApiButton
            disabled={isLoading}
            label="Get API Root"
            onClick={() => {
              void runQueryRequest("GET /", () => rootQuery.refetch());
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Health"
            onClick={() => {
              void runQueryRequest("GET /health", () => healthQuery.refetch());
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          User name
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Rishabh"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="optional@example.com"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Prompt
          <textarea
            className="min-h-32 rounded-md border border-slate-300 px-3 py-2 text-slate-950"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>
        <button
          className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isLoading || !userName.trim() || !prompt.trim()}
          onClick={() =>
            runRequest("POST /learning/session", () =>
              learningSessionMutation.mutateAsync({
                user_name: userName,
                email: email.trim() || null,
                prompt,
              })
            )
          }
          type="button"
        >
          Start Learning Session
        </button>
      </section>

      <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          User ID
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950"
            inputMode="numeric"
            value={userIdInput}
            onChange={(event) => setUserIdInput(event.target.value)}
            placeholder="1"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <ApiButton
            disabled={isLoading}
            label="Get User"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}", () => userQuery.refetch());
              }
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Intent"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}/intent", () =>
                  intentQuery.refetch()
                );
              }
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Plan"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}/plan", () =>
                  planQuery.refetch()
                );
              }
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Progress"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}/progress", () =>
                  progressQuery.refetch()
                );
              }
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Feedback"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}/feedback", () =>
                  feedbackQuery.refetch()
                );
              }
            }}
          />
          <ApiButton
            disabled={isLoading}
            label="Get Nudges"
            onClick={() => {
              if (requireUserId()) {
                void runQueryRequest("GET /users/{id}/nudges", () =>
                  nudgesQuery.refetch()
                );
              }
            }}
          />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-950">
            {result.label}
          </h2>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium uppercase text-slate-600">
            {isLoading ? "loading" : result.status}
          </span>
        </div>
        <pre className="max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-50">
          {JSON.stringify(
            result.error ? { error: result.error } : result.data ?? result,
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}

type ApiButtonProps = {
  disabled: boolean;
  label: string;
  onClick: () => void;
};

function ApiButton({ disabled, label, onClick }: ApiButtonProps) {
  return (
    <button
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
