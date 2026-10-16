import { auth } from "./firebase.js";
import { API_BASE } from "./config.js";

const KNOWN_ERRORS = [
  "unauthenticated",
  "forbidden",
  "invalid",
  "email-exists",
  "not-found",
  "admin-not-configured",
  "rate-limited",
  "self",
];

/*
 Server API (server.js) chaqiruvi. Firebase ID token har doim yuboriladi —
 server uni tekshiradi va rolni Firestore'dan o'zi o'qiydi.
*/
export async function api(path, { method = "GET", body } = {}) {
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error("not-signed-in"), { i18nKey: "api.error.auth" });

  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("network"), { i18nKey: "auth.error.network" });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    /* bo'sh javob */
  }

  if (!response.ok) {
    const code = data?.error || `http-${response.status}`;
    const key = KNOWN_ERRORS.includes(code) ? code : "generic";
    throw Object.assign(new Error(code), { code, i18nKey: `api.error.${key}` });
  }
  return data;
}
