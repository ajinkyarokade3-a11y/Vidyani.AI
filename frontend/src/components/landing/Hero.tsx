import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import { cn } from "@/utils/cn";

export function Hero() {
  return (
    <section className="landing-hero relative isolate overflow-hidden bg-[#080b14] text-white">
      <div className="landing-grid absolute inset-0 -z-20 opacity-35" />
      <div className="landing-light-path absolute inset-x-0 top-0 -z-10 h-full" />

      <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] w-[min(100%-2rem,1180px)] flex-col items-center justify-center pb-8 pt-10 text-center sm:pt-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur-xl">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Your AI Learning Companion
        </div>

        <h1 className="mt-5 max-w-5xl text-4xl font-bold leading-[1.08] tracking-normal text-white sm:text-6xl lg:text-7xl">
          Learn smarter with{" "}
          <span className="text-blue-400">Vidyani.AI</span>
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          An AI-powered learning companion that creates personalized roadmaps,
          tracks your progress, provides intelligent feedback, and keeps you
          accountable until you achieve your goals.
        </p>

        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            className={cn(buttonVariants({ size: "large" }), "w-full sm:w-auto")}
            to="/onboarding"
          >
            Get Started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            className={cn(
              buttonVariants({ size: "large", variant: "secondary" }),
              "w-full sm:w-auto"
            )}
            href="#features"
          >
            Explore Features
          </a>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <div
      aria-label="Vidyani.AI learning dashboard preview"
      className="mt-8 w-full max-w-5xl overflow-hidden rounded-lg border border-white/15 bg-white/8 text-left shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      role="img"
    >
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-medium text-slate-400">
          learning.vidyani.ai
        </span>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-1 md:min-h-64 md:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/10 p-4 md:block">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Vidyani.AI
          </div>
          <PreviewNavItem icon={BarChart3} label="Overview" selected />
          <PreviewNavItem icon={BookOpenCheck} label="Learning plan" />
          <PreviewNavItem icon={Target} label="Progress" />
          <PreviewNavItem icon={MessageSquareText} label="Feedback" />
        </aside>

        <div className="bg-[#0d1220]/75 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-blue-300">
                Data Science Roadmap
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Your next milestone is ready
              </h2>
            </div>
            <span className="w-fit rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">
              On track
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <PreviewMetric label="Roadmap" value="12 weeks" />
            <PreviewMetric label="Daily focus" value="3 hours" />
            <PreviewMetric label="Progress" value="24%" accent />
          </div>

          <div className="mt-5 hidden gap-3 sm:grid lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  Foundations phase
                </p>
                <span className="text-xs text-slate-400">Week 2 of 12</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/4 rounded-full bg-blue-500" />
              </div>
              <div className="mt-4 space-y-2.5">
                {["Python essentials", "Statistics basics", "Data workflow"].map(
                  (item, index) => (
                    <div
                      className="flex items-center gap-2 text-xs text-slate-300"
                      key={item}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full",
                          index === 0
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "border border-white/15 text-slate-500"
                        )}
                      >
                        {index === 0 ? (
                          <Check className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-md border border-violet-300/15 bg-violet-400/8 p-4">
              <p className="text-xs font-semibold uppercase text-violet-300">
                AI coach
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                You are building steady momentum. Complete one focused Python
                exercise today before moving to statistics.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Next action ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PreviewNavItemProps = {
  icon: typeof BarChart3;
  label: string;
  selected?: boolean;
};

function PreviewNavItem({
  icon: Icon,
  label,
  selected = false,
}: PreviewNavItemProps) {
  return (
    <div
      className={cn(
        "mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs",
        selected
          ? "bg-blue-500/15 font-semibold text-blue-200"
          : "text-slate-400"
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </div>
  );
}

function PreviewMetric({
  accent = false,
  label,
  value,
}: {
  accent?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-3 sm:px-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-1 truncate text-base font-semibold sm:text-lg",
          accent ? "text-emerald-300" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}
