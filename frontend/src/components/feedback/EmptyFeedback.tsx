import { MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyFeedback() {
  return (
    <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-900 text-white">
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-normal text-slate-950">
        No feedback yet
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Generate a learning session first, and your AI feedback and study
        nudges will appear here.
      </p>
      <Link
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        to="/chat"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        Start in Chat
      </Link>
    </section>
  );
}
