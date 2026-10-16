import { auth } from "../firebase.js";
import { api } from "../api.js";
import { getRole } from "../auth.js";
import { LOGIN_DOMAIN } from "../config.js";
import { t } from "../i18n.js";
import { store, loadUsers, classById, className, displayName, userById } from "../data.js";
import {
  byId, el, clear, icon, toast, confirmDialog, openFormModal, infoDialog, renderEmpty,
  renderLoadError, renderSkeleton, selectControl, downloadCsv, copyText, tabs, notifyDataChanged,
} from "../ui.js";

/* server.js dagi CAN_ASSIGN bilan bir xil */
const CAN_ASSIGN = {
  superadmin: ["superadmin", "director", "deputy", "teacher", "student", "parent"],
  director: ["deputy", "teacher", "student", "parent"],
  deputy: ["teacher", "student", "parent"],
};

const FILTERS = [
  { value: "all", labelKey: "users.filter.all", roles: null },
  { value: "student", labelKey: "users.filter.students", roles: ["student"] },
  { value: "teacher", labelKey: "users.filter.teachers", roles: ["teacher"] },
  { value: "parent", labelKey: "users.filter.parents", roles: ["parent"] },
  { value: "staff", labelKey: "users.filter.admins", roles: ["superadmin", "director", "deputy"] },
];

const view = { filter: "all", classId: "", search: "" };

const root = () => byId("usersContainer");
const assignable = () => CAN_ASSIGN[getRole()] ?? [];
const canEdit = (user) => user.id !== auth.currentUser?.uid && (!user.role || assignable().includes(user.role));

/* ---------- Login yaratish ---------- */

const CYRILLIC = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "s", ч: "ch", ш: "sh", щ: "sh", ъ: "",
  ы: "i", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

export function toLogin(name) {
  const latin = String(name)
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC[char] ?? char)
    .join("")
    .replace(/[ʻʼ'`‘’]/g, "");
  const parts = latin.split(/\s+/).map((part) => part.replace(/[^a-z0-9-]/g, "")).filter(Boolean);
  return parts.slice(0, 2).join(".");
}

/* Mavjud loginlar bilan to'qnashmaydigan login: ali.valiyev, ali.valiyev2, ... */
function uniqueLogin(base, taken) {
  let login = base || "user";
  let n = 2;
  while (taken.has(`${login}@${LOGIN_DOMAIN}`)) login = `${base}${n++}`;
  taken.add(`${login}@${LOGIN_DOMAIN}`);
  return login;
}

const takenEmails = () => new Set(store.users.map((user) => String(user.email ?? "").toLowerCase()));

/* Kiritilgan matn: email bo'lsa — email, aks holda login */
function splitIdentity(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return text.includes("@") ? { email: text } : { login: text };
}

/* ---------- Ko'rinish ---------- */

function filtered() {
  const roles = FILTERS.find((item) => item.value === view.filter)?.roles;
  const search = view.search.trim().toLowerCase();
  return store.users.filter((user) => {
    if (roles && !roles.includes(user.role)) return false;
    if (view.classId && user.classId !== view.classId) return false;
    if (search) {
      const haystack = `${user.name ?? ""} ${user.email ?? ""} ${user.phone ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function detailsOf(user) {
  if (user.role === "student") return user.classId ? className(user.classId) : t("users.noClass");
  if (user.role === "parent") {
    const names = (user.childIds ?? []).map((id) => displayName(userById(id))).filter((name) => name !== "—");
    return names.length ? names.join(", ") : t("users.noChildren");
  }
  return user.phone || "";
}

function loginOf(user) {
  const email = String(user.email ?? "");
  return email.endsWith(`@${LOGIN_DOMAIN}`) ? email.slice(0, -LOGIN_DOMAIN.length - 1) : email;
}

function renderToolbar() {
  const toolbar = el("div", { class: "toolbar" });
  toolbar.append(
    tabs(FILTERS, view.filter, (value) => {
      view.filter = value;
      if (value !== "student") view.classId = "";
      render();
    })
  );

  const controls = el("div", { class: "toolbar-row" });
  const search = el("input", {
    class: "input input-search",
    attrs: { type: "search", placeholder: t("common.search"), "aria-label": t("common.search"), value: view.search },
  });
  search.value = view.search;
  search.addEventListener("input", () => {
    view.search = search.value;
    renderList();
  });
  controls.append(el("div", { class: "search-wrap" }, icon("search", "icon input-icon"), search));

  if (view.filter === "student" || view.filter === "all") {
    controls.append(
      selectControl({
        options: store.classes.map((item) => ({ value: item.id, label: item.name })),
        value: view.classId,
        placeholderKey: "users.allClasses",
        label: t("users.field.class"),
        onChange: (value) => {
          view.classId = value;
          renderList();
        },
      })
    );
  }
  toolbar.append(controls);
  return toolbar;
}

function actionButton(iconName, titleKey, onClick, danger = false) {
  return el(
    "button",
    { class: danger ? "icon-btn icon-btn-danger" : "icon-btn", attrs: { type: "button" }, title: titleKey, on: { click: onClick } },
    icon(iconName)
  );
}

let listNode = null;

function renderList() {
  if (!listNode) return;
  clear(listNode);
  const users = filtered();
  if (users.length === 0) return renderEmpty(listNode, { iconName: "users", titleKey: "users.empty" });

  const table = el("div", { class: "data-table", attrs: { role: "table" } });
  table.append(
    el(
      "div",
      { class: "data-row data-head", attrs: { role: "row" } },
      el("span", { i18n: "users.col.name", attrs: { role: "columnheader" } }),
      el("span", { i18n: "users.col.login", attrs: { role: "columnheader" } }),
      el("span", { i18n: "users.col.role", attrs: { role: "columnheader" } }),
      el("span", { i18n: "users.col.details", attrs: { role: "columnheader" } }),
      el("span", { attrs: { role: "columnheader" } })
    )
  );

  for (const user of users) {
    const actions = el("div", { class: "row-actions" });
    if (canEdit(user)) {
      actions.append(
        actionButton("edit", "common.edit", () => editUser(user)),
        actionButton("key", "users.resetPassword", () => resetPassword(user)),
        actionButton("trash", "common.delete", () => deleteUser(user), true)
      );
    }
    table.append(
      el(
        "div",
        { class: user.disabled ? "data-row is-muted" : "data-row", attrs: { role: "row" } },
        el(
          "span",
          { class: "cell-user", attrs: { role: "cell" } },
          el("span", { class: "avatar avatar-sm", text: displayName(user).charAt(0).toUpperCase() }),
          el("span", { class: "cell-title", text: displayName(user) })
        ),
        el("span", { class: "cell-muted cell-mono", text: loginOf(user), attrs: { role: "cell" } }),
        el("span", { attrs: { role: "cell" } }, el("span", { class: `badge role-${user.role ?? "guest"}`, i18n: `role.${user.role ?? "guest"}` })),
        el("span", { class: "cell-muted", text: detailsOf(user), attrs: { role: "cell" } }),
        el("span", { attrs: { role: "cell" } }, actions)
      )
    );
  }

  listNode.append(
    el("p", { class: "list-count", i18n: "users.count", i18nParams: { n: users.length } }),
    table
  );
}

function render() {
  const container = root();
  if (!store.usersOk) return renderLoadError(container);
  clear(container);
  listNode = el("div", { class: "card panel" });
  container.append(renderToolbar(), listNode);
  renderList();
}

/* ---------- Forma maydonlari ---------- */

function studentOptions() {
  return store.users
    .filter((user) => user.role === "student")
    .map((user) => ({ value: user.id, label: `${displayName(user)}${user.classId ? ` · ${className(user.classId)}` : ""}` }));
}

function profileFields(user = {}) {
  return [
    { name: "name", labelKey: "users.field.name", required: true, maxLength: 100, value: user.name, placeholder: "Ali Valiyev" },
    {
      name: "role",
      labelKey: "users.field.role",
      type: "select",
      required: true,
      value: user.role ?? (view.filter === "staff" || view.filter === "all" ? "" : view.filter),
      placeholderKey: "users.chooseRole",
      options: assignable().map((role) => ({ value: role, labelKey: `role.${role}` })),
    },
    {
      name: "classId",
      labelKey: "users.field.class",
      type: "select",
      value: user.classId ?? view.classId,
      placeholderKey: "users.noClass",
      options: store.classes.map((item) => ({ value: item.id, label: item.name })),
      dependsOn: { name: "role", values: ["student"] },
    },
    {
      name: "childIds",
      labelKey: "users.field.children",
      type: "multiselect",
      value: user.childIds ?? [],
      options: studentOptions(),
      dependsOn: { name: "role", values: ["parent"] },
    },
    { name: "phone", labelKey: "users.field.phone", type: "tel", maxLength: 30, value: user.phone, placeholder: "+998 90 123 45 67" },
  ];
}

/* ---------- Amallar ---------- */

function credentialsView(rows) {
  const box = el("div", { class: "credentials" });
  box.append(el("p", { class: "modal-text", i18n: "users.credentials.hint" }));
  for (const row of rows) {
    const text = `${row.name}\n${t("users.col.login")}: ${row.login}\n${t("login.password")}: ${row.password}`;
    box.append(
      el(
        "div",
        { class: "credential-card" },
        el("strong", { text: row.name }),
        el("div", { class: "credential-line" }, el("span", { i18n: "users.col.login" }), el("code", { text: row.login })),
        el("div", { class: "credential-line" }, el("span", { i18n: "login.password" }), el("code", { text: row.password })),
        el("button", {
          class: "btn btn-secondary btn-sm",
          i18n: "common.copy",
          attrs: { type: "button" },
          on: { click: async () => toast(t((await copyText(text)) ? "common.copied" : "common.copyError"), "info", 2000) },
        })
      )
    );
  }
  if (rows.length > 1) {
    box.append(
      el("button", {
        class: "btn btn-primary btn-block",
        i18n: "users.credentials.download",
        attrs: { type: "button" },
        on: { click: () => downloadCredentials(rows) },
      })
    );
  }
  return box;
}

function downloadCredentials(rows) {
  downloadCsv(`36-school-logins-${new Date().toISOString().slice(0, 10)}.csv`, [
    [t("users.col.name"), t("users.field.class"), t("users.col.login"), t("login.password")],
    ...rows.map((row) => [row.name, row.className ?? "", row.login, row.password]),
  ]);
}

const shortLogin = (email) => (email.endsWith(`@${LOGIN_DOMAIN}`) ? email.slice(0, -LOGIN_DOMAIN.length - 1) : email);

async function addUser() {
  let created = null;
  const saved = await openFormModal({
    titleKey: "users.new",
    fields: [
      ...profileFields(),
      { name: "identity", labelKey: "users.field.identity", hintKey: "users.field.identityHint", maxLength: 120, autocomplete: "off" },
      { name: "password", labelKey: "users.field.password", type: "password", hintKey: "users.field.passwordHint", autocomplete: "new-password" },
    ],
    onSubmit: async (values) => {
      const identity = values.identity
        ? splitIdentity(values.identity)
        : { login: uniqueLogin(toLogin(values.name), takenEmails()) };
      created = await api("/users", {
        method: "POST",
        body: { name: values.name, role: values.role, classId: values.classId, childIds: values.childIds, phone: values.phone, password: values.password || undefined, ...identity },
      });
    },
  });
  if (!saved || !created) return;
  toast(t("toast.saved"), "success");
  await reload();
  infoDialog({
    titleKey: "users.credentials.title",
    build: () => credentialsView([{ name: created.name, login: shortLogin(created.email), password: created.password }]),
  });
}

async function editUser(user) {
  const saved = await openFormModal({
    titleKey: "users.edit",
    fields: profileFields(user),
    onSubmit: async (values) => {
      await api(`/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        body: { name: values.name, role: values.role, classId: values.classId ?? "", childIds: values.childIds ?? [], phone: values.phone },
      });
    },
  });
  if (!saved) return;
  toast(t("toast.saved"), "success");
  reload();
}

async function resetPassword(user) {
  const ok = await confirmDialog({
    titleKey: "users.resetPassword",
    messageKey: "users.resetConfirm",
    messageParams: { name: displayName(user) },
    confirmKey: "users.resetPassword",
    danger: false,
  });
  if (!ok) return;
  try {
    const { password } = await api(`/users/${encodeURIComponent(user.id)}/password`, { method: "POST" });
    infoDialog({
      titleKey: "users.credentials.title",
      build: () => credentialsView([{ name: displayName(user), login: loginOf(user), password }]),
    });
  } catch (error) {
    toast(t(error.i18nKey ?? "api.error.generic"), "error");
  }
}

async function deleteUser(user) {
  const ok = await confirmDialog({ messageKey: "users.deleteConfirm", messageParams: { name: displayName(user) } });
  if (!ok) return;
  try {
    await api(`/users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
    toast(t("toast.deleted"), "success");
    reload();
  } catch (error) {
    toast(t(error.i18nKey ?? "api.error.generic"), "error");
  }
}

/* Ommaviy qo'shish: har qatorda bitta ism */
async function bulkImport() {
  let results = null;
  let bulkClassId = "";
  const saved = await openFormModal({
    titleKey: "users.bulk.title",
    descriptionKey: "users.bulk.description",
    submitKey: "users.bulk.submit",
    fields: [
      {
        name: "role",
        labelKey: "users.field.role",
        type: "select",
        required: true,
        value: "student",
        options: assignable().filter((role) => ["student", "teacher", "parent"].includes(role)).map((role) => ({ value: role, labelKey: `role.${role}` })),
      },
      {
        name: "classId",
        labelKey: "users.field.class",
        type: "select",
        value: view.classId,
        placeholderKey: "users.noClass",
        options: store.classes.map((item) => ({ value: item.id, label: item.name })),
        dependsOn: { name: "role", values: ["student"] },
      },
      { name: "names", labelKey: "users.bulk.names", type: "textarea", rows: 8, required: true, maxLength: 20000, placeholder: "Ali Valiyev\nMadina Karimova\n..." },
    ],
    onSubmit: async ({ role, classId, names }) => {
      const list = [...new Set(names.split(/\r?\n/).map((line) => line.trim().replace(/\s+/g, " ")).filter(Boolean))];
      if (list.length > 300) throw Object.assign(new Error("too-many"), { i18nKey: "users.bulk.tooMany" });
      const taken = takenEmails();
      const users = list.map((name) => ({ name, role, classId: classId ?? "", login: uniqueLogin(toLogin(name), taken) }));
      bulkClassId = role === "student" ? classId ?? "" : "";
      const response = await api("/users/bulk", { method: "POST", body: { users } });
      results = response.results;
    },
  });
  if (!saved || !results) return;

  const okRows = results.filter((row) => row.ok);
  const failed = results.length - okRows.length;
  toast(t("users.bulk.done", { ok: okRows.length, failed }), failed ? "info" : "success", 8000);
  await reload();
  if (okRows.length) {
    infoDialog({
      titleKey: "users.credentials.title",
      build: () =>
        credentialsView(
          okRows.map((row) => ({ name: row.name, login: shortLogin(row.email), password: row.password, className: classById(bulkClassId)?.name }))
        ),
    });
  }
}

async function reload() {
  await loadUsers();
  render();
  notifyDataChanged();
}

export function renderUsers() {
  render();
}

export function showUsersLoading() {
  renderSkeleton(root());
}

export function initUsers() {
  byId("addUserBtn").addEventListener("click", addUser);
  byId("bulkUserBtn").addEventListener("click", bulkImport);
}

export function resetUsers() {
  Object.assign(view, { filter: "all", classId: "", search: "" });
  listNode = null;
  clear(root());
}
