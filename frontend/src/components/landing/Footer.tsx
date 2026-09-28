import { Github, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070a12] text-slate-300">
      <div className="mx-auto flex w-[min(100%-2rem,1180px)] flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-semibold">Vidyani.AI</span>
          </div>
          <p className="mt-3 text-sm">Built for Hack Better Than Me 2026</p>
          <p className="mt-1 text-sm text-slate-500">
            Team information coming soon
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm sm:items-end">
          <span className="inline-flex items-center gap-2 text-slate-400">
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub repository coming soon
          </span>
          <p className="text-slate-500">
            Copyright 2026 Vidyani.AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
