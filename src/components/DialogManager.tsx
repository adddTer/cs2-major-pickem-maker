import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";

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
    <Modal
      isOpen={true}
      onClose={current.type === "alert" ? handleConfirm : handleCancel}
      title={current.title || "提示"}
    >
      <div className="flex flex-col gap-4">
        <div className="text-zinc-900 dark:text-zinc-200 text-sm whitespace-pre-wrap">
          {current.message}
        </div>

        {current.type === "prompt" && (
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="p-2 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded text-sm text-zinc-900 dark:text-zinc-200 w-full focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") handleCancel();
            }}
          />
        )}

        <div className="flex justify-end gap-3 mt-4">
          {current.type !== "alert" && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:bg-white/5 text-zinc-800 dark:text-zinc-300 font-bold text-sm transition-colors rounded-md"
            >
              取消
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-black dark:text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20"
          >
            确定
          </button>
        </div>
      </div>
    </Modal>
  );
};
