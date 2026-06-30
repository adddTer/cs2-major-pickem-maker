import React from "react";
import { cn } from "../lib/utils";
import { CheckSquare, Square, X } from "lucide-react";
import { Modal } from "./Modal";

export class PopupUI {
  static Modal = Modal;

  static SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1 mt-6 mb-3 font-display">
        {children}
      </div>
    );
  }

  static SwitchRow({
    label,
    checked,
    onChange,
    className,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
  }) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl cursor-pointer border border-zinc-200/50 dark:border-zinc-800/50 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80 mb-2 shadow-sm",
          checked && "border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5",
          className
        )}
        onClick={() => onChange(!checked)}
      >
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-wide">
          {label}
        </span>
        <div className="relative flex items-center justify-center">
          <div className={cn(
            "w-10 h-6 rounded-full transition-colors duration-300 ease-in-out border",
            checked ? "bg-blue-500 border-blue-500" : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
          )}>
            <div className={cn(
              "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm",
              checked ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </div>
      </div>
    );
  }

  static CheckboxRow({
    label,
    checked,
    onChange,
    className,
    countText,
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
    countText?: string;
  }) {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border shadow-sm",
          checked
            ? "bg-blue-50/80 dark:bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
            : "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700",
          className
        )}
        onClick={() => onChange(!checked)}
      >
        {checked ? (
          <CheckSquare className="w-5 h-5 text-blue-500 shrink-0" />
        ) : (
          <Square className="w-5 h-5 text-zinc-300 dark:text-zinc-700 shrink-0" />
        )}
        <span className={cn(
          "font-bold text-sm truncate flex-1 transition-colors",
          checked ? "text-blue-950 dark:text-blue-100" : "text-zinc-700 dark:text-zinc-300"
        )}>
          {label}
        </span>
        {countText && (
          <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{countText}</span>
        )}
      </div>
    );
  }

  static ButtonGroup({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
  }) {
    return (
      <div className="flex gap-2 w-full mb-3 bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                isSelected
                  ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  static Slider({
    value,
    min,
    max,
    step,
    onChange,
    leftLabel,
    rightLabel,
  }: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    leftLabel?: string;
    rightLabel?: string;
  }) {
    return (
      <div className="relative flex flex-col gap-3 w-full py-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        />
        {(leftLabel || rightLabel) && (
          <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 px-1 font-mono font-bold tracking-tight">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        )}
      </div>
    );
  }

  static ActionButton({
    label,
    icon: Icon,
    onClick,
    variant = "primary",
    disabled,
    isLoading,
  }: {
    label: string;
    icon?: any;
    onClick: () => void;
    variant?: "primary" | "secondary" | "success" | "danger";
    disabled?: boolean;
    isLoading?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "px-6 py-3 font-bold text-sm transition-all rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]",
          variant === "primary" &&
            "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 ring-1 ring-blue-500/50",
          variant === "success" &&
            "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 ring-1 ring-emerald-500/50",
          variant === "danger" &&
            "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20 hover:shadow-rose-900/30 ring-1 ring-rose-500/50",
          variant === "secondary" &&
            "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 shadow-sm"
        )}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {!isLoading && Icon && <Icon className="w-4 h-4" />}
        {label}
      </button>
    );
  }
}
