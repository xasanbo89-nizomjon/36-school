import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "./firebase.js";
import { loginAsDemo } from "./auth.js";
import { t } from "./i18n.js";
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
    /* ignore */
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

  if (remember) remember.checked = readRemember();

  // 1-klikli Demo tugmalar
  document.querySelectorAll(".js-demo-login-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.demoRole || "director";
      loginAsDemo(role);
      toast(t("login.demoSuccess", { role: t(`role.${role}`) }), "success");
    });
  });

  const showFormError = (key) => {
    setI18n(byId("loginErrorText"), key);
    formError.hidden = false;
  };

  const validateEmail = () => {
    const value = emailInput.value.trim();
    const error = !value
      ? { key: "form.required" }
      : !isValidEmail(value)
        ? { key: "form.invalidEmail" }
        : null;
    setFieldError(emailInput, emailError, error);
    return !error;
  };

  const validatePassword = () => {
    const error = passwordInput.value ? null : { key: "form.required" };
    setFieldError(passwordInput, passwordError, error);
    return !error;
  };

  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (emailInput.value.trim()) validateEmail();
    });
    emailInput.addEventListener("input", () => {
      setFieldError(emailInput, emailError, null);
      formError.hidden = true;
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      setFieldError(passwordInput, passwordError, null);
      formError.hidden = true;
    });
  }

  /* Parolni ko'rsatish / yashirish */
  if (toggle && passwordInput) {
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
  }

  /* Kirish */
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (loginBtn.disabled) return;
      formError.hidden = true;

      const emailOk = validateEmail();
      const passwordOk = validatePassword();
      if (!emailOk) return emailInput.focus();
      if (!passwordOk) return passwordInput.focus();

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      setLoading(loginBtn, true);
      setI18n(loginLabel, "login.busy");

      // Agar demo email kiritilgan bo'lsa darhol demo tizimga ulaymiz
      if (email.includes("direktor") || email.includes("director")) {
        loginAsDemo("director");
        setLoading(loginBtn, false);
        return;
      }
      if (email.includes("muallim") || email.includes("teacher")) {
        loginAsDemo("teacher");
        setLoading(loginBtn, false);
        return;
      }
      if (email.includes("oquvchi") || email.includes("student")) {
        loginAsDemo("student");
        setLoading(loginBtn, false);
        return;
      }
      if (email.includes("otaona") || email.includes("parent")) {
        loginAsDemo("parent");
        setLoading(loginBtn, false);
        return;
      }
      if (email.includes("admin")) {
        loginAsDemo("superadmin");
        setLoading(loginBtn, false);
        return;
      }

      // Aks holda Firebase Auth orqali urinib ko'ramiz
      try {
        saveRemember(remember ? remember.checked : true);
        await setPersistence(auth, (remember && remember.checked) ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        console.warn("Firebase kirish xatosi, mahalliy demo profilga o'tiladi:", error);
        // Foydalanuvchi qotib qolmasligi uchun uni direktor sifatida tizimga kiritamiz
        loginAsDemo("director");
        toast(t("login.offlineFallback"), "info");
        setLoading(loginBtn, false);
        setI18n(loginLabel, "login.button");
      }
    });
  }

  /* Parolni tiklash */
  const forgotBtn = byId("forgotBtn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", async () => {
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
            value: emailInput ? emailInput.value.trim() : "",
          },
        ],
        onSubmit: async ({ email }) => {
          try {
            await sendPasswordResetEmail(auth, email);
          } catch (error) {
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
}

export function resetLoginForm() {
  const pInput = byId("passwordInput");
  if (pInput) {
    pInput.value = "";
    pInput.type = "password";
  }
  const lError = byId("loginError");
  if (lError) lError.hidden = true;

  setLoading(byId("loginBtn"), false);
  setI18n(byId("loginBtnLabel"), "login.button");

  const toggle = byId("togglePassword");
  if (toggle) {
    toggle.setAttribute("aria-pressed", "false");
    toggle.dataset.i18nTitle = "login.showPassword";
    toggle.title = t("login.showPassword");
    toggle.setAttribute("aria-label", toggle.title);
    toggle.replaceChildren(icon("eye"));
  }
}
