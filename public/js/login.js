import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "./firebase.js";
import { t } from "./i18n.js";
import { LOGIN_DOMAIN } from "./config.js";
import {
  byId,
  icon,
  isValidEmail,
  openFormModal,
  setFieldError,
  setI18n,
  setLoading,
  toast,
} from "./ui.js";

const REMEMBER_KEY = "rememberMe";

/* "ali.valiyev" -> "ali.valiyev@36-school.uz"; email bo'lsa o'zgarmaydi */
export function toAuthEmail(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "";
  return text.includes("@") ? text : `${text}@${LOGIN_DOMAIN}`;
}

const LOGIN_PATTERN = /^[a-z0-9._-]{2,60}$/;

/* Firebase xato kodi -> tarjima kaliti */
export function authErrorKey(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "auth.error.invalidCredentials";
    case "auth/invalid-email":
      return "auth.error.invalidEmail";
    case "auth/user-disabled":
      return "auth.error.userDisabled";
    case "auth/too-many-requests":
      return "auth.error.tooManyRequests";
    case "auth/network-request-failed":
      return "auth.error.network";
    default:
      return "auth.error.generic";
  }
}

function readRemember() {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveRemember(value) {
  try {
    localStorage.setItem(REMEMBER_KEY, value ? "1" : "0");
  } catch {
    /* ixtiyoriy */
  }
}

export function initLogin() {
  const form = byId("loginForm");
  const emailInput = byId("emailInput");
  const passwordInput = byId("passwordInput");
  const emailError = byId("emailError");
  const passwordError = byId("passwordError");
  const formError = byId("loginError");
  const loginBtn = byId("loginBtn");
  const loginLabel = byId("loginBtnLabel");
  const remember = byId("rememberMe");
  const toggle = byId("togglePassword");

  remember.checked = readRemember();

  const showFormError = (key) => {
    setI18n(byId("loginErrorText"), key);
    formError.hidden = false;
  };

  const validateEmail = () => {
    const value = emailInput.value.trim().toLowerCase();
    const valid = value.includes("@") ? isValidEmail(value) : LOGIN_PATTERN.test(value);
    const error = !value ? { key: "form.required" } : !valid ? { key: "login.invalidIdentity" } : null;
    setFieldError(emailInput, emailError, error);
    return !error;
  };

  const validatePassword = () => {
    const error = passwordInput.value ? null : { key: "form.required" };
    setFieldError(passwordInput, passwordError, error);
    return !error;
  };

  emailInput.addEventListener("blur", () => {
    if (emailInput.value.trim()) validateEmail();
  });
  emailInput.addEventListener("input", () => {
    setFieldError(emailInput, emailError, null);
    formError.hidden = true;
  });
  passwordInput.addEventListener("input", () => {
    setFieldError(passwordInput, passwordError, null);
    formError.hidden = true;
  });

  /* Parolni ko'rsatish / yashirish */
  toggle.addEventListener("click", () => {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(visible));
    toggle.dataset.i18nTitle = visible ? "login.hidePassword" : "login.showPassword";
    toggle.title = t(toggle.dataset.i18nTitle);
    toggle.setAttribute("aria-label", toggle.title);
    toggle.replaceChildren(icon(visible ? "eye-off" : "eye"));
    passwordInput.focus();
  });

  /* Kirish (Enter ham shu submit orqali ishlaydi) */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (loginBtn.disabled) return;
    formError.hidden = true;

    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk) return emailInput.focus();
    if (!passwordOk) return passwordInput.focus();

    setLoading(loginBtn, true);
    setI18n(loginLabel, "login.busy");
    try {
      saveRemember(remember.checked);
      await setPersistence(auth, remember.checked ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, toAuthEmail(emailInput.value), passwordInput.value);
      // Muvaffaqiyatli: sahifa onAuthStateChanged orqali almashadi, tugma resetLoginForm() da tiklanadi
    } catch (error) {
      console.error(error);
      showFormError(authErrorKey(error));
      setLoading(loginBtn, false);
      setI18n(loginLabel, "login.button");
    }
  });

  /* Parolni tiklash */
  byId("forgotBtn").addEventListener("click", async () => {
    const sent = await openFormModal({
      titleKey: "reset.title",
      descriptionKey: "reset.description",
      submitKey: "reset.submit",
      fields: [
        {
          name: "email",
          labelKey: "login.email",
          type: "email",
          required: true,
          autocomplete: "email",
          value: emailInput.value.includes("@") ? emailInput.value.trim() : "",
        },
      ],
      onSubmit: async ({ email }) => {
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (error) {
          // Email mavjudligi oshkor bo'lmasligi uchun "topilmadi" ham muvaffaqiyat deb ko'rsatiladi
          if (error?.code === "auth/user-not-found") return;
          const failure = new Error(error?.code);
          failure.i18nKey = authErrorKey(error);
          throw failure;
        }
      },
    });
    if (sent) toast(t("reset.sent"), "success", 8000);
  });
}

/* Chiqishdan keyin forma boshlang'ich holatga qaytadi */
export function resetLoginForm() {
  byId("passwordInput").value = "";
  byId("passwordInput").type = "password";
  byId("loginError").hidden = true;
  setLoading(byId("loginBtn"), false);
  setI18n(byId("loginBtnLabel"), "login.button");
  const toggle = byId("togglePassword");
  toggle.setAttribute("aria-pressed", "false");
  toggle.dataset.i18nTitle = "login.showPassword";
  toggle.title = t("login.showPassword");
  toggle.setAttribute("aria-label", toggle.title);
  toggle.replaceChildren(icon("eye"));
}
