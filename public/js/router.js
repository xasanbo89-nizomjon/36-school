import { SECTIONS } from "./config.js";

let allowed = new Set();
let current = null;
const listeners = new Set();

/* Bo'lim ochilganda chaqiriladi (ma'lumotni kechiktirib yuklash uchun) */
export function onSectionChange(callback) {
  listeners.add(callback);
}

function sectionNode(id) {
  return document.getElementById(id);
}

function markActive() {
  document.querySelectorAll("[data-section]").forEach((node) => {
    const active = node.dataset.section === current;
    node.classList.toggle("active", active);
    if (active) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
}

/* Foydalanuvchi roliga ruxsat etilgan bo'limlar (qolganlariga o'tib bo'lmaydi) */
export function setAllowedSections(ids) {
  allowed = new Set(ids);
}

export function showSection(sectionId) {
  if (!allowed.has(sectionId)) return;
  for (const { id } of SECTIONS) sectionNode(id).hidden = id !== sectionId;
  current = sectionId;
  markActive();
  window.scrollTo({ top: 0 });
  listeners.forEach((callback) => callback(sectionId));
}

export function hideAllSections() {
  for (const { id } of SECTIONS) sectionNode(id).hidden = true;
  current = null;
  allowed = new Set();
  markActive();
}

/* data-section atributli elementlarga bosilganda bo'lim almashadi */
export function initRouter() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-section]");
    if (target) showSection(target.dataset.section);
  });
}
