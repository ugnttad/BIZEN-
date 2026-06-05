import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { bizenApi } from "../modules/api/bizenApi";
import { getDefaultPathForRole, saveAuthSession, setEmployeeExperiencePreference } from "../modules/auth/authStore";
import { saveMobileEmployee } from "../modules/auth/mobileSession";

function decodeBase64UrlJson(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${normalized}${"=".repeat((4 - (normalized.length % 4)) % 4)}`;
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function finish() {
      try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const token = params.get("token");
        const userPayload = params.get("user");
        const experience = params.get("experience") === "mobile" ? "mobile" : "web";
        const next = params.get("next");

        if (!token || !userPayload) {
          throw new Error("Google login callback is missing session data.");
        }

        const user = decodeBase64UrlJson(userPayload);
        saveAuthSession({ token, user });

        if (user.role === "Employee" && user.employeeId) {
          setEmployeeExperiencePreference(experience);
          try {
            const employee = await bizenApi.employee(user.employeeId);
            saveMobileEmployee(employee);
          } catch {
            // The protected portal can still fetch the employee profile later.
          }
        }

        if (!active) return;
        const fallback = user.role === "Employee" ? (experience === "mobile" ? "/mobile/home" : "/web/me") : getDefaultPathForRole(user.role);
        navigate(next || fallback, { replace: true });
      } catch (err) {
        if (active) setError(err.message || "Khong hoan tat duoc dang nhap Google.");
      }
    }

    finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        {error ? (
          <>
            <p className="text-base font-semibold text-rose-700">Google login failed</p>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Dang hoan tat dang nhap Google...</p>
          </>
        )}
      </section>
    </main>
  );
}
