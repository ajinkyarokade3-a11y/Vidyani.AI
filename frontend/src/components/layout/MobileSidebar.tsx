import { Menu, X } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";

type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function MobileSidebar({ isOpen, onClose, onOpen }: MobileSidebarProps) {
  return (
    <>
      <button
        aria-label="Open workspace navigation"
        className="glass-control fixed left-5 top-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-800 lg:hidden"
        onClick={onOpen}
        type="button"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close workspace navigation"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={onClose}
            type="button"
          />
          <div className="relative h-full w-[min(86vw,248px)] p-3">
            <Sidebar onNavigate={onClose} />
            <button
              aria-label="Close workspace navigation"
              className="glass-control absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-800"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
