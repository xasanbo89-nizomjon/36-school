import crypto from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

dotenv.config({ quiet: true });

const LOGIN_DOMAIN = (process.env.LOGIN_DOMAIN || "36-school.uz").toLowerCase();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://36-school.uz,https://www.36-school.uz,https://school-system-54307.web.app,https://school-system-54307.firebaseapp.com,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const ROLES = ["superadmin", "director", "deputy", "teacher", "student", "parent"];
const MANAGEMENT = ["superadmin", "director", "deputy"];
/* Kim qaysi rolni yarata / o'zgartira oladi */
const CAN_ASSIGN = {
  superadmin: ROLES,
  director: ["deputy", "teacher", "student", "parent"],
  deputy: ["teacher", "student", "parent"],
};

/* =========================
   FIREBASE ADMIN
   ========================= */

let adminAuth = null;
let adminDb = null;

function initAdmin() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const credential = raw ? cert(JSON.parse(raw)) : process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : null;
    if (!credential) {
      console.warn("⚠ FIREBASE_SERVICE_ACCOUNT berilmagan — foydalanuvchi boshqaruvi (/api/users) ishlamaydi.");
      return;
    }
    const app = initializeApp({ credential });
    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
  } catch (error) {
    console.error("Firebase Admin ishga tushmadi:", error.message);
  }
}
initAdmin();

/* =========================
   YORDAMCHILAR
   ========================= */

class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const str = (value, max = 120) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/* Lotin harflari, raqam, nuqta, chiziqcha: "ali.valiyev" */
function normalizeLogin(value) {
  return str(value, 60)
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.|\.$/g, "");
}

/* Chalkashtirmaydigan belgilar bilan oson parol: "kd7m-xa3p" */
function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((byte) => alphabet[byte % alphabet.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

function cleanProfile(body, actorRole, { partial = false } = {}) {
  const profile = {};

  if (!partial || "name" in body) {
    const name = str(body.name, 100);
    if (!name) throw new ApiError(400, "invalid");
    profile.name = name;
  }
  if (!partial || "role" in body) {
    const role = str(body.role, 20);
    if (!ROLES.includes(role)) throw new ApiError(400, "invalid");
    if (!CAN_ASSIGN[actorRole]?.includes(role)) throw new ApiError(403, "forbidden");
    profile.role = role;
  }
  if ("phone" in body) profile.phone = str(body.phone, 30);
  if ("classId" in body) profile.classId = str(body.classId, 60);
  if ("childIds" in body) {
    profile.childIds = Array.isArray(body.childIds) ? body.childIds.map((id) => str(id, 60)).filter(Boolean).slice(0, 10) : [];
  }

  // Rolga tegishli bo'lmagan maydonlar tozalanadi
  if (profile.role && profile.role !== "student") profile.classId = "";
  if (profile.role && profile.role !== "parent") profile.childIds = [];
  return profile;
}

async function createOne(body, actorRole, actorUid) {
  const profile = cleanProfile(body, actorRole);

  let email = str(body.email, 120).toLowerCase();
  const login = normalizeLogin(body.login);
  if (!email && login) email = `${login}@${LOGIN_DOMAIN}`;
  if (!isEmail(email)) throw new ApiError(400, "invalid");

  const password = typeof body.password === "string" && body.password.length >= 6 ? body.password.slice(0, 64) : generatePassword();

  let record;
  try {
    record = await adminAuth.createUser({ email, password, displayName: profile.name });
  } catch (error) {
    if (error.code === "auth/email-already-exists") throw new ApiError(409, "email-exists");
    if (error.code === "auth/invalid-email" || error.code === "auth/invalid-password") throw new ApiError(400, "invalid");
    throw error;
  }

  await adminDb.collection("users").doc(record.uid).set({
    ...profile,
    email,
    plan: "free",
    createdBy: actorUid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { uid: record.uid, email, password, name: profile.name, role: profile.role };
}

/* =========================
   EXPRESS
   ========================= */

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

/* CORS — faqat API uchun va faqat ruxsat etilgan manzillardan */
app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* Oddiy rate limit: foydalanuvchi (yoki IP) boshiga daqiqasiga 60 so'rov */
const hits = new Map();

/* Serverless'da setInterval ishlamaydi — eski yozuvlar rateLimit() boshida tozalanadi */
function sweepHits() {
  if (hits.size <= 5000) return;
  const now = Date.now();
  for (const [key, entry] of hits) if (now - entry.start > 60_000) hits.delete(key);
}

function rateLimit(key) {
  sweepHits();
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > 60_000) {
    hits.set(key, { start: now, count: 1 });
    return;
  }
  entry.count += 1;
  if (entry.count > 60) throw new ApiError(429, "rate-limited");
}

/* Token tekshiruvi + rolni Firestore'dan o'qish. Faqat ma'muriyat o'tadi. */
async function requireManager(req) {
  if (!adminAuth) throw new ApiError(503, "admin-not-configured");
  rateLimit(req.ip);

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new ApiError(401, "unauthenticated");

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token, true);
  } catch {
    throw new ApiError(401, "unauthenticated");
  }
  rateLimit(decoded.uid);

  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  const role = snap.exists ? snap.get("role") : null;
  if (!MANAGEMENT.includes(role)) throw new ApiError(403, "forbidden");
  return { uid: decoded.uid, role };
}

/* Boshqa foydalanuvchini o'zgartirishga ruxsat bormi (direktor superadminni o'zgartira olmaydi va h.k.) */
async function requireTarget(actor, uid) {
  const snap = await adminDb.collection("users").doc(uid).get();
  const targetRole = snap.exists ? snap.get("role") : null;
  if (targetRole && !CAN_ASSIGN[actor.role]?.includes(targetRole)) throw new ApiError(403, "forbidden");
  return snap;
}

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res));
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.code });
    console.error(error);
    res.status(500).json({ error: "generic" });
  }
};

/* Bitta foydalanuvchi yaratish */
app.post("/api/users", handle(async (req) => {
  const actor = await requireManager(req);
  return createOne(req.body ?? {}, actor.role, actor.uid);
}));

/* Ko'p foydalanuvchini birdan yaratish (masalan, sinf ro'yxati). Har biri alohida natija qaytaradi. */
app.post("/api/users/bulk", handle(async (req) => {
  const actor = await requireManager(req);
  const list = Array.isArray(req.body?.users) ? req.body.users.slice(0, 300) : [];
  if (list.length === 0) throw new ApiError(400, "invalid");

  const results = [];
  for (const item of list) {
    try {
      results.push({ ok: true, ...(await createOne(item ?? {}, actor.role, actor.uid)) });
    } catch (error) {
      results.push({ ok: false, name: str(item?.name, 100), login: str(item?.login, 60), error: error instanceof ApiError ? error.code : "generic" });
    }
  }
  return { results };
}));

/* Ma'lumotlarni o'zgartirish */
app.patch("/api/users/:uid", handle(async (req) => {
  const actor = await requireManager(req);
  const uid = str(req.params.uid, 128);
  const snap = await requireTarget(actor, uid);
  if (!snap.exists) throw new ApiError(404, "not-found");
  if (uid === actor.uid && "role" in (req.body ?? {})) throw new ApiError(400, "self");

  const profile = cleanProfile(req.body ?? {}, actor.role, { partial: true });
  await adminDb.collection("users").doc(uid).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  if (profile.name) await adminAuth.updateUser(uid, { displayName: profile.name }).catch(() => {});

  if (typeof req.body?.disabled === "boolean") {
    if (uid === actor.uid) throw new ApiError(400, "self");
    await adminAuth.updateUser(uid, { disabled: req.body.disabled });
    await adminDb.collection("users").doc(uid).set({ disabled: req.body.disabled }, { merge: true });
  }
  return { ok: true };
}));

/* Yangi parol berish (login bilan kiradigan o'quvchilar emailga xat ololmaydi) */
app.post("/api/users/:uid/password", handle(async (req) => {
  const actor = await requireManager(req);
  const uid = str(req.params.uid, 128);
  await requireTarget(actor, uid);
  const password = generatePassword();
  try {
    await adminAuth.updateUser(uid, { password });
  } catch (error) {
    if (error.code === "auth/user-not-found") throw new ApiError(404, "not-found");
    throw error;
  }
  await adminAuth.revokeRefreshTokens(uid);
  return { password };
}));

/* O'chirish (Auth hisobi va users hujjati) */
app.delete("/api/users/:uid", handle(async (req) => {
  const actor = await requireManager(req);
  const uid = str(req.params.uid, 128);
  if (uid === actor.uid) throw new ApiError(400, "self");
  await requireTarget(actor, uid);
  await adminAuth.deleteUser(uid).catch((error) => {
    if (error.code !== "auth/user-not-found") throw error;
  });
  await adminDb.collection("users").doc(uid).delete();
  return { ok: true };
}));

app.get("/api/health", (req, res) => res.json({ ok: true, admin: Boolean(adminAuth) }));

app.use("/api", (req, res) => res.status(404).json({ error: "not-found" }));

export default app;
