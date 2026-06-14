import React, { useState } from "react";
import { cn } from "../lib/utils";
import {
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
} from "lucide-react";

interface FloatingPanelProps {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  title: string;
  position?: "left" | "right";
  mobilePosition?: "bottom-full" | "bottom-left" | "bottom-right";
  children: React.ReactNode;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  isExpanded,
  setIsExpanded,
  title,
  position = "right",
  mobilePosition = "bottom-full",
  children,
}) => {
  return (
    <div
      className={cn(
        "fixed z-[100] transition-all duration-300 ease-in-out flex flex-col bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xl border-black/10 dark:border-white/10 shadow-2xl overflow-hidden",
        // Mobile positioning
        "bottom-0",
        mobilePosition === "bottom-left" && "left-0",
        mobilePosition === "bottom-right" && "right-0",
        (!mobilePosition || mobilePosition === "bottom-full") && "left-0 right-0",
        
        !isExpanded &&
          mobilePosition === "bottom-left" &&
          "w-1/2 rounded-tr-xl border-r",
        !isExpanded &&
          mobilePosition === "bottom-right" &&
          "w-1/2 rounded-tl-xl border-l",
        !isExpanded &&
          (!mobilePosition || mobilePosition === "bottom-full") &&
          "w-full rounded-t-2xl",
          
        isExpanded && "w-full h-[85dvh] z-[200] rounded-t-2xl border-t",
        !isExpanded && "h-[48px] z-[100] border-t top-auto",

        // Desktop positioning
        "lg:bottom-6 lg:top-24 lg:w-[420px] lg:rounded-2xl lg:border lg:h-auto",
        position === "right"
          ? "lg:right-6 lg:left-auto"
          : "lg:left-6 lg:right-auto",
        isExpanded
          ? "lg:max-h-[calc(100vh-140px)]"
          : "lg:h-[60px] lg:!min-h-[60px]", // Desktop still uses 60px height when collapsed
      )}
    >
      {/* Header / Drag Handle */}
      <div
        className="h-[48px] lg:h-[60px] flex items-center justify-between px-4 sm:px-6 cursor-pointer border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:bg-white/[0.04] transition-colors shrink-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full lg:hidden" />
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-wide flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-zinc-500 dark:text-zinc-500 hidden lg:block" />
            {title}
          </span>
        </div>
        <div className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white transition-colors p-2 rounded-full hover:bg-black/10 dark:bg-white/10">
          {isExpanded ? (
            <div className="flex items-center gap-1 px-2 lg:px-0">
              <span className="text-[11px] font-bold lg:hidden">收起</span>
              <ChevronDown className="w-5 h-5 lg:hidden" />
              <Minimize2 className="w-4 h-4 hidden lg:block" />
            </div>
          ) : (
            <>
              <ChevronUp className="w-5 h-5 lg:hidden" />
              <Maximize2 className="w-4 h-4 hidden lg:block" />
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar",
          !isExpanded && "hidden",
        )}
      >
        <div className="p-4 sm:p-5 flex flex-col min-h-full min-w-0">{children}</div>
      </div>
    </div>
  );
};
