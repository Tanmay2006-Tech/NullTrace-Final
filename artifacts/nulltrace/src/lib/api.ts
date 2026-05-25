const DEFAULT_API_BASE_URL =
  "https://workspaceapi-server-production-66d1.up.railway.app";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const API_URL = stripTrailingSlash(
  import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
);

export function apiPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (API_URL.endsWith("/api")) {
    return `${API_URL}${normalizedPath}`;
  }

  return `${API_URL}/api${normalizedPath}`;
}
