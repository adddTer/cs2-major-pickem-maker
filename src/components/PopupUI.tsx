import React from "react";
import { cn } from "../lib/utils";
import { CheckSquare, Square, X } from "lucide-react";
import { Modal } from "./Modal";

export class PopupUI {
  static Modal = Modal;

  static SectionTitle({ children }: { children: React.ReactNode }) {
    return (
      <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-1 mt-4 mb-2">
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
          "flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded cursor-pointer border border-black/5 dark:border-white/5 transition-colors hover:bg-black/10 dark:hover:bg-white/10 mb-2",
          className
        )}
        onClick={() => onChange(!checked)}
      >
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
          {label}
        </span>
        {checked ? (
          <CheckSquare className="w-5 h-5 text-blue-500" />
        ) : (
          <Square className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
        )}
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
          "flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border",
          checked
            ? "bg-blue-500/10 border-blue-500/30"
            : "bg-zinc-200/20 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-zinc-200/40 dark:bg-black/40",
          className
        )}
        onClick={() => onChange(!checked)}
      >
        {checked ? (
          <CheckSquare className="w-5 h-5 text-blue-500 shrink-0" />
        ) : (
          <Square className="w-5 h-5 text-zinc-400 dark:text-zinc-600 shrink-0" />
        )}
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-200 truncate flex-1">
          {label}
        </span>
        {countText && (
          <span className="text-xs font-mono text-zinc-500">{countText}</span>
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
      <div className="flex gap-2 w-full mb-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded border transition-colors",
                isSelected
                  ? "bg-blue-600/20 text-blue-500 border-blue-500/30"
                  : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10"
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
      <div className="relative flex flex-col gap-2 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {(leftLabel || rightLabel) && (
          <div className="flex justify-between text-[0.625rem] text-zinc-500 dark:text-zinc-400 px-1 font-mono font-bold">
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
    variant?: "primary" | "secondary" | "success";
    disabled?: boolean;
    isLoading?: boolean;
  }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "px-6 py-2.5 font-bold text-sm transition-colors rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
          variant === "success" &&
            "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20",
          variant === "secondary" &&
            "border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-zinc-800 dark:text-zinc-200"
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
