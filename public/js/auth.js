import { auth, db, doc, getDoc, onAuthStateChanged, signOut } from "./firebase.js";
import { ROLES, PERMISSIONS, UPGRADE_URL } from "./config.js";
import { applyTranslations } from "./i18n.js";
import { byId } from "./ui.js";
import { closeProfileMenu } from "./layout.js";

const GUEST = "guest";

let currentUser = null;
let currentRole = GUEST;
let currentProfile = null;

export const getUser = () => currentUser;
export const getRole = () => currentRole;
/* { role, plan, name, classId, childIds } */
export const getProfile = () => currentProfile;

/* UI uchun ruxsat tekshiruvi. Haqiqiy himoya firestore.rules da. */
export function can(action) {
  return (PERMISSIONS[action] || []).includes(currentRole);
}

/*
 Rol users/{uid} hujjatidan olinadi (hujjat ID = Firebase Auth uid).
 Hujjat yo'q, o'qib bo'lmadi yoki rol noma'lum bo'lsa — "guest".
*/
function emptyProfile() {
  return { role: GUEST, plan: "free", name: "", classId: "", childIds: [] };
}

async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return emptyProfile();
    const data = snap.data();
    return {
      role: ROLES.includes(data.role) ? data.role : GUEST,
      plan: data.plan === "pro" ? "pro" : "free",
      name: typeof data.name === "string" ? data.name.trim() : "",
      classId: typeof data.classId === "string" ? data.classId : "",
      childIds: Array.isArray(data.childIds) ? data.childIds.filter((id) => typeof id === "string") : [],
    };
  } catch (error) {
    console.error("Rolni o'qib bo'lmadi:", error);
    return emptyProfile();
  }
}

function setI18nKey(node, key) {
  node.dataset.i18n = key;
}

function renderProfile(user, { role, plan, name }) {
  const display = name || user.email || "?";
  byId("welcomeUser").textContent = display;
  byId("profileEmail").textContent = user.email || "";
  for (const id of ["profileAvatar", "profileAvatarLarge"]) {
    byId(id).textContent = display.charAt(0).toUpperCase();
  }

  setI18nKey(byId("roleText"), `role.${role}`);
  setI18nKey(byId("roleBadge"), `role.${role}`);

  const planBadge = byId("planBadge");
  const upgradeBtn = byId("upgradeBtn");
  planBadge.classList.remove("badge-pro", "badge-free");

  // Superadmin uchun plan ko'rsatilmaydi; PRO da Upgrade tugmasi yo'q
  planBadge.hidden = role === "superadmin";
  upgradeBtn.hidden = role === "superadmin" || plan === "pro";
  if (plan === "pro") {
    setI18nKey(planBadge, "plan.pro");
    planBadge.classList.add("badge-pro");
  } else {
    setI18nKey(planBadge, "plan.free");
    planBadge.classList.add("badge-free");
  }

  applyTranslations(byId("app"));
}

/*
 onSignedIn(user, role) — kirgandan keyin; onSignedOut() — chiqqandan keyin.
*/
export function initAuth({ onSignedIn, onSignedOut }) {
  const splash = byId("splash");
  const loginPage = byId("loginPage");
  const appRoot = byId("app");

  byId("logoutBtn").addEventListener("click", () => {
    closeProfileMenu();
    signOut(auth);
  });

  byId("upgradeBtn").addEventListener("click", () => {
    window.open(UPGRADE_URL, "_blank", "noopener");
  });

  onAuthStateChanged(auth, async (user) => {
    splash.hidden = true;

    if (!user) {
      currentUser = null;
      currentRole = GUEST;
      currentProfile = null;
      loginPage.hidden = false;
      appRoot.hidden = true;
      onSignedOut();
      return;
    }

    const profile = await fetchProfile(user.uid);
    currentUser = user;
    currentRole = profile.role;
    currentProfile = profile;

    loginPage.hidden = true;
    appRoot.hidden = false;
    renderProfile(user, profile);
    onSignedIn(user, profile.role);
  });
}
