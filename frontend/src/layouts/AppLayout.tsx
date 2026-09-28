import { useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Moon, Search, Sparkles, Sun, X } from "lucide-react";

import { cn } from "@/utils/cn";

import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "@/context/SessionContext";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const storedTheme = localStorage.getItem("ai-learning-agent-theme");
    return storedTheme === "dark" ? "dark" : "light";
  });
  const isLearningPlan = location.pathname === "/learning-plan";
  const searchValue = isLearningPlan ? searchParams.get("q") ?? "" : "";
  const nudge = state.nudges;

  if (location.pathname === "/" || location.pathname === "/onboarding") {
    return <Outlet />;
  }

  function handleLearningSearch(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    navigate({ pathname: "/learning-plan", search: params.toString() });
  }

  function handleThemeToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("ai-learning-agent-theme", nextTheme);
  }

  return (
    <div className={`workspace-shell min-h-screen overflow-x-hidden px-3 py-4 text-slate-950 sm:px-5 lg:px-7 ${theme === "dark" ? "dark-workspace" : ""}`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,255,255,0.82),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(64,88,255,0.15),transparent_28%),radial-gradient(circle_at_70%_90%,rgba(20,184,166,0.12),transparent_26%)]" />
      <div className="glass-panel relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1480px] overflow-hidden rounded-[28px] p-3 sm:p-4 lg:p-5">
        <div className="hidden shrink-0 lg:block">
          <Sidebar />
        </div>
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onOpen={() => setIsMobileSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 px-1 pt-14 sm:px-3 lg:px-5 lg:pt-0">
          <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Monday, July 27 2026
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                Learning Report
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isLearningPlan ? (
                <label className="glass-control flex h-11 min-w-0 items-center gap-2 rounded-full px-3 text-slate-700 max-sm:w-full sm:w-72">
                  <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <input
                    aria-label="Search lessons"
                    className="workspace-search-input h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold outline-none placeholder:text-slate-400"
                    onChange={(event) => handleLearningSearch(event.target.value)}
                    placeholder="Search roadmap"
                    type="text"
                    value={searchValue}
                  />
                  {searchValue ? (
                    <button
                      aria-label="Clear search"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white/60 hover:text-slate-950"
                      onClick={() => handleLearningSearch("")}
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </label>
              ) : null}
              <div
                aria-label="Theme"
                className="glass-control inline-flex h-11 items-center rounded-full p-1"
                role="group"
              >
                <button
                  aria-pressed={theme === "light"}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-black text-slate-600",
                    theme === "light" && "blue-pill text-white"
                  )}
                  onClick={() => {
                    if (theme !== "light") {
                      handleThemeToggle();
                    }
                  }}
                  type="button"
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  Light
                </button>
                <button
                  aria-pressed={theme === "dark"}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-black text-slate-600",
                    theme === "dark" && "blue-pill text-white"
                  )}
                  onClick={() => {
                    if (theme !== "dark") {
                      handleThemeToggle();
                    }
                  }}
                  type="button"
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  Dark
                </button>
              </div>
              <button
                aria-label="Notifications"
                className="glass-control relative inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-700"
                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
                type="button"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {nudge ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </button>
              {isNotificationsOpen ? (
                <div className="glass-panel absolute right-4 top-24 z-40 w-[min(92vw,360px)] rounded-[24px] p-4 text-left shadow-2xl sm:right-10 lg:right-12">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Notifications
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        Learning nudges
                      </p>
                    </div>
                    {nudge?.urgency ? (
                      <span className="liquid-danger rounded-full px-2.5 py-1 text-[11px] font-black uppercase text-white">
                        {nudge.urgency}
                      </span>
                    ) : null}
                  </div>
                  {nudge ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium leading-6 text-slate-600">
                        {nudge.personalized_message}
                      </p>
                      {nudge.recommended_action ? (
                        <div className="glass-control rounded-[18px] p-3 text-sm font-black leading-6 text-slate-800">
                          Next action: {nudge.recommended_action}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      No nudges yet.
                    </p>
                  )}
                </div>
              ) : null}
              <div className="glass-control hidden min-h-11 items-center gap-3 rounded-full px-3 py-1 sm:flex">
                <span className="blue-pill inline-flex h-8 w-8 items-center justify-center rounded-full text-white">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-bold text-slate-950">
                    Vidyani AI
                  </span>
                  <span className="block text-xs font-medium text-slate-500">
                    Personal agent
                  </span>
                </span>
              </div>
            </div>
          </header>
          <div className="mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
