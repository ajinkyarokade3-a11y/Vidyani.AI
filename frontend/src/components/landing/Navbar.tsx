import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { buttonVariants } from "@/components/common/buttonVariants";
import { cn } from "@/utils/cn";

const navigationItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080b14]/85 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-[min(100%-2rem,1180px)] items-center justify-between">
        <Link
          aria-label="Vidyani.AI home"
          className="inline-flex items-center gap-2.5 font-semibold"
          to="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500 text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg">Vidyani.AI</span>
        </Link>

        <nav
          aria-label="Landing page navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navigationItems.map((item) => (
            <a
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
          <Link
            className={cn(buttonVariants(), "ml-3 min-h-10 px-4")}
            to="/onboarding"
          >
            Get Started
          </Link>
        </nav>

        <Button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          className="md:hidden"
          onClick={() => setIsOpen((current) => !current)}
          size="icon"
          variant="secondary"
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      {isOpen ? (
        <nav
          aria-label="Mobile landing page navigation"
          className="border-t border-white/10 bg-[#080b14] px-4 py-4 md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto flex w-full max-w-lg flex-col gap-1">
            {navigationItems.map((item) => (
              <a
                className="rounded-md px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/8"
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              className={cn(buttonVariants(), "mt-3 w-full")}
              onClick={() => setIsOpen(false)}
              to="/onboarding"
            >
              Get Started
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
