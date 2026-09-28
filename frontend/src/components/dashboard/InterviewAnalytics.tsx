import { BarChart3, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export function InterviewAnalytics() {
  return (
    <section className="metric-card flex h-full min-h-72 flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-950">Interview Analytics</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Performance overview
          </p>
        </div>
        <span className="glass-control flex h-10 w-10 items-center justify-center rounded-full text-blue-600">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-7 text-center">
        <span className="glass-control flex h-14 w-14 items-center justify-center rounded-full text-slate-500">
          <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-sm font-black text-slate-950">
          No interviews completed yet
        </h3>
        <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-slate-500">
          Complete your first mock interview to unlock technical,
          communication, and confidence insights.
        </p>
        <Link
          className="blue-pill mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-black text-white"
          to="/interview"
        >
          Start Mock Interview
        </Link>
      </div>

      <p className="border-t border-slate-200/80 pt-4 text-xs font-bold text-slate-400">
        Last updated: No interview data
      </p>
    </section>
  );
}
