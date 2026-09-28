import { Activity, Fingerprint, ShieldCheck } from "lucide-react";

const benefits = [
  {
    title: "Personalized Learning",
    description:
      "Your roadmap reflects your starting point, schedule, deadline, and target outcome.",
    icon: Fingerprint,
    accent: "text-blue-600 bg-blue-50",
  },
  {
    title: "AI Accountability",
    description:
      "Feedback and nudges keep the next action visible when motivation starts to drift.",
    icon: ShieldCheck,
    accent: "text-violet-600 bg-violet-50",
  },
  {
    title: "Continuous Progress",
    description:
      "Every stage connects to the next, so your learning plan stays practical and measurable.",
    icon: Activity,
    accent: "text-emerald-600 bg-emerald-50",
  },
];

export function Benefits() {
  return (
    <section className="border-y border-slate-200 bg-[#f6f8fc] py-20 sm:py-24">
      <div className="mx-auto grid w-[min(100%-2rem,1180px)] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Why Vidyani.AI?
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Learning support built around your momentum
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            More than a one-time plan, Vidyani.AI gives you a connected loop of
            direction, reflection, and focused action.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                key={benefit.title}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-md ${benefit.accent}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
