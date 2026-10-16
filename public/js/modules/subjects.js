import { auth, db, addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp } from "../firebase.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import { store, loadSubjects } from "../data.js";
import { byId, el, clear, icon, toast, confirmDialog, openFormModal, renderEmpty, renderLoadError, notifyDataChanged } from "../ui.js";

const container = () => byId("subjectsContainer");

/* Tez boshlash uchun tayyor ro'yxat */
const DEFAULT_SUBJECTS = [
  "Ona tili", "Adabiyot", "Matematika", "Algebra", "Geometriya", "Ingliz tili", "Rus tili", "Tarix",
  "Geografiya", "Biologiya", "Kimyo", "Fizika", "Informatika", "Jismoniy tarbiya", "Tarbiya", "Musiqa", "Tasviriy san'at",
];

function render() {
  const root = container();
  if (!store.subjectsOk) return renderLoadError(root);
  clear(root);

  if (store.subjects.length === 0) {
    renderEmpty(root, { iconName: "book", titleKey: "subjects.empty" });
    if (can("subjects:write")) {
      root.append(
        el("div", { class: "center-row" }, el("button", { class: "btn btn-secondary", i18n: "subjects.addDefaults", attrs: { type: "button" }, on: { click: addDefaults } }))
      );
    }
    return;
  }

  const list = el("div", { class: "chip-grid" });
  for (const subject of store.subjects) {
    const chip = el("div", { class: "card subject-chip" }, icon("book"), el("span", { class: "item-title", text: subject.name }));
    if (can("subjects:write")) {
      chip.append(
        el(
          "div",
          { class: "row-actions" },
          el("button", { class: "icon-btn", attrs: { type: "button" }, title: "common.edit", on: { click: () => editSubject(subject) } }, icon("edit")),
          el("button", { class: "icon-btn icon-btn-danger", attrs: { type: "button" }, title: "common.delete", on: { click: () => deleteSubject(subject) } }, icon("trash"))
        )
      );
    }
    list.append(chip);
  }
  root.append(list);
}

async function refresh(messageKey) {
  toast(t(messageKey), "success");
  await loadSubjects();
  render();
  notifyDataChanged();
}

const exists = (name, exceptId = null) =>
  store.subjects.some((item) => item.id !== exceptId && item.name.trim().toLowerCase() === name.trim().toLowerCase());

const duplicateError = () => Object.assign(new Error("duplicate"), { i18nKey: "subjects.duplicate" });

async function addSubject() {
  const saved = await openFormModal({
    titleKey: "subjects.new",
    fields: [{ name: "name", labelKey: "subjects.field.name", required: true, maxLength: 60, placeholder: "Matematika" }],
    onSubmit: async ({ name }) => {
      if (exists(name)) throw duplicateError();
      await addDoc(collection(db, "subjects"), { name, createdBy: auth.currentUser.uid, createdAt: serverTimestamp() });
    },
  });
  if (saved) refresh("toast.saved");
}

async function addDefaults() {
  try {
    await Promise.all(
      DEFAULT_SUBJECTS.filter((name) => !exists(name)).map((name) =>
        addDoc(collection(db, "subjects"), { name, createdBy: auth.currentUser.uid, createdAt: serverTimestamp() })
      )
    );
    refresh("toast.saved");
  } catch (error) {
    console.error(error);
    toast(t("common.saveError"), "error");
  }
}

async function editSubject(subject) {
  const saved = await openFormModal({
    titleKey: "subjects.edit",
    fields: [{ name: "name", labelKey: "subjects.field.name", required: true, maxLength: 60, value: subject.name }],
    onSubmit: async ({ name }) => {
      if (exists(name, subject.id)) throw duplicateError();
      await updateDoc(doc(db, "subjects", subject.id), { name });
    },
  });
  if (saved) refresh("toast.saved");
}

async function deleteSubject(subject) {
  const ok = await confirmDialog({ messageParams: { name: subject.name } });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "subjects", subject.id));
    refresh("toast.deleted");
  } catch (error) {
    console.error(error);
    toast(t("common.deleteError"), "error");
  }
}

export function renderSubjects() {
  render();
}

export function initSubjects() {
  byId("addSubjectBtn").addEventListener("click", addSubject);
}

export function resetSubjects() {
  clear(container());
}
