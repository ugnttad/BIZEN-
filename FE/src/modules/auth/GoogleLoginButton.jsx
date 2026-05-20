import { useEffect, useRef, useState } from "react";
import { Chrome } from "lucide-react";
import { bizenApi } from "../api/bizenApi";
import { saveAuthSession } from "./authStore";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

export default function GoogleLoginButton({ mode = "web", onSuccess }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");

    if (!googleClientId || googleClientId.includes("your-google")) {
      setError("Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong FE/.env.");
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const session = await bizenApi.googleLogin(response.credential);
              saveAuthSession(session);
              onSuccess?.(session.user);
            } catch (err) {
              setError(err.message || "Không đăng nhập được bằng Google.");
            }
          }
        });

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
  }, [mode, onSuccess]);

  return (
    <div className="mt-3">
      <div ref={buttonRef} className="min-h-[44px] w-full" />
      {error ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          <Chrome className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
