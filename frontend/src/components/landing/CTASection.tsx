import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/common/buttonVariants";
import { cn } from "@/utils/cn";

export function CTASection() {
  return (
    <section className="bg-[#0b1020] px-4 py-20 text-white sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-blue-300/20 bg-blue-400/10 text-blue-300">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-3xl font-bold tracking-normal sm:text-5xl">
          Start Your Learning Journey Today
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Turn your goal into a practical roadmap, then keep moving with clear
          progress, adaptive feedback, and accountable next steps.
        </p>
        <Link
          className={cn(buttonVariants({ size: "large" }), "mt-8")}
          to="/onboarding"
        >
          Generate My Learning Plan
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
