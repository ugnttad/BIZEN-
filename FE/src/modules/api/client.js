function resolveApiUrl() {
  const configuredUrl = normalizeApiUrl(import.meta.env.VITE_API_URL);

  if (typeof window === "undefined") {
    return configuredUrl || "/api";
  }

  const { protocol, hostname, origin } = window.location;
  const isLocalBrowser = isLocalLikeHost(hostname);

  if (configuredUrl && !(isLocalOnlyApiUrl(configuredUrl) && !isLocalBrowser)) {
    return configuredUrl;
  }

  if (isLocalBrowser) {
    return `${protocol}//${hostname}:4000/api`;
  }

  return `${origin}/api`;
}

const API_URL = resolveApiUrl();

function normalizeApiUrl(value) {
  return value ? value.trim().replace(/\/+$/, "") : "";
}

function isLocalLikeHost(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function isLocalOnlyApiUrl(value) {
  try {
    return isLocalLikeHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem("bizen_auth_token");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Cannot reach BIZEN API at ${API_URL}. Check backend deployment, API URL, and CORS. ${error.message}`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (payload.code === "DATABASE_NOT_CONFIGURED") {
      throw new Error("Backend chưa cấu hình DATABASE_URL trên Vercel. Thêm DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL rồi redeploy.");
    }
    throw new Error(payload.error || `API request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function requestBlob(path, options = {}) {
  const token = localStorage.getItem("bizen_auth_token");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Cannot reach BIZEN API at ${API_URL}. Check backend deployment, API URL, and CORS. ${error.message}`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (payload.code === "DATABASE_NOT_CONFIGURED") {
      throw new Error("Backend chưa cấu hình DATABASE_URL trên Vercel. Thêm DATABASE_URL/POSTGRES_URL/NEON_DATABASE_URL rồi redeploy.");
    }
    throw new Error(payload.error || `API request failed: ${response.status}`);
  }

  return response.blob();
}

export const apiClient = {
  baseUrl: API_URL,
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
  blob: (path) => requestBlob(path)
};
