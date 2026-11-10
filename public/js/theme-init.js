/* Sahifa chizilishidan oldin temani qo'yadi (miltillashni oldini oladi). Klassik skript, modul emas. */
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
