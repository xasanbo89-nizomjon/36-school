import { SECTIONS } from "./config.js";
import { applyTranslations } from "./i18n.js";
import { byId, el, clear, icon } from "./ui.js";

const SIDEBAR_KEY = "sidebar";

/* ---------- Menyu (rolga qarab) ---------- */

function navButton(section) {
  return el(
    "button",
    {
      class: "nav-link",
      title: section.labelKey,
      attrs: { type: "button", "data-section": section.id },
    },
    icon(section.icon),
    el("span", { class: "nav-label", i18n: section.labelKey })
  );
}

/* Roliga ruxsat etilmagan bandlar umuman yaratilmaydi. Ruxsat etilgan band id'lari qaytariladi. */
export function renderNav(role) {
  const visible = SECTIONS.filter((section) => section.roles.includes(role));

  const sidebarNav = byId("sidebarNav");
  const bottomNav = byId("bottomNav");
  clear(sidebarNav);
  clear(bottomNav);

  for (const section of visible) {
    sidebarNav.append(navButton(section));
    bottomNav.append(navButton(section));
  }

  byId("app").classList.toggle("no-nav", visible.length === 0);
  applyTranslations(byId("app"));
  return visible.map((section) => section.id);
}

/* ---------- Sidebar yig'ish ---------- */

function setCollapsed(collapsed) {
  const app = byId("app");
  app.classList.toggle("sidebar-collapsed", collapsed);
  const toggle = byId("sidebarToggle");
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.dataset.i18nTitle = collapsed ? "nav.expand" : "nav.collapse";
  applyTranslations(toggle.parentElement);
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    /* saqlab bo'lmasa ham ishlaydi */
  }
}

/* ---------- Profil dropdown ---------- */

function initProfileMenu() {
  const button = byId("profileBtn");
  const menu = byId("profileMenu");

  const setOpen = (open) => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !menu.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setOpen(false);
      button.focus();
    }
  });
}

export function closeProfileMenu() {
  byId("profileMenu").hidden = true;
  byId("profileBtn").setAttribute("aria-expanded", "false");
}

export function initLayout() {
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    /* default: ochiq */
  }
  setCollapsed(collapsed);

  byId("sidebarToggle").addEventListener("click", () => {
    setCollapsed(!byId("app").classList.contains("sidebar-collapsed"));
  });

  initProfileMenu();
}
