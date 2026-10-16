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

/*
 Server API manzili. Sayt Firebase Hosting'da (36-school.uz), API Vercel'da turadi.
 Lokal (localhost) da sayt va API bitta serverdan beriladi — bo'sh.
*/
export const API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname) ? "" : "https://36-school.vercel.app";

/*
 Emaili yo'q o'quvchilar "login" bilan kiradi: "ali.valiyev" -> "ali.valiyev@36-school.uz".
 Server .env dagi LOGIN_DOMAIN bilan bir xil bo'lishi shart.
*/
export const LOGIN_DOMAIN = "36-school.uz";

export const ROLES = ["superadmin", "director", "deputy", "teacher", "student", "parent"];
export const MANAGEMENT = ["superadmin", "director", "deputy"];
export const STAFF = [...MANAGEMENT, "teacher"];
export const FAMILY = ["student", "parent"];

/* Rol -> ruxsatlar. Bu faqat UI uchun; haqiqiy himoya firestore.rules va server.js da. */
export const PERMISSIONS = {
  "users:manage": MANAGEMENT,
  "users:manageStaff": ["superadmin", "director"],
  "classes:write": MANAGEMENT,
  "subjects:write": MANAGEMENT,
  "schedule:write": MANAGEMENT,
  "journal:write": STAFF,
  "homework:write": STAFF,
  "homework:deleteAny": MANAGEMENT,
  "gallery:write": ["superadmin", "director"],
};

/* Menyu bandlari: foydalanuvchi roli `roles` ichida bo'lmasa band umuman ko'rinmaydi */
export const SECTIONS = [
  { id: "dashboardSection", icon: "dashboard", labelKey: "nav.dashboard", roles: ROLES },
  { id: "journalSection", icon: "journal", labelKey: "nav.journal", roles: STAFF },
  { id: "diarySection", icon: "diary", labelKey: "nav.diary", roles: FAMILY },
  { id: "scheduleSection", icon: "calendar", labelKey: "nav.schedule", roles: ROLES },
  { id: "homeworkSection", icon: "homework", labelKey: "nav.homework", roles: ROLES },
  { id: "classesSection", icon: "classes", labelKey: "nav.classes", roles: STAFF },
  { id: "usersSection", icon: "users", labelKey: "nav.users", roles: MANAGEMENT },
  { id: "subjectsSection", icon: "book", labelKey: "nav.subjects", roles: MANAGEMENT },
  { id: "gallerySection", icon: "gallery", labelKey: "nav.gallery", roles: ROLES },
];

/* Rol kirgandan keyin ochiladigan birinchi bo'lim */
export const HOME_SECTION = {
  superadmin: "dashboardSection",
  director: "dashboardSection",
  deputy: "dashboardSection",
  teacher: "journalSection",
  student: "dashboardSection",
  parent: "dashboardSection",
};

/* Maktab vaqti */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6]; // Dushanba..Shanba
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
export const GRADES = [5, 4, 3, 2];
export const ATTENDANCE_STATUSES = ["present", "late", "excused", "absent"];
export const GRADE_TYPES = ["daily", "test", "exam"];

export const UPGRADE_URL = "https://t.me/Sherzodjanovich_7";
