import React, { useState, useEffect } from "react";
import { PopupUI } from "./PopupUI";

export type DialogOptions = {
  title?: string;
  message: string;
  type?: "alert" | "confirm" | "prompt";
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
};

type DialogListener = (options: DialogOptions) => void;
let listener: DialogListener | null = null;

export const dialog = {
  alert: (message: string, title: string = "提示") => {
    return new Promise<void>((resolve) => {
      if (listener) {
        listener({ message, title, type: "alert", onConfirm: () => resolve() });
      } else {
        alert(message);
        resolve();
      }
    });
  },
  confirm: (message: string, title: string = "确认") => {
    return new Promise<boolean>((resolve) => {
      if (listener) {
        listener({
          message,
          title,
          type: "confirm",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      } else {
        resolve(confirm(message));
      }
    });
  },
  prompt: (
    message: string,
    defaultValue: string = "",
    title: string = "输入",
  ) => {
    return new Promise<string | null>((resolve) => {
      if (listener) {
        listener({
          message,
          title,
          type: "prompt",
          defaultValue,
          onConfirm: (val) => resolve(val || ""),
          onCancel: () => resolve(null),
        });
      } else {
        resolve(prompt(message, defaultValue));
      }
    });
  },
  setListener: (l: DialogListener | null) => {
    listener = l;
  },
};

export const DialogManager: React.FC = () => {
  const [current, setCurrent] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    dialog.setListener((options) => {
      setCurrent(options);
      setInputValue(options.defaultValue || "");
    });
    return () => dialog.setListener(null);
  }, []);

  if (!current) return null;

  const handleConfirm = () => {
    const cb = current.onConfirm;
    const val = inputValue;
    setCurrent(null);
    if (cb) cb(current.type === "prompt" ? val : undefined);
  };

  const handleCancel = () => {
    const cb = current.onCancel;
    setCurrent(null);
    if (cb) cb();
  };

  return (
    <PopupUI.Modal
      isOpen={true}
      onClose={current.type === "alert" ? handleConfirm : handleCancel}
      title={current.title || "提示"}
      maxWidthClass="max-w-[400px]"
    >
      <div className="flex flex-col gap-6 pt-2">
        <div className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
          {current.message}
        </div>

        {current.type === "prompt" && (
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") handleCancel();
            }}
          />
        )}

        <div className="flex justify-end gap-3 mt-2">
          {current.type !== "alert" && (
            <PopupUI.ActionButton
              label="取消"
              variant="secondary"
              onClick={handleCancel}
            />
          )}
          <PopupUI.ActionButton
            label="确定"
            variant="primary"
            onClick={handleConfirm}
          />
        </div>
      </div>
    </PopupUI.Modal>
  );
};
