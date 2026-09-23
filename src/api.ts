import { storage } from "@/src/utils/storage";

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

export const TOKEN_KEY = "mystudiolegale_token";

async function req<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  const headers: any = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${BASE}/api${path}`;
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return (await res.text()) as any;
}

async function upload<T = any>(path: string, form: FormData): Promise<T> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  const headers: any = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api${path}`, { method: "POST", body: form, headers });
  if (!res.ok) {
    let msg = `Errore ${res.status}`;
    try {
      const j = await res.json();
      msg = j.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  // `opts` e' opzionale e retrocompatibile: serve principalmente a passare
  // un AbortSignal (es. `{ signal }`) per annullare una ricerca superata da
  // una piu' recente, senza rompere le chiamate esistenti che non lo usano.
  get: <T = any>(p: string, opts?: RequestInit) => req<T>(p, opts),
  post: <T = any>(p: string, body?: any) => req<T>(p, { method: "POST", body: JSON.stringify(body || {}) }),
  put: <T = any>(p: string, body?: any) => req<T>(p, { method: "PUT", body: JSON.stringify(body || {}) }),
  patch: <T = any>(p: string, body?: any) => req<T>(p, { method: "PATCH", body: JSON.stringify(body || {}) }),
  del: <T = any>(p: string) => req<T>(p, { method: "DELETE" }),
  upload,
  base: BASE,
  async authHeader() {
    const token = await storage.secureGet<string>(TOKEN_KEY, "");
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
