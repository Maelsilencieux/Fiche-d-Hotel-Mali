export type SessionUser = { _id: string; role: "client" | "hotel" | "superadmin"; email: string; nom?: string; prenom?: string; nomHotel?: string; rccm?: string; villeHotel?: string };

const KEY_T = "ss_token", KEY_U = "ss_user";

/** "Se souvenir de moi" → localStorage, sinon sessionStorage. */
export function saveSession(token: string, user: SessionUser, remember: boolean) {
  const s = remember ? localStorage : sessionStorage;
  s.setItem(KEY_T, token); s.setItem(KEY_U, JSON.stringify(user));
}
export function getToken() { return localStorage.getItem(KEY_T) ?? sessionStorage.getItem(KEY_T); }
export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(KEY_U) ?? sessionStorage.getItem(KEY_U);
  return raw ? JSON.parse(raw) : null;
}
export function clearSession() { [localStorage, sessionStorage].forEach((s) => { s.removeItem(KEY_T); s.removeItem(KEY_U); }); }

/** Page d'accueil de chaque espace (à créer au fil des designs). */
export const homeFor = (role: SessionUser["role"]) => ({ client: "/client", hotel: "/hotel", superadmin: "/admin" }[role]);
