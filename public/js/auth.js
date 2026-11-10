import { auth, db, doc, getDoc, onAuthStateChanged, signOut } from "./firebase.js";
import { ROLES, PERMISSIONS, UPGRADE_URL, DEMO_PROFILES } from "./config.js";
import { applyTranslations } from "./i18n.js";
import { byId } from "./ui.js";
import { closeProfileMenu } from "./layout.js";

const GUEST = "guest";
const SESSION_KEY = "36_school_auth_session";

let currentUser = null;
let currentRole = GUEST;
let authListenerCallbacks = { onSignedIn: null, onSignedOut: null };

export const getUser = () => currentUser;
export const getRole = () => currentRole;

/* UI uchun ruxsat tekshiruvi */
export function can(action) {
  return (PERMISSIONS[action] || []).includes(currentRole);
}

/* Local session'dan o'qish */
function getSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(userProfile) {
  try {
    if (userProfile) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}

function setI18nKey(node, key) {
  if (node) node.dataset.i18n = key;
}

export function renderProfile(user, { role, plan, name }) {
  const display = name || user?.email || "Foydalanuvchi";
  const nameNode = byId("welcomeUser");
  const emailNode = byId("profileEmail");
  if (nameNode) nameNode.textContent = display;
  if (emailNode) emailNode.textContent = user?.email || "";

  for (const id of ["profileAvatar", "profileAvatarLarge"]) {
    const el = byId(id);
    if (el) el.textContent = display.charAt(0).toUpperCase();
  }

  setI18nKey(byId("roleText"), `role.${role}`);
  setI18nKey(byId("roleBadge"), `role.${role}`);

  const planBadge = byId("planBadge");
  const upgradeBtn = byId("upgradeBtn");
  if (planBadge) {
    planBadge.classList.remove("badge-pro", "badge-free");
    planBadge.hidden = role === "superadmin";
    if (plan === "pro") {
      setI18nKey(planBadge, "plan.pro");
      planBadge.classList.add("badge-pro");
    } else {
      setI18nKey(planBadge, "plan.free");
      planBadge.classList.add("badge-free");
    }
  }

  if (upgradeBtn) {
    upgradeBtn.hidden = role === "superadmin" || plan === "pro";
  }

  applyTranslations(byId("app"));
}

/* Rol users/{uid} hujjatidan olinadi (hujjat ID = Firebase Auth uid) */
async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return { role: "director", plan: "pro", name: "" };
    const data = snap.data();
    return {
      role: ROLES.includes(data.role) ? data.role : "director",
      plan: data.plan === "pro" ? "pro" : "free",
      name: typeof data.name === "string" ? data.name.trim() : "",
    };
  } catch (error) {
    console.warn("Rolni Firebase'dan o'qib bo'lmadi, default rejimga o'tiladi:", error);
    return { role: "director", plan: "pro", name: "" };
  }
}

/* 1-klikli Tezkor Demo kirish */
export function loginAsDemo(roleKey) {
  const profile = DEMO_PROFILES[roleKey] || DEMO_PROFILES.director;
  currentUser = {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.name,
    phone: profile.phone,
    className: profile.className,
    isDemo: true,
  };
  currentRole = profile.role;

  saveSession({ user: currentUser, profile });

  byId("splash").hidden = true;
  byId("loginPage").hidden = true;
  byId("app").hidden = false;

  renderProfile(currentUser, profile);

  if (authListenerCallbacks.onSignedIn) {
    authListenerCallbacks.onSignedIn(currentUser, currentRole);
  }
}

/* Tizimdan chiqish */
export function signOutUser() {
  saveSession(null);
  currentUser = null;
  currentRole = GUEST;

  try {
    signOut(auth);
  } catch {
    /* ignore */
  }

  byId("loginPage").hidden = false;
  byId("app").hidden = true;

  if (authListenerCallbacks.onSignedOut) {
    authListenerCallbacks.onSignedOut();
  }
}

/* Profilni yangilash */
export function updateUserProfile(updates) {
  if (currentUser) {
    currentUser = { ...currentUser, ...updates };
    const session = getSavedSession() || {};
    const updatedProfile = { ...(session.profile || {}), ...updates, role: currentRole };
    saveSession({ user: currentUser, profile: updatedProfile });
    renderProfile(currentUser, updatedProfile);
  }
}

/* Autentifikatsiyani ishga tushirish */
export function initAuth({ onSignedIn, onSignedOut }) {
  authListenerCallbacks = { onSignedIn, onSignedOut };

  const splash = byId("splash");
  const loginPage = byId("loginPage");
  const appRoot = byId("app");

  byId("logoutBtn").addEventListener("click", () => {
    closeProfileMenu();
    signOutUser();
  });

  const upgradeBtn = byId("upgradeBtn");
  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", () => {
      window.open(UPGRADE_URL, "_blank", "noopener");
    });
  }

  // 1. Agar avval saqlangan demo/sessiya bo'lsa, uni darhol tiklaymiz
  const saved = getSavedSession();
  if (saved && saved.user && saved.profile) {
    currentUser = saved.user;
    currentRole = saved.profile.role || "director";
    splash.hidden = true;
    loginPage.hidden = true;
    appRoot.hidden = false;
    renderProfile(currentUser, saved.profile);
    onSignedIn(currentUser, currentRole);
    return;
  }

  // 2. Aks holda Firebase Auth tekshiriladi
  try {
    onAuthStateChanged(auth, async (user) => {
      splash.hidden = true;

      if (!user) {
        if (!currentUser) {
          currentUser = null;
          currentRole = GUEST;
          loginPage.hidden = false;
          appRoot.hidden = true;
          onSignedOut();
        }
        return;
      }

      currentUser = user;
      const profile = await fetchProfile(user.uid);
      currentRole = profile.role;

      saveSession({ user, profile });

      loginPage.hidden = true;
      appRoot.hidden = false;

      renderProfile(user, profile);
      onSignedIn(user, currentRole);
    });
  } catch (err) {
    console.warn("Firebase Auth ulanmadi, splash yashirilmoqda:", err);
    splash.hidden = true;
    loginPage.hidden = false;
  }
}
