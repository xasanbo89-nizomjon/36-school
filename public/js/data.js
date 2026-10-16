import { auth, db, doc, getDoc, listDocs, queryDocs, where } from "./firebase.js";
import { getProfile, getRole } from "./auth.js";
import { STAFF } from "./config.js";

/*
 Umumiy ma'lumot keshi: foydalanuvchilar, sinflar, fanlar.
 Barcha modullar shu yerdan o'qiydi — bir xil ma'lumot qayta-qayta yuklanmaydi.
*/
export const store = {
  users: [],
  classes: [],
  subjects: [],
  usersOk: false,
  classesOk: false,
  subjectsOk: false,
};

const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { numeric: true });

export async function loadUsers() {
  const role = getRole();
  try {
    if (STAFF.includes(role)) {
      store.users = await listDocs("users");
    } else {
      // O'quvchi — o'zini, ota-ona — o'zini va farzandlarini ko'radi
      const ids = [auth.currentUser.uid, ...(getProfile()?.childIds ?? [])];
      const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id)).catch(() => null)));
      store.users = snaps.filter((snap) => snap?.exists()).map((snap) => ({ id: snap.id, ...snap.data() }));
    }
    store.users.sort(byName);
    store.usersOk = true;
  } catch (error) {
    console.error("Foydalanuvchilarni yuklab bo'lmadi:", error);
    store.users = [];
    store.usersOk = false;
  }
}

export async function loadClasses() {
  try {
    store.classes = (await listDocs("classes")).sort(byName);
    store.classesOk = true;
  } catch (error) {
    console.error("Sinflarni yuklab bo'lmadi:", error);
    store.classes = [];
    store.classesOk = false;
  }
}

export async function loadSubjects() {
  try {
    store.subjects = (await listDocs("subjects")).sort(byName);
    store.subjectsOk = true;
  } catch (error) {
    console.error("Fanlarni yuklab bo'lmadi:", error);
    store.subjects = [];
    store.subjectsOk = false;
  }
}

export function loadCore() {
  return Promise.all([loadUsers(), loadClasses(), loadSubjects()]);
}

export function resetStore() {
  Object.assign(store, { users: [], classes: [], subjects: [], usersOk: false, classesOk: false, subjectsOk: false });
}

/* ---------- Yordamchilar ---------- */

export const userById = (id) => store.users.find((user) => user.id === id) ?? null;
export const classById = (id) => store.classes.find((item) => item.id === id) ?? null;
export const subjectById = (id) => store.subjects.find((item) => item.id === id) ?? null;

export const displayName = (user) => (user?.name || user?.email || "—").trim();
export const className = (id) => classById(id)?.name ?? "—";
export const subjectName = (id) => subjectById(id)?.name ?? "—";

export const usersByRole = (...roles) => store.users.filter((user) => roles.includes(user.role));
export const studentsOf = (classId) =>
  store.users.filter((user) => user.role === "student" && user.classId === classId);
export const teachers = () => usersByRole("teacher", "deputy", "director");

/* O'quvchi uchun — o'zi, ota-ona uchun — farzandlari */
export function familyStudents() {
  const profile = getProfile();
  if (getRole() === "student") return [{ id: auth.currentUser.uid, ...profile, ...(userById(auth.currentUser.uid) ?? {}) }];
  if (getRole() === "parent") return (profile?.childIds ?? []).map((id) => userById(id)).filter(Boolean);
  return [];
}

/* Foydalanuvchi o'qishi mumkin bo'lgan sinflar ro'yxati (jadval, vazifalar uchun) */
export function visibleClassIds() {
  if (STAFF.includes(getRole())) return store.classes.map((item) => item.id);
  return [...new Set(familyStudents().map((student) => student.classId).filter(Boolean))];
}

/* ---------- Sana ---------- */

const pad = (n) => String(n).padStart(2, "0");

/* Mahalliy sana "YYYY-MM-DD" (UTC emas — Toshkent vaqti bilan to'g'ri ishlaydi) */
export function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIso(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/* Hafta dushanbasi */
export function weekStart(date = new Date()) {
  const day = (date.getDay() + 6) % 7; // Dushanba = 0
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -day);
}

/* JS getDay() -> 1..7 (Dushanba = 1) */
export const weekdayOf = (date) => ((date.getDay() + 6) % 7) + 1;

export { where, queryDocs };
