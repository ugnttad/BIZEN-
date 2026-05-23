function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (typeof window === "undefined") {
    return configuredUrl || "http://localhost:4000/api";
  }

  const { protocol, hostname } = window.location;
  const isLanHost = hostname.startsWith("192.168.") || hostname.startsWith("10.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

  if (isLanHost) {
    return `${protocol}//${hostname}:4000/api`;
  }

  return configuredUrl || "http://localhost:4000/api";
}

const API_URL = resolveApiUrl();

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
    throw new Error(`Cannot reach BIZEN API at ${API_URL}. Check backend port 4000 and CORS. ${error.message}`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
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
    throw new Error(`Cannot reach BIZEN API at ${API_URL}. Check backend port 4000 and CORS. ${error.message}`);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
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
