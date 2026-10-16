import { HOME_SECTION } from "./config.js";
import { applyTranslations, getLanguage, onLanguageChange, setLanguage } from "./i18n.js";
import { initTheme, onThemeChange } from "./theme.js";
import { initAuth, can } from "./auth.js";
import { initLogin, resetLoginForm } from "./login.js";
import { initLayout, renderNav } from "./layout.js";
import { initRouter, setAllowedSections, showSection, hideAllSections, onSectionChange } from "./router.js";
import { byId, setI18n, onDataChanged } from "./ui.js";
import { loadCore, resetStore } from "./data.js";
import { initUsers, renderUsers, showUsersLoading, resetUsers } from "./modules/users.js";
import { initClasses, renderClassesSection, showClassesLoading, resetClasses } from "./modules/classes.js";
import { initSubjects, renderSubjects, resetSubjects } from "./modules/subjects.js";
import { loadSchedule, resetSchedule } from "./modules/schedule.js";
import { initJournal, loadJournal, resetJournal } from "./modules/journal.js";
import { loadDiary, resetDiary } from "./modules/diary.js";
import { initHomework, loadHomework, resetHomework } from "./modules/homework.js";
import { initGallery, loadGallery, resetGallery } from "./modules/gallery.js";
import { loadDashboard, renderDashboard, resetDashboard } from "./modules/dashboard.js";

/* Qo'shish tugmalari: faqat ruxsati bor rolga ko'rinadi */
const ADD_BUTTONS = {
  addUserBtn: "users:manage",
  bulkUserBtn: "users:manage",
  addClassBtn: "classes:write",
  addSubjectBtn: "subjects:write",
  addHomeworkBtn: "homework:write",
  addGalleryBtn: "gallery:write",
};

function applyPermissions() {
  for (const [id, action] of Object.entries(ADD_BUTTONS)) {
    byId(id).hidden = !can(action);
  }
}

/*
 Har bir bo'lim birinchi marta ochilganda yuklanadi (lazy) — ortiqcha so'rov yo'q.
 Ma'lumot o'zgarganda (masalan, jurnal saqlandi) "eskirgan" deb belgilanadi va keyingi ochilishda yangilanadi.
*/
const LOADERS = {
  dashboardSection: loadDashboard,
  journalSection: loadJournal,
  diarySection: loadDiary,
  scheduleSection: loadSchedule,
  homeworkSection: loadHomework,
  classesSection: async () => renderClassesSection(),
  usersSection: async () => renderUsers(),
  subjectsSection: async () => renderSubjects(),
  gallerySection: loadGallery,
};

let loaded = new Set();
let ready = Promise.resolve();
let activeSection = null;

async function openSection(id) {
  activeSection = id;
  await ready;
  if (loaded.has(id) || !LOADERS[id]) return;
  loaded.add(id);
  try {
    await LOADERS[id]();
  } catch (error) {
    console.error(`${id} yuklanmadi:`, error);
    loaded.delete(id);
  }
}

/* Ma'lumot o'zgardi: joriy bo'limdan boshqalari keyingi ochilishda qayta yuklanadi */
onDataChanged(() => {
  loaded = new Set([activeSection]);
});

function onSignedIn(user, role) {
  const isGuest = role === "guest";

  byId("guestNotice").hidden = !isGuest;
  applyPermissions();

  const allowed = renderNav(role); // rolga ruxsat etilmagan bandlar menyuda umuman chiqmaydi
  setAllowedSections(allowed);
  loaded = new Set();

  if (isGuest) {
    hideAllSections(); // rolsiz foydalanuvchiga hech narsa ko'rsatilmaydi va yuklanmaydi
    return;
  }

  showUsersLoading();
  showClassesLoading();
  ready = loadCore(); // foydalanuvchilar, sinflar, fanlar — barcha bo'limlar uchun umumiy
  showSection(HOME_SECTION[role] ?? allowed[0]);
}

function onSignedOut() {
  ready = Promise.resolve();
  loaded = new Set();
  activeSection = null;
  resetStore();
  resetUsers();
  resetClasses();
  resetSubjects();
  resetSchedule();
  resetJournal();
  resetDiary();
  resetHomework();
  resetGallery();
  resetDashboard();
  resetLoginForm();
  hideAllSections();
  byId("toastRoot")?.replaceChildren(); // oldingi foydalanuvchining xabarlari keyingisiga ko'rinmasin
  byId("guestNotice").hidden = true;
}

/* Til tanlagichlar (login sahifasida ham, ilovada ham) o'zaro sinxron */
function initLanguage() {
  const selects = document.querySelectorAll(".js-lang-select");
  selects.forEach((select) => {
    select.value = getLanguage();
    select.addEventListener("change", () => setLanguage(select.value));
  });
  onLanguageChange((lang) => {
    selects.forEach((select) => (select.value = lang));
    renderDashboard(); // grafik va sanalar ham tarjima bo'lishi uchun
    // Dinamik matnli bo'limlar keyingi ochilishda yangi tilda chiziladi
    loaded = new Set(activeSection === "dashboardSection" ? [activeSection] : []);
    if (activeSection && activeSection !== "dashboardSection") openSection(activeSection);
  });
  applyTranslations();
}

initLanguage();
initTheme();
onThemeChange(renderDashboard); // grafik ranglari temaga mos qayta chiziladi
initLayout();
initRouter();
onSectionChange(openSection);
initLogin();
initUsers();
initClasses();
initSubjects();
initJournal();
initHomework();
initGallery();
initAuth({ onSignedIn, onSignedOut });
