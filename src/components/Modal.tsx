import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  headerExtras?: React.ReactNode;
  fullScreenOnMobile?: boolean;
}> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-md md:max-w-2xl lg:max-w-[800px]",
  headerExtras,
  fullScreenOnMobile,
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[99999] flex items-center justify-center bg-zinc-950/40 dark:bg-zinc-950/80 backdrop-blur-md transition-all duration-300",
        fullScreenOnMobile ? "p-0 md:p-4 md:py-8 lg:p-6" : "p-4 md:py-8 lg:p-6",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-[#111111] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 ease-out",
          fullScreenOnMobile
            ? "w-full h-full md:h-auto md:max-h-[90vh] md:rounded-3xl md:border md:border-zinc-200/60 dark:md:border-zinc-800/60"
            : "rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 w-full max-h-[90vh]",
          maxWidthClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-[#111111]/80 shrink-0 relative backdrop-blur-xl">
          <div className="flex items-center gap-4 relative z-10">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-tight font-display">{title}</h3>
            {headerExtras}
          </div>
          <button
            onClick={onClose}
            className="relative z-10 p-2 -mr-2 bg-zinc-100/50 hover:bg-zinc-200/80 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/80 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar relative">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
