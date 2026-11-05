import { getToken } from "./session";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001/api";

export type ApiError = { message: string; fields?: Record<string, string>; status?: number };

/** Appel vers le backend SafeStay (JSON ou FormData). Le backend lit le token dans l'en-tête Authorization. */
export async function api<T = any>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method, credentials: "include", headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw { message: "Impossible de joindre le serveur. Vérifiez votre connexion." } as ApiError;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fields: Record<string, string> = {};
    (data.errors ?? []).forEach((e: any) => { fields[e.path ?? e.param] = e.msg; });
    throw { message: data.message ?? "Une erreur est survenue.", fields, status: res.status } as ApiError;
  }
  return data as T;
}

/** Téléchargement d'un fichier protégé (PDF) : renvoie un Blob. */
export async function apiBlob(path: string): Promise<Blob> {
  const token = typeof window !== "undefined" ? getToken() : null;
  const res = await fetch(`${BASE}${path}`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw { message: "Fichier introuvable ou accès refusé." } as ApiError;
  return res.blob();
}
