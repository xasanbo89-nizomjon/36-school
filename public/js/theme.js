const STORAGE_KEY = "theme";
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set();

function stored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function getTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((callback) => callback(theme));
}

export function onThemeChange(callback) {
  listeners.add(callback);
}

/* Tema tugmalari (.js-theme-toggle): foydalanuvchi tanlasa localStorage'da saqlanadi */
export function initTheme() {
  document.querySelectorAll(".js-theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* saqlab bo'lmasa ham joriy sessiyada ishlaydi */
      }
      apply(next);
    });
  });

  // Foydalanuvchi o'zi tanlamagan bo'lsa, tizim sozlamasi o'zgarganda ergashadi
  darkQuery.addEventListener("change", (event) => {
    if (!stored()) apply(event.matches ? "dark" : "light");
  });
}
