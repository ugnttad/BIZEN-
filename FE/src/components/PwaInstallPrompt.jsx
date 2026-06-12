import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

const DISMISS_KEY = "bizen_pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function recentlyDismissed() {
  const value = Number(localStorage.getItem(DISMISS_KEY) || 0);
  if (!value) return false;
  return Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function PwaInstallPrompt({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (!isMobileDevice() || isStandaloneMode() || recentlyDismissed()) return undefined;

    const isIos = isIosDevice();
    setIos(isIos);

    if (isIos) {
      const timer = window.setTimeout(() => setVisible(true), 900);
      return () => window.clearTimeout(timer);
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    }

    function handleInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setVisible(false);
  }

  return (
    <section className={`relative overflow-hidden rounded-2xl border border-blue-100 bg-white/92 p-4 shadow-lg shadow-blue-950/5 ${compact ? "mt-5" : "mb-4"}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(135deg,#1767ff,#22a8ff_70%,#5b6cff)]" />
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Ẩn gợi ý cài app">
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-7">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
          {ios ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-950">Cài BIZEN lên điện thoại</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {ios ? "Trên iPhone: bấm Chia sẻ, chọn Thêm vào Màn hình chính để mở BIZEN như app." : "Cài BIZEN để mở nhanh, full-screen và tiện chấm công/checklist hơn."}
          </p>
          {ios ? (
            <button type="button" onClick={dismiss} className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Đã hiểu
            </button>
          ) : (
            <button type="button" onClick={installApp} disabled={!deferredPrompt} className="brand-button btn-motion mt-3 rounded-xl px-3 py-2 text-xs font-bold disabled:bg-slate-300">
              Cài app
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
