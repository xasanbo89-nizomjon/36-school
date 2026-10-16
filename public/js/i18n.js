import { SCHOOL_DICTIONARY } from "./i18n-school.js";

const STORAGE_KEY = "lang";
const DEFAULT_LANG = "uz";

const DICTIONARY = {
  uz: {
    "app.title": "36 School — maktab platformasi",

    "login.welcome": "Xush kelibsiz!",
    "login.subtitle": "Davom etish uchun hisobingizga kiring",
    "login.email": "Email",
    "login.password": "Parol",
    "login.remember": "Meni eslab qol",
    "login.forgot": "Parolni unutdingizmi?",
    "login.button": "Kirish",
    "login.busy": "Kirilmoqda...",
    "login.showPassword": "Parolni ko'rsatish",
    "login.hidePassword": "Parolni yashirish",
    "login.hero.title": "Maktab hayoti — bitta platformada",
    "login.hero.text": "Sinflar, davomat, vazifalar va galereya — o'qituvchilar, o'quvchilar va ota-onalar uchun qulay va xavfsiz.",
    "login.feature.attendance": "Davomat va natijalar nazorati",
    "login.feature.homework": "Vazifalar va sinflar boshqaruvi",
    "login.feature.gallery": "Maktab galereyasi va yangiliklari",
    "login.footer": "© 36 School. Barcha huquqlar himoyalangan.",

    "form.required": "Bu maydonni to'ldiring.",
    "form.invalidEmail": "Email manzilini to'g'ri kiriting.",
    "form.invalidNumber": "Raqam kiriting.",
    "form.integer": "Butun son kiriting.",
    "form.range": "Qiymat {min} dan {max} gacha bo'lishi kerak.",
    "form.invalidUrl": "Manzil https:// bilan boshlanishi kerak.",

    "auth.error.invalidCredentials": "Email yoki parol noto'g'ri. Qayta tekshirib ko'ring.",
    "auth.error.invalidEmail": "Email manzili noto'g'ri kiritilgan.",
    "auth.error.userDisabled": "Bu hisob bloklangan. Maktab ma'muriyatiga murojaat qiling.",
    "auth.error.tooManyRequests": "Urinishlar juda ko'p. Birozdan keyin qayta urinib ko'ring yoki parolni tiklang.",
    "auth.error.network": "Internet bilan aloqa yo'q. Ulanishni tekshirib, qayta urinib ko'ring.",
    "auth.error.generic": "Xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",

    "reset.title": "Parolni tiklash",
    "reset.description": "Email manzilingizni kiriting — parolni tiklash uchun havola yuboramiz.",
    "reset.submit": "Havola yuborish",
    "reset.sent": "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuborildi. Pochtangizni (va spam papkasini) tekshiring.",

    "nav.dashboard": "Boshqaruv",
    "nav.classes": "Sinflar",
    "nav.attendance": "Davomat",
    "nav.homework": "Vazifalar",
    "nav.gallery": "Galereya",
    "nav.logout": "Chiqish",
    "nav.collapse": "Menyuni yig'ish",
    "nav.expand": "Menyuni ochish",
    "nav.main": "Asosiy menyu",

    "topbar.theme": "Mavzuni almashtirish (yorug' / qorong'i)",
    "topbar.language": "Til",
    "topbar.profile": "Profil menyusi",

    "plan.free": "FREE",
    "plan.pro": "PRO",
    "plan.upgrade": "PRO ga o'tish",

    "role.superadmin": "Superadmin",
    "role.director": "Direktor",
    "role.deputy": "Direktor o'rinbosari",
    "role.teacher": "O'qituvchi",
    "role.student": "O'quvchi",
    "role.parent": "Ota-ona",
    "role.guest": "Mehmon",

    "dash.title.superadmin": "Superadmin paneli",
    "dash.title.director": "Direktor paneli",
    "dash.title.deputy": "O'rinbosar paneli",
    "dash.title.teacher": "O'qituvchi paneli",
    "dash.title.student": "O'quvchi paneli",
    "dash.title.parent": "Ota-ona paneli",
    "dash.title.guest": "Xush kelibsiz",
    "dash.subtitle": "Maktabning umumiy ko'rsatkichlari",
    "dash.analytics": "Maktab statistikasi",
    "dash.ranking": "Eng yaxshi davomat",
    "dash.chart.students": "O'quvchilar soni",
    "dash.chart.attendance": "Davomat, %",
    "stats.students": "O'quvchilar",
    "stats.teachers": "O'qituvchilar",
    "stats.attendance": "O'rtacha davomat",

    "guest.title": "Rol biriktirilmagan",
    "guest.notice":
      "Hisobingizga hali rol biriktirilmagan. Maktab ma'muriyatiga murojaat qiling — rol berilgach, tizimdan to'liq foydalana olasiz.",

    "common.noData": "Hozircha ma'lumot yo'q",
    "common.loadError": "Ma'lumotlarni yuklab bo'lmadi",
    "common.saveError": "Saqlab bo'lmadi. Ruxsatingizni tekshiring va qayta urinib ko'ring.",
    "common.deleteError": "O'chirib bo'lmadi. Ruxsatingizni tekshiring.",
    "common.delete": "O'chirish",
    "common.cancel": "Bekor qilish",
    "common.save": "Saqlash",
    "common.close": "Yopish",
    "empty.hint.add": "Birinchi yozuvni qo'shish uchun yuqoridagi tugmani bosing.",
    "toast.saved": "Saqlandi",
    "toast.deleted": "O'chirildi",
    "confirm.title": "O'chirishni tasdiqlang",
    "confirm.deleteNamed": "“{name}” o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.",

    "classes.title": "Sinflar",
    "classes.add": "Qo'shish",
    "classes.new": "Yangi sinf",
    "classes.students": "{n} ta o'quvchi",
    "classes.field.name": "Sinf nomi",
    "classes.field.teacher": "Sinf rahbari",
    "classes.field.students": "O'quvchilar soni",

    "attendance.title": "Davomat",
    "attendance.add": "Qo'shish",
    "attendance.new": "Davomat qo'shish",
    "attendance.field.class": "Sinf",
    "attendance.field.percent": "Davomat, % (0–100)",

    "homework.title": "Vazifalar",
    "homework.add": "Qo'shish",
    "homework.new": "Yangi vazifa",
    "homework.field.title": "Vazifa matni",
    "homework.field.class": "Sinf",

    "gallery.title": "Maktab galereyasi",
    "gallery.add": "Yuklash",
    "gallery.new": "Yangi rasm",
    "gallery.field.title": "Rasm nomi",
    "gallery.field.url": "Rasm manzili (https://)",
  },

  ru: {
    "app.title": "36 School — школьная платформа",

    "login.welcome": "Добро пожаловать!",
    "login.subtitle": "Войдите в аккаунт, чтобы продолжить",
    "login.email": "Email",
    "login.password": "Пароль",
    "login.remember": "Запомнить меня",
    "login.forgot": "Забыли пароль?",
    "login.button": "Войти",
    "login.busy": "Вход...",
    "login.showPassword": "Показать пароль",
    "login.hidePassword": "Скрыть пароль",
    "login.hero.title": "Школьная жизнь — на одной платформе",
    "login.hero.text": "Классы, посещаемость, задания и галерея — удобно и безопасно для учителей, учеников и родителей.",
    "login.feature.attendance": "Контроль посещаемости и результатов",
    "login.feature.homework": "Управление заданиями и классами",
    "login.feature.gallery": "Школьная галерея и новости",
    "login.footer": "© 36 School. Все права защищены.",

    "form.required": "Заполните это поле.",
    "form.invalidEmail": "Введите корректный email.",
    "form.invalidNumber": "Введите число.",
    "form.integer": "Введите целое число.",
    "form.range": "Значение должно быть от {min} до {max}.",
    "form.invalidUrl": "Ссылка должна начинаться с https://.",

    "auth.error.invalidCredentials": "Неверный email или пароль. Проверьте данные и попробуйте снова.",
    "auth.error.invalidEmail": "Неверный формат email.",
    "auth.error.userDisabled": "Этот аккаунт заблокирован. Обратитесь к администрации школы.",
    "auth.error.tooManyRequests": "Слишком много попыток. Попробуйте позже или восстановите пароль.",
    "auth.error.network": "Нет связи с интернетом. Проверьте подключение и попробуйте снова.",
    "auth.error.generic": "Произошла ошибка. Попробуйте ещё раз чуть позже.",

    "reset.title": "Восстановление пароля",
    "reset.description": "Введите email — мы отправим ссылку для восстановления пароля.",
    "reset.submit": "Отправить ссылку",
    "reset.sent": "Если этот email зарегистрирован, ссылка для восстановления отправлена. Проверьте почту (и папку «Спам»).",

    "nav.dashboard": "Панель",
    "nav.classes": "Классы",
    "nav.attendance": "Посещаемость",
    "nav.homework": "Задания",
    "nav.gallery": "Галерея",
    "nav.logout": "Выйти",
    "nav.collapse": "Свернуть меню",
    "nav.expand": "Развернуть меню",
    "nav.main": "Главное меню",

    "topbar.theme": "Сменить тему (светлая / тёмная)",
    "topbar.language": "Язык",
    "topbar.profile": "Меню профиля",

    "plan.free": "FREE",
    "plan.pro": "PRO",
    "plan.upgrade": "Перейти на PRO",

    "role.superadmin": "Суперадмин",
    "role.director": "Директор",
    "role.deputy": "Завуч",
    "role.teacher": "Учитель",
    "role.student": "Ученик",
    "role.parent": "Родитель",
    "role.guest": "Гость",

    "dash.title.superadmin": "Панель суперадмина",
    "dash.title.director": "Панель директора",
    "dash.title.deputy": "Панель завуча",
    "dash.title.teacher": "Панель учителя",
    "dash.title.student": "Панель ученика",
    "dash.title.parent": "Панель родителя",
    "dash.title.guest": "Добро пожаловать",
    "dash.subtitle": "Общие показатели школы",
    "dash.analytics": "Статистика школы",
    "dash.ranking": "Лучшая посещаемость",
    "dash.chart.students": "Количество учеников",
    "dash.chart.attendance": "Посещаемость, %",
    "stats.students": "Ученики",
    "stats.teachers": "Учителя",
    "stats.attendance": "Средняя посещаемость",

    "guest.title": "Роль не назначена",
    "guest.notice":
      "Вашему аккаунту ещё не назначена роль. Обратитесь к администрации школы — после назначения роли вы получите полный доступ.",

    "common.noData": "Пока нет данных",
    "common.loadError": "Не удалось загрузить данные",
    "common.saveError": "Не удалось сохранить. Проверьте права доступа и попробуйте ещё раз.",
    "common.deleteError": "Не удалось удалить. Проверьте права доступа.",
    "common.delete": "Удалить",
    "common.cancel": "Отмена",
    "common.save": "Сохранить",
    "common.close": "Закрыть",
    "empty.hint.add": "Чтобы добавить первую запись, нажмите кнопку выше.",
    "toast.saved": "Сохранено",
    "toast.deleted": "Удалено",
    "confirm.title": "Подтвердите удаление",
    "confirm.deleteNamed": "Удалить «{name}»? Это действие нельзя отменить.",

    "classes.title": "Классы",
    "classes.add": "Добавить",
    "classes.new": "Новый класс",
    "classes.students": "Учеников: {n}",
    "classes.field.name": "Название класса",
    "classes.field.teacher": "Классный руководитель",
    "classes.field.students": "Количество учеников",

    "attendance.title": "Посещаемость",
    "attendance.add": "Добавить",
    "attendance.new": "Добавить посещаемость",
    "attendance.field.class": "Класс",
    "attendance.field.percent": "Посещаемость, % (0–100)",

    "homework.title": "Задания",
    "homework.add": "Добавить",
    "homework.new": "Новое задание",
    "homework.field.title": "Текст задания",
    "homework.field.class": "Класс",

    "gallery.title": "Галерея школы",
    "gallery.add": "Загрузить",
    "gallery.new": "Новое фото",
    "gallery.field.title": "Название фото",
    "gallery.field.url": "Ссылка на фото (https://)",
  },

  en: {
    "app.title": "36 School — school platform",

    "login.welcome": "Welcome back!",
    "login.subtitle": "Sign in to your account to continue",
    "login.email": "Email",
    "login.password": "Password",
    "login.remember": "Remember me",
    "login.forgot": "Forgot password?",
    "login.button": "Sign in",
    "login.busy": "Signing in...",
    "login.showPassword": "Show password",
    "login.hidePassword": "Hide password",
    "login.hero.title": "School life, all in one platform",
    "login.hero.text": "Classes, attendance, homework and gallery — simple and secure for teachers, students and parents.",
    "login.feature.attendance": "Attendance and results tracking",
    "login.feature.homework": "Homework and class management",
    "login.feature.gallery": "School gallery and news",
    "login.footer": "© 36 School. All rights reserved.",

    "form.required": "Please fill in this field.",
    "form.invalidEmail": "Enter a valid email address.",
    "form.invalidNumber": "Enter a number.",
    "form.integer": "Enter a whole number.",
    "form.range": "The value must be between {min} and {max}.",
    "form.invalidUrl": "The link must start with https://.",

    "auth.error.invalidCredentials": "Incorrect email or password. Please check and try again.",
    "auth.error.invalidEmail": "The email address is not valid.",
    "auth.error.userDisabled": "This account has been disabled. Contact the school administration.",
    "auth.error.tooManyRequests": "Too many attempts. Try again later or reset your password.",
    "auth.error.network": "No internet connection. Check your network and try again.",
    "auth.error.generic": "Something went wrong. Please try again shortly.",

    "reset.title": "Reset password",
    "reset.description": "Enter your email and we'll send you a link to reset your password.",
    "reset.submit": "Send link",
    "reset.sent": "If this email is registered, a reset link has been sent. Check your inbox (and spam folder).",

    "nav.dashboard": "Dashboard",
    "nav.classes": "Classes",
    "nav.attendance": "Attendance",
    "nav.homework": "Homework",
    "nav.gallery": "Gallery",
    "nav.logout": "Sign out",
    "nav.collapse": "Collapse menu",
    "nav.expand": "Expand menu",
    "nav.main": "Main menu",

    "topbar.theme": "Switch theme (light / dark)",
    "topbar.language": "Language",
    "topbar.profile": "Profile menu",

    "plan.free": "FREE",
    "plan.pro": "PRO",
    "plan.upgrade": "Upgrade to PRO",

    "role.superadmin": "Superadmin",
    "role.director": "Director",
    "role.deputy": "Deputy",
    "role.teacher": "Teacher",
    "role.student": "Student",
    "role.parent": "Parent",
    "role.guest": "Guest",

    "dash.title.superadmin": "Superadmin Dashboard",
    "dash.title.director": "Director Dashboard",
    "dash.title.deputy": "Deputy Dashboard",
    "dash.title.teacher": "Teacher Dashboard",
    "dash.title.student": "Student Dashboard",
    "dash.title.parent": "Parent Dashboard",
    "dash.title.guest": "Welcome",
    "dash.subtitle": "School overview",
    "dash.analytics": "School Analytics",
    "dash.ranking": "Top Attendance",
    "dash.chart.students": "Students",
    "dash.chart.attendance": "Attendance, %",
    "stats.students": "Students",
    "stats.teachers": "Teachers",
    "stats.attendance": "Average attendance",

    "guest.title": "No role assigned",
    "guest.notice":
      "No role has been assigned to your account yet. Please contact the school administration — once a role is assigned you will get full access.",

    "common.noData": "No data yet",
    "common.loadError": "Could not load data",
    "common.saveError": "Could not save. Check your permissions and try again.",
    "common.deleteError": "Could not delete. Check your permissions.",
    "common.delete": "Delete",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.close": "Close",
    "empty.hint.add": "Use the button above to add the first entry.",
    "toast.saved": "Saved",
    "toast.deleted": "Deleted",
    "confirm.title": "Confirm deletion",
    "confirm.deleteNamed": "Delete “{name}”? This cannot be undone.",

    "classes.title": "Classes",
    "classes.add": "Add",
    "classes.new": "New class",
    "classes.students": "{n} students",
    "classes.field.name": "Class name",
    "classes.field.teacher": "Class teacher",
    "classes.field.students": "Number of students",

    "attendance.title": "Attendance",
    "attendance.add": "Add",
    "attendance.new": "Add attendance",
    "attendance.field.class": "Class",
    "attendance.field.percent": "Attendance, % (0–100)",

    "homework.title": "Homework",
    "homework.add": "Add",
    "homework.new": "New homework",
    "homework.field.title": "Homework text",
    "homework.field.class": "Class",

    "gallery.title": "School Gallery",
    "gallery.add": "Upload",
    "gallery.new": "New image",
    "gallery.field.title": "Image title",
    "gallery.field.url": "Image URL (https://)",
  },
};

/* Yangi bo'limlar tarjimalari asosiy lug'atga qo'shiladi (bir xil kalit bo'lsa — yangisi ustun) */
for (const [lang, entries] of Object.entries(SCHOOL_DICTIONARY)) Object.assign(DICTIONARY[lang], entries);

export const LANGUAGES = Object.keys(DICTIONARY);

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG; // localStorage yopiq bo'lishi mumkin
  }
}

let currentLang = readStoredLanguage();

export function getLanguage() {
  return currentLang;
}

/* t("classes.students", { n: 5 }) -> "5 ta o'quvchi". Kalit topilmasa — uz, so'ng kalitning o'zi. */
export function t(key, params = {}) {
  const text = DICTIONARY[currentLang][key] ?? DICTIONARY[DEFAULT_LANG][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? params[name] : match));
}

function readParams(node) {
  return node.dataset.i18nParams ? JSON.parse(node.dataset.i18nParams) : {};
}

/*
 root ichida qo'llanadi:
 data-i18n -> textContent, data-i18n-placeholder -> placeholder,
 data-i18n-title -> title + aria-label (ikonkali tugmalar uchun), data-i18n-aria -> faqat aria-label
*/
export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n, readParams(node));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  root.querySelectorAll("[data-i18n-title]").forEach((node) => {
    const text = t(node.dataset.i18nTitle);
    node.title = text;
    node.setAttribute("aria-label", text);
  });
  root.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  });
  document.documentElement.lang = currentLang;
  document.title = t("app.title");
}

const listeners = new Set();

export function onLanguageChange(callback) {
  listeners.add(callback);
}

export function setLanguage(lang) {
  if (!LANGUAGES.includes(lang)) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* saqlab bo'lmasa ham til joriy sessiyada ishlaydi */
  }
  applyTranslations();
  listeners.forEach((callback) => callback(lang));
}
