import { t } from "./i18n.js";

/*
 Barcha matn DOM'ga textContent / createElement orqali qo'yiladi.
 Firestore'dan kelgan hech qanday qiymat innerHTML'ga tushmaydi.
*/

export const byId = (id) => document.getElementById(id);

/*
 el("div", { class, text, i18n, i18nParams, title, attrs, on }, ...children)
   i18n  — tarjima kaliti (til almashganda avtomatik yangilanadi)
   title — ikonkali tugma uchun tarjima kaliti (title + aria-label)
*/
export function el(tag, options = {}, ...children) {
  const node = document.createElement(tag);
  if (options.class) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  if (options.i18n) setI18n(node, options.i18n, options.i18nParams);
  if (options.title) {
    node.dataset.i18nTitle = options.title;
    node.title = t(options.title);
    node.setAttribute("aria-label", node.title);
  }
  for (const [name, value] of Object.entries(options.attrs || {})) {
    node.setAttribute(name, value);
  }
  for (const [event, handler] of Object.entries(options.on || {})) {
    node.addEventListener(event, handler);
  }
  node.append(...children.filter(Boolean));
  return node;
}

/* Elementga tarjima kalitini bog'laydi va matnini qo'yadi */
export function setI18n(node, key, params) {
  node.dataset.i18n = key;
  if (params) node.dataset.i18nParams = JSON.stringify(params);
  else delete node.dataset.i18nParams;
  node.textContent = t(key, params);
}

export function clearI18n(node) {
  delete node.dataset.i18n;
  delete node.dataset.i18nParams;
  node.textContent = "";
}

export function clear(node) {
  node.replaceChildren();
  node.removeAttribute("aria-busy");
}

/* Faqat https:// manzillar qabul qilinadi (javascript:, data:, http: rad etiladi) */
export function toHttpsUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

/* "7-A " va "7-a" bir xil sinf deb hisoblanadi */
export function normalizeName(value) {
  return String(value ?? "").trim().toLowerCase();
}

/* =========================
   IKONKALAR (index.html dagi SVG sprite: #i-<nom>)
   ========================= */

const SVG_NS = "http://www.w3.org/2000/svg";

export function icon(name, className = "icon") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

/* =========================
   EMPTY STATE VA SKELETON
   ========================= */

export function renderEmpty(container, { titleKey = "common.noData", hintKey = null, iconName = "inbox" } = {}) {
  clear(container);
  container.append(
    el(
      "div",
      { class: "empty-state" },
      el("div", { class: "empty-icon" }, icon(iconName, "icon icon-lg")),
      el("p", { class: "empty-title", i18n: titleKey }),
      hintKey ? el("p", { class: "empty-hint", i18n: hintKey }) : null
    )
  );
}

export function renderLoadError(container) {
  renderEmpty(container, { titleKey: "common.loadError", iconName: "alert" });
}

export function renderSkeleton(container, { count = 3 } = {}) {
  clear(container);
  container.setAttribute("aria-busy", "true");
  for (let i = 0; i < count; i++) {
    container.append(
      el(
        "div",
        { class: "skeleton-card", attrs: { "aria-hidden": "true" } },
        el("div", { class: "skeleton skeleton-line skeleton-w60" }),
        el("div", { class: "skeleton skeleton-line skeleton-w40" }),
        el("div", { class: "skeleton skeleton-bar" })
      )
    );
  }
}

/* =========================
   TOAST
   ========================= */

const MAX_TOASTS = 4;

export function toast(message, type = "info", duration = 4500) {
  let root = byId("toastRoot");
  if (!root) {
    root = el("div", { class: "toast-root", attrs: { id: "toastRoot" } });
    document.body.append(root);
  }
  while (root.children.length >= MAX_TOASTS) root.firstChild.remove();

  const iconName = type === "success" ? "check" : type === "error" ? "alert" : "info";
  let timer = null;

  const dismiss = () => {
    clearTimeout(timer);
    node.classList.add("leaving");
    setTimeout(() => node.remove(), 200);
  };

  const node = el(
    "div",
    { class: `toast toast-${type}`, attrs: { role: type === "error" ? "alert" : "status" } },
    icon(iconName),
    el("span", { class: "toast-text", text: message }),
    el("button", { class: "icon-btn toast-close", attrs: { type: "button" }, title: "common.close", on: { click: dismiss } }, icon("x"))
  );

  root.append(node);
  timer = setTimeout(dismiss, duration);
}

/* =========================
   DIALOG (Modal va Confirm uchun umumiy asos)
   ========================= */

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
let dialogCount = 0;

function createDialog({ titleKey, size = "md", onClose }) {
  const previouslyFocused = document.activeElement;
  const titleId = `dialog-title-${++dialogCount}`;

  const body = el("div", { class: "modal-body" });
  const closeBtn = el("button", { class: "icon-btn", attrs: { type: "button" }, title: "common.close" }, icon("x"));
  const dialog = el(
    "div",
    { class: `modal modal-${size}`, attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": titleId } },
    el("div", { class: "modal-header" }, el("h2", { class: "modal-title", i18n: titleKey, attrs: { id: titleId } }), closeBtn),
    body
  );
  const overlay = el("div", { class: "modal-overlay" }, dialog);

  let closed = false;
  const close = (result) => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown, true);
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 150);
    if (!document.querySelector(".modal-overlay:not(.leaving)")) document.body.classList.remove("modal-open");
    previouslyFocused?.focus?.();
    onClose?.(result);
  };

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close(false);
    } else if (event.key === "Tab") {
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((node) => !node.hidden && node.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  closeBtn.addEventListener("click", () => close(false));
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) close(false);
  });
  document.addEventListener("keydown", onKeydown, true);

  document.body.append(overlay);
  document.body.classList.add("modal-open");

  return { body, close, dialog };
}

/* =========================
   FORMA MODALI
   fields: [{ name, labelKey, type: text|number|email|url|textarea, required, maxLength,
              min, max, integer, placeholder, placeholderKey, value }]
   onSubmit(values) — async; xato tashlasa modal ochiq qoladi va xato ko'rsatiladi.
   Promise<boolean> qaytaradi: saqlandi (true) yoki bekor qilindi (false).
   ========================= */

export function setFieldError(control, errorNode, error) {
  if (error) {
    setI18n(errorNode, error.key, error.params);
    errorNode.hidden = false;
    control.setAttribute("aria-invalid", "true");
  } else {
    clearI18n(errorNode);
    errorNode.hidden = true;
    control.removeAttribute("aria-invalid");
  }
}

function readField(field, raw) {
  if (field.type === "multiselect") {
    return field.required && raw.length === 0 ? { error: { key: "form.required" } } : { value: raw };
  }
  if (field.type === "password") {
    if (!raw) return field.required ? { error: { key: "form.required" } } : { value: "" };
    return raw.length < (field.minLength ?? 6)
      ? { error: { key: "form.minLength", params: { n: field.minLength ?? 6 } } }
      : { value: raw };
  }
  const value = raw.trim();
  if (value === "") {
    return field.required ? { error: { key: "form.required" } } : { value: field.type === "number" ? null : "" };
  }

  if (field.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return { error: { key: "form.invalidNumber" } };
    if (field.integer && !Number.isInteger(number)) return { error: { key: "form.integer" } };
    if (number < field.min || number > field.max) {
      return { error: { key: "form.range", params: { min: field.min, max: field.max } } };
    }
    return { value: number };
  }
  if (field.type === "email") {
    return isValidEmail(value) ? { value } : { error: { key: "form.invalidEmail" } };
  }
  if (field.type === "url") {
    const url = toHttpsUrl(value);
    return url ? { value: url } : { error: { key: "form.invalidUrl" } };
  }
  return { value };
}

/* Maydon turiga qarab boshqaruv elementi */
function optionLabel(option) {
  return option.labelKey ? t(option.labelKey) : String(option.label ?? option.value);
}

function buildControl(field, id) {
  const type = field.type ?? "text";

  if (type === "select") {
    const select = el("select", { class: "input", attrs: { id, name: field.name } });
    if (!field.required || field.placeholderKey) {
      select.append(el("option", { text: field.placeholderKey ? t(field.placeholderKey) : "—", attrs: { value: "" } }));
    }
    for (const option of field.options ?? []) {
      select.append(el("option", { text: optionLabel(option), attrs: { value: option.value } }));
    }
    if (field.value !== undefined && field.value !== null) select.value = field.value;
    return select;
  }

  if (type === "multiselect") {
    const box = el("div", { class: "check-list", attrs: { id, role: "group", tabindex: "-1" } });
    const selected = new Set(field.value ?? []);
    const options = field.options ?? [];
    if (options.length === 0) box.append(el("p", { class: "field-hint", i18n: "common.noData" }));
    const items = el("div", { class: "check-items" });
    for (const option of options) {
      const input = el("input", { attrs: { type: "checkbox", value: option.value } });
      input.checked = selected.has(option.value);
      items.append(el("label", { class: "checkbox" }, input, el("span", { text: optionLabel(option) })));
    }
    /* Ko'p variant bo'lsa — qidiruv (tanlanganlar har doim ko'rinadi) */
    if (options.length > 8) {
      const filter = el("input", { class: "input input-sm", attrs: { type: "search", placeholder: t("common.search"), "aria-label": t("common.search") } });
      filter.addEventListener("input", (event) => {
        event.stopPropagation();
        const needle = filter.value.trim().toLowerCase();
        items.querySelectorAll("label").forEach((label) => {
          const checked = label.querySelector("input").checked;
          label.hidden = Boolean(needle) && !checked && !label.textContent.toLowerCase().includes(needle);
        });
      });
      box.append(filter);
    }
    box.append(items);
    return box;
  }

  const isTextarea = type === "textarea";
  const control = el(isTextarea ? "textarea" : "input", {
    class: "input",
    attrs: {
      id,
      name: field.name,
      autocomplete: field.autocomplete ?? "off",
      ...(isTextarea ? { rows: String(field.rows ?? 3) } : { type: type === "text" ? "text" : type }),
      ...(type === "number" ? { min: field.min, max: field.max, step: field.integer ? "1" : "any", inputmode: "decimal" } : {}),
      ...(field.maxLength ? { maxlength: field.maxLength } : {}),
    },
  });
  if (field.value !== undefined && field.value !== null) control.value = field.value;
  if (field.placeholderKey) {
    control.dataset.i18nPlaceholder = field.placeholderKey;
    control.placeholder = t(field.placeholderKey);
  } else if (field.placeholder) {
    control.placeholder = field.placeholder;
  }
  return control;
}

export function openFormModal({ titleKey, descriptionKey, fields, submitKey = "common.save", onSubmit }) {
  return new Promise((resolve) => {
    const dialog = createDialog({ titleKey, onClose: (result) => resolve(result === true) });

    const form = el("form", { class: "form", attrs: { novalidate: "" } });
    const formError = el("div", { class: "form-alert", attrs: { role: "alert" } });
    formError.hidden = true;

    if (descriptionKey) form.append(el("p", { class: "modal-text", i18n: descriptionKey }));
    form.append(formError);

    const controls = fields.map((field, index) => {
      const id = `field-${dialogCount}-${index}`;
      const control = buildControl(field, id);

      const errorNode = el("p", { class: "field-error", attrs: { id: `${id}-error` } });
      errorNode.hidden = true;
      control.setAttribute("aria-describedby", errorNode.id);
      control.addEventListener("input", () => setFieldError(control, errorNode, null));
      control.addEventListener("change", () => setFieldError(control, errorNode, null));

      const wrapper = el(
        "div",
        { class: "field" },
        el("label", { class: field.required ? "label required" : "label", i18n: field.labelKey, attrs: { for: id } }),
        control,
        field.hintKey ? el("p", { class: "field-hint", i18n: field.hintKey }) : null,
        errorNode
      );
      form.append(wrapper);
      return { field, control, errorNode, wrapper };
    });

    /* Shartli maydonlar: dependsOn: { name: "role", values: ["student"] } */
    const valueOf = (name) => controls.find((entry) => entry.field.name === name)?.control.value;
    const isActive = ({ field }) => !field.dependsOn || field.dependsOn.values.includes(valueOf(field.dependsOn.name));
    const refreshVisibility = () => controls.forEach((entry) => (entry.wrapper.hidden = !isActive(entry)));
    form.addEventListener("change", refreshVisibility);
    refreshVisibility();

    const cancelBtn = el("button", { class: "btn btn-secondary", i18n: "common.cancel", attrs: { type: "button" }, on: { click: () => dialog.close(false) } });
    const submitBtn = el("button", { class: "btn btn-primary", i18n: submitKey, attrs: { type: "submit" } });
    form.append(el("div", { class: "modal-actions" }, cancelBtn, submitBtn));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitBtn.disabled) return;
      formError.hidden = true;

      const values = {};
      let firstInvalid = null;
      for (const entry of controls) {
        const { field, control, errorNode } = entry;
        if (!isActive(entry)) continue;
        const raw = field.type === "multiselect"
          ? [...control.querySelectorAll("input:checked")].map((input) => input.value)
          : control.value;
        const result = readField(field, raw);
        setFieldError(control, errorNode, result.error ?? null);
        if (result.error) firstInvalid ??= control;
        else values[field.name] = result.value;
      }
      if (firstInvalid) return firstInvalid.focus();

      setLoading(submitBtn, true);
      try {
        await onSubmit(values);
        dialog.close(true);
      } catch (error) {
        if (!error?.i18nKey) console.error(error); // kutilgan (tarjimali) xatolar konsolni ifloslamaydi
        setI18n(formError, error?.i18nKey ?? "common.saveError");
        formError.hidden = false;
        setLoading(submitBtn, false);
      }
    });

    dialog.body.append(form);
    (controls[0]?.control ?? cancelBtn).focus();
  });
}

/* Tugmani yuklanish holatiga o'tkazadi / qaytaradi */
export function setLoading(button, loading) {
  button.disabled = loading;
  button.classList.toggle("is-loading", loading);
  button.setAttribute("aria-busy", String(loading));
}

/* =========================
   CONFIRM DIALOG -> Promise<boolean>
   ========================= */

export function confirmDialog({
  titleKey = "confirm.title",
  messageKey = "confirm.deleteNamed",
  messageParams,
  confirmKey = "common.delete",
  danger = true,
} = {}) {
  return new Promise((resolve) => {
    const dialog = createDialog({ titleKey, size: "sm", onClose: (result) => resolve(result === true) });

    const cancelBtn = el("button", { class: "btn btn-secondary", i18n: "common.cancel", attrs: { type: "button" }, on: { click: () => dialog.close(false) } });
    const confirmBtn = el("button", {
      class: danger ? "btn btn-danger" : "btn btn-primary",
      i18n: confirmKey,
      attrs: { type: "button" },
      on: { click: () => dialog.close(true) },
    });

    dialog.body.append(
      el("p", { class: "modal-text", i18n: messageKey, i18nParams: messageParams }),
      el("div", { class: "modal-actions" }, cancelBtn, confirmBtn)
    );
    cancelBtn.focus(); // tasodifiy Enter o'chirib yubormasligi uchun
  });
}

/* =========================
   MA'LUMOT O'ZGARISHI
   ========================= */

const dataListeners = new Set();

export function onDataChanged(callback) {
  dataListeners.add(callback);
}

export function notifyDataChanged() {
  dataListeners.forEach((callback) => callback());
}

/* =========================
   KICHIK YORDAMCHILAR
   ========================= */

/* <select> yaratadi: options [{ value, label | labelKey }] */
export function selectControl({ options, value = "", placeholderKey = null, className = "select", label = null, onChange }) {
  const select = el("select", { class: className, attrs: label ? { "aria-label": label } : {} });
  if (placeholderKey) select.append(el("option", { text: t(placeholderKey), attrs: { value: "" } }));
  for (const option of options) {
    select.append(el("option", { text: optionLabel(option), attrs: { value: option.value } }));
  }
  select.value = value;
  if (onChange) select.addEventListener("change", () => onChange(select.value));
  return select;
}

/* CSV faylni yuklab berish (Excel o'zbekcha harflarni to'g'ri ochishi uchun BOM bilan) */
export function downloadCsv(filename, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const link = el("a", { attrs: { href: URL.createObjectURL(blob), download: filename } });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* Matnni nusxalash */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* Oddiy ma'lumot oynasi (masalan, yangi login/parolni ko'rsatish) */
export function infoDialog({ titleKey, build }) {
  return new Promise((resolve) => {
    const dialog = createDialog({ titleKey, onClose: () => resolve() });
    const okBtn = el("button", { class: "btn btn-primary", i18n: "common.done", attrs: { type: "button" }, on: { click: () => dialog.close(true) } });
    dialog.body.append(build(), el("div", { class: "modal-actions" }, okBtn));
    okBtn.focus();
  });
}

/* Sahifa ichidagi tablar */
export function tabs(items, active, onSelect) {
  const bar = el("div", { class: "tabs", attrs: { role: "tablist" } });
  for (const item of items) {
    const button = el("button", {
      class: item.value === active ? "tab active" : "tab",
      i18n: item.labelKey,
      attrs: { type: "button", role: "tab", "aria-selected": String(item.value === active) },
      on: { click: () => onSelect(item.value) },
    });
    bar.append(button);
  }
  return bar;
}
