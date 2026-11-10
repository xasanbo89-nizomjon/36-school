import { HOME_SECTION } from "./config.js";
import { applyTranslations, getLanguage, onLanguageChange, setLanguage } from "./i18n.js";
import { initTheme, onThemeChange } from "./theme.js";
import { initAuth, can } from "./auth.js";
import { initLogin, resetLoginForm } from "./login.js";
import { initLayout, renderNav } from "./layout.js";
import { initRouter, setAllowedSections, showSection, hideAllSections } from "./router.js";
import { byId, setI18n } from "./ui.js";

// Modullar
import { initClasses, loadClasses, resetClasses } from "./modules/classes.js";
import { initAttendance, loadAttendance, resetAttendance } from "./modules/attendance.js";
import { initSchedule, loadSchedule, resetSchedule } from "./modules/schedule.js";
import { initGrades, loadGrades, resetGrades } from "./modules/grades.js";
import { initHomework, loadHomework, resetHomework } from "./modules/homework.js";
import { initTeachers, loadTeachers, resetTeachers } from "./modules/teachers.js";
import { initAnnouncements, loadAnnouncements, resetAnnouncements } from "./modules/announcements.js";
import { initGallery, loadGallery, resetGallery } from "./modules/gallery.js";
import { initDashboard, loadDashboard, renderDashboard, resetDashboard, showDashboardLoading } from "./modules/dashboard.js";
import { initSettings, loadSettings, resetSettings } from "./modules/settings.js";
import { initNotifications } from "./modules/notifications.js";

const ADD_BUTTONS = {
  addClassBtn: "classes:write",
  addHomeworkBtn: "homework:write",
  addGalleryBtn: "gallery:write",
  addTeacherBtn: "teachers:write",
  addAnnouncementBtn: "announcements:write",
  addLessonBtn: "schedule:write",
};

function applyPermissions() {
  for (const [id, action] of Object.entries(ADD_BUTTONS)) {
    const btn = byId(id);
    if (btn) btn.hidden = !can(action);
  }
}

async function loadAll(allowed) {
  const has = (id) => allowed.includes(id);

  if (has("dashboardSection")) showDashboardLoading();

  await Promise.all([
    has("classesSection") ? loadClasses() : null,
    has("attendanceSection") ? loadAttendance() : null,
    has("scheduleSection") ? loadSchedule() : null,
    has("gradesSection") ? loadGrades() : null,
    has("homeworkSection") ? loadHomework() : null,
    has("teachersSection") ? loadTeachers() : null,
    has("announcementsSection") ? loadAnnouncements() : null,
    has("gallerySection") ? loadGallery() : null,
    has("settingsSection") ? loadSettings() : null,
  ]);

  if (has("dashboardSection")) await loadDashboard();
}

function onSignedIn(user, role) {
  const isGuest = role === "guest";

  const dashTitle = byId("dashboardTitle");
  if (dashTitle) setI18n(dashTitle, `dash.title.${role}`);

  const guestNotice = byId("guestNotice");
  if (guestNotice) guestNotice.hidden = !isGuest;

  applyPermissions();

  const allowed = renderNav(role);
  setAllowedSections(allowed);

  if (isGuest) {
    hideAllSections();
    return;
  }

  const startSection = HOME_SECTION[role] || "dashboardSection";
  showSection(startSection);
  loadAll(allowed);
}

function onSignedOut() {
  resetClasses();
  resetAttendance();
  resetSchedule();
  resetGrades();
  resetHomework();
  resetTeachers();
  resetAnnouncements();
  resetGallery();
  resetDashboard();
  resetSettings();
  resetLoginForm();
  hideAllSections();

  const guestNotice = byId("guestNotice");
  if (guestNotice) guestNotice.hidden = true;
}

function initLanguage() {
  const selects = document.querySelectorAll(".js-lang-select");
  selects.forEach((select) => {
    select.value = getLanguage();
    select.addEventListener("change", () => setLanguage(select.value));
  });
  onLanguageChange((lang) => {
    selects.forEach((select) => (select.value = lang));
    renderDashboard();
  });
  applyTranslations();
}

// Boshlang'ich sozlashlar
initLanguage();
initTheme();
onThemeChange(renderDashboard);
initLayout();
initRouter();
initNotifications();

initClasses();
initAttendance();
initSchedule();
initGrades();
initHomework();
initTeachers();
initAnnouncements();
initGallery();
initDashboard();
initSettings();

initLogin();
initAuth({ onSignedIn, onSignedOut });
