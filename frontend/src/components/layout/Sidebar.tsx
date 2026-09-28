import {
  BookOpen,
  ClipboardCheck,
  BriefcaseBusiness,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

import { SidebarFooter } from "@/components/layout/SidebarFooter";
import { SidebarItem } from "@/components/layout/SidebarItem";

const sidebarItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Learning Plan", to: "/learning-plan", icon: BookOpen },
  { label: "Quiz", to: "/quiz", icon: ClipboardCheck },
  { label: "AI Mentor", to: "/mentor", icon: MessagesSquare },
  {
    label: "Mock Interview",
    to: "/interview",
    icon: BriefcaseBusiness,
  },
  { label: "Progress", to: "/progress", icon: TrendingUp },
  {
    label: "Feedback",
    to: "/feedback",
    icon: MessageCircle,
  },
];

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full w-[224px] shrink-0 flex-col rounded-[24px] p-3 text-slate-950">
      <div className="p-2 pb-5">
        <Link
          className="group flex items-center gap-3 rounded-[20px] px-2 py-2 transition hover:bg-white/50"
          onClick={onNavigate}
          to="/"
        >
          <span className="blue-pill flex h-10 w-10 items-center justify-center rounded-[16px] text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-black tracking-tight text-slate-950">
              Vidyani.AI
            </span>
            <span className="block text-xs font-semibold text-slate-500">
              Learning Workspace
            </span>
          </span>
        </Link>
      </div>

      <p className="px-3 pb-2 text-[11px] font-bold uppercase text-slate-400">
        Menu
      </p>
      <nav className="space-y-1" aria-label="Workspace navigation">
        {sidebarItems.map((item) => (
          <SidebarItem
            icon={item.icon}
            key={`${item.label}-${item.to}`}
            label={item.label}
            onClick={onNavigate}
            to={item.to}
          />
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
