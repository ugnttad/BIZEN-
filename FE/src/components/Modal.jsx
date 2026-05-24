import { X } from "lucide-react";

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-3 sm:p-4">
      <section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-soft">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer ? <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">{footer}</footer> : null}
      </section>
    </div>
  );
}
