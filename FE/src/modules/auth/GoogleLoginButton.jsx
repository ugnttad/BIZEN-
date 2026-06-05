import { useEffect, useRef, useState } from "react";
import { Chrome } from "lucide-react";
import { apiClient } from "../api/client";

const defaultGoogleClientId = "518331039125-i79o5esjg5v5eiim93rdapvtfp0elk4n.apps.googleusercontent.com";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || defaultGoogleClientId;

let googleInitKey = null;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function buildGoogleLoginUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/google/redirect`;
  }
  return `${apiClient.baseUrl}/auth/google/redirect`;
}

function ensureGoogleInitialized(clientId, loginUri) {
  const initKey = `${clientId}:${loginUri}`;
  if (googleInitKey === initKey) return;
  window.google.accounts.id.initialize({
    client_id: clientId,
    ux_mode: "redirect",
    login_uri: loginUri,
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
    use_fedcm_for_prompt: true
  });
  googleInitKey = initKey;
}

export default function GoogleLoginButton({ mode = "web" }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");

    if (!googleClientId || googleClientId.includes("your-google")) {
      setError("Chưa cấu hình Google Client ID cho frontend.");
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return;

        const loginUri = buildGoogleLoginUri();
        ensureGoogleInitialized(googleClientId, loginUri);

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text: mode === "mobile" ? "signin_with" : "continue_with",
          shape: "rectangular",
          width: buttonRef.current.offsetWidth || 360
        });
      })
      .catch(() => setError("Không tải được Google Identity Services."));

    return () => {
      active = false;
    };
  }, [mode]);

  return (
    <div className="mt-3">
      <div ref={buttonRef} className="min-h-[44px] w-full" />
      {error ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <Chrome className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
      {!error && googleClientId && !googleClientId.includes("your-google") ? (
        <p className="mt-2 text-xs text-slate-500">
          Nếu Google báo lỗi: thêm domain app vào Authorized JavaScript origins và redirect/login URI trên Google Cloud Console.
        </p>
      ) : null}
    </div>
  );
}
