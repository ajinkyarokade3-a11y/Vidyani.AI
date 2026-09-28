import {
  BellRing,
  Bot,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Mic,
  Youtube,
} from "lucide-react";

import { FeatureCard } from "@/components/landing/FeatureCard";

const features = [
  {
    title: "AI Learning Planner",
    description:
      "Creates a personalized, milestone-based learning roadmap based on your goal, current skill level, schedule, and target deadline.",
    icon: BrainCircuit,
    tone: "blue" as const,
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor completion, milestones, estimated completion date, upcoming tasks, and overall learning progress in real time.",
    icon: ChartNoAxesCombined,
    tone: "emerald" as const,
  },
  {
    title: "AI Mentor",
    description:
      "Chat with an AI mentor for concept explanations, doubt solving, study guidance, and personalized learning support.",
    icon: Bot,
    tone: "violet" as const,
  },
  {
    title: "Quiz & Knowledge Checks",
    description:
      "Generate AI-powered quizzes to assess your understanding and identify concepts that need revision.",
    icon: ClipboardCheck,
    tone: "amber" as const,
  },
  {
    title: "Mock Interview",
    description:
      "Practice AI-powered mock interviews with voice interaction, instant evaluation, and detailed performance feedback.",
    icon: Mic,
    tone: "rose" as const,
  },
  {
    title: "Smart Feedback & Nudges",
    description:
      "Receive personalized feedback, actionable recommendations, and intelligent nudges to stay on track.",
    icon: BellRing,
    tone: "cyan" as const,
  },
  {
    title: "YouTube Learning Resources",
    description:
      "Access curated YouTube learning resources for every topic, complete with estimated learning time based on real video durations.",
    icon: Youtube,
    tone: "rose" as const,
  },
  {
    title: "Google Calendar Integration",
    description:
      "Sync your learning roadmap with Google Calendar to schedule study sessions and stay accountable.",
    icon: CalendarDays,
    tone: "blue" as const,
  },
];

export function FeatureGrid() {
  return (
    <section
      className="scroll-mt-20 border-b border-slate-200 bg-slate-50 py-20 sm:py-24"
      id="features"
    >
      <div className="mx-auto w-[min(100%-2rem,1180px)]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-blue-700">
            One companion, complete support
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            Everything you need to keep learning forward
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Vidyani.AI connects planning, progress, coaching, and accountability
            into one clear learning experience.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
