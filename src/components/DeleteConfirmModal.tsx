"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

type DeleteConfirmModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteConfirmModal({
  open,
  title,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeleting(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="关闭弹窗"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 animate-fade-in-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
          <h2 id="delete-modal-title" className="text-lg font-semibold text-slate-900">
            确认删除
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            确定要删除「<span className="font-medium text-slate-700">{title}</span>」吗？此操作无法撤销。
          </p>

          {error && (
            <p className="mt-3 w-full rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "删除中..." : "删除"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
