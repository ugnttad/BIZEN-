import { useEffect, useRef, useState } from "react";
import { Chrome } from "lucide-react";
import { bizenApi } from "../api/bizenApi";
import { saveAuthSession } from "./authStore";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let googleInitClientId = null;
let credentialHandler = null;

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

function ensureGoogleInitialized(clientId) {
  if (googleInitClientId === clientId) return;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => credentialHandler?.(response)
  });
  googleInitClientId = clientId;
}

export default function GoogleLoginButton({ mode = "web", onSuccess }) {
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const [error, setError] = useState("");

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    let active = true;
    setError("");

    if (!googleClientId || googleClientId.includes("your-google")) {
      setError("Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong FE/.env (copy từ FE/.env.example).");
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return;

        credentialHandler = async (response) => {
          try {
            const session = await bizenApi.googleLogin(response.credential);
            saveAuthSession(session);
            onSuccessRef.current?.(session.user);
          } catch (err) {
            setError(err.message || "Không đăng nhập được bằng Google.");
          }
        };
        ensureGoogleInitialized(googleClientId);

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
          Nếu nút Google báo lỗi: thêm <span className="font-semibold">http://localhost:5173</span> vào Authorized JavaScript origins trên Google Cloud Console.
        </p>
      ) : null}
    </div>
  );
}
