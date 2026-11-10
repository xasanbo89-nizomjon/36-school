/* Firebase SDK versiyasi shu yerda — butun loyiha bo'yicha yagona joy. */
export const FIREBASE_VERSION = "10.12.2";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgFF76kpKMUbpqCJ1cq71WELVHZ5dS_Rk",
  authDomain: "school-system-54307.firebaseapp.com",
  projectId: "school-system-54307",
  storageBucket: "school-system-54307.appspot.com",
  messagingSenderId: "646293166289",
  appId: "1:646293166289:web:de21d597a098e89ef34df0",
};

export const ROLES = ["superadmin", "director", "deputy", "teacher", "student", "parent"];

export const PERMISSIONS = {
  "classes:write": ["superadmin", "director"],
  "classes:read": ["superadmin", "director", "deputy", "teacher"],
  "attendance:write": ["superadmin", "director", "deputy", "teacher"],
  "grades:write": ["superadmin", "director", "teacher"],
  "schedule:write": ["superadmin", "director", "deputy"],
  "homework:write": ["superadmin", "deputy", "teacher"],
  "homework:deleteAny": ["superadmin", "director", "deputy"],
  "teachers:write": ["superadmin", "director"],
  "announcements:write": ["superadmin", "director", "deputy"],
  "gallery:write": ["superadmin", "director"],
  "settings:write": ["superadmin", "director"],
};

/* Menyu bandlari: rolga qarab ko'rinadi */
export const SECTIONS = [
  { id: "dashboardSection", icon: "dashboard", labelKey: "nav.dashboard", roles: ROLES },
  { id: "classesSection", icon: "classes", labelKey: "nav.classes", roles: ["superadmin", "director", "deputy", "teacher"] },
  { id: "attendanceSection", icon: "attendance", labelKey: "nav.attendance", roles: ROLES },
  { id: "scheduleSection", icon: "schedule", labelKey: "nav.schedule", roles: ROLES },
  { id: "gradesSection", icon: "grades", labelKey: "nav.grades", roles: ROLES },
  { id: "homeworkSection", icon: "homework", labelKey: "nav.homework", roles: ROLES },
  { id: "teachersSection", icon: "teachers", labelKey: "nav.teachers", roles: ROLES },
  { id: "announcementsSection", icon: "announcements", labelKey: "nav.announcements", roles: ROLES },
  { id: "gallerySection", icon: "gallery", labelKey: "nav.gallery", roles: ROLES },
  { id: "settingsSection", icon: "settings", labelKey: "nav.settings", roles: ROLES },
];

/* Rol kirgandan keyin ochiladigan birinchi bo'lim */
export const HOME_SECTION = {
  superadmin: "dashboardSection",
  director: "dashboardSection",
  deputy: "dashboardSection",
  teacher: "dashboardSection",
  student: "dashboardSection",
  parent: "dashboardSection",
};

export const UPGRADE_URL = "https://t.me/Sherzodjanovich_7";

/* Tezkor Demo foydalanuvchilar (1-klikda kirish uchun) */
export const DEMO_PROFILES = {
  director: {
    uid: "demo-director-uid",
    email: "direktor@36maktab.uz",
    name: "Sherzod Aliyev",
    role: "director",
    plan: "pro",
    phone: "+998 71 278-36-36",
    className: null,
  },
  teacher: {
    uid: "demo-teacher-uid",
    email: "muallim@36maktab.uz",
    name: "Zilola Karimova",
    role: "teacher",
    plan: "pro",
    phone: "+998 90 111-22-33",
    className: "9-A",
  },
  student: {
    uid: "demo-student-uid",
    email: "oquvchi@36maktab.uz",
    name: "Javohir Rustamov",
    role: "student",
    plan: "free",
    phone: "+998 90 123-45-67",
    className: "9-A",
  },
  parent: {
    uid: "demo-parent-uid",
    email: "otaona@36maktab.uz",
    name: "Dilshod Rustamov",
    role: "parent",
    plan: "free",
    phone: "+998 90 123-45-67",
    className: "9-A",
    childName: "Javohir Rustamov",
  },
  superadmin: {
    uid: "demo-admin-uid",
    email: "admin@36maktab.uz",
    name: "Administrator",
    role: "superadmin",
    plan: "pro",
    phone: "+998 90 999-00-11",
    className: null,
  },
};
