import { auth, db, addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp } from "../firebase.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import { store, loadClasses, studentsOf, teachers, displayName, userById } from "../data.js";
import {
  byId, el, clear, icon, toast, confirmDialog, openFormModal, infoDialog, renderEmpty, renderLoadError,
  renderSkeleton, notifyDataChanged,
} from "../ui.js";

const container = () => byId("classesContainer");

function homeroomName(item) {
  if (item.homeroomTeacherId) return displayName(userById(item.homeroomTeacherId)) || item.homeroomTeacherName || "";
  return item.homeroomTeacherName || item.teacher || "";
}

/* Eski yozuvlarda o'quvchilar soni qo'lda kiritilgan; yangi tizimda — users dan hisoblanadi */
export function studentCount(item) {
  const real = studentsOf(item.id).length;
  return real || Number(item.students) || 0;
}

function renderClasses() {
  const root = container();
  if (!store.classesOk) return renderLoadError(root);
  if (store.classes.length === 0) {
    return renderEmpty(root, { iconName: "classes", hintKey: can("classes:write") ? "empty.hint.add" : null });
  }

  clear(root);
  for (const item of store.classes) {
    const teacher = homeroomName(item);
    const card = el(
      "article",
      { class: "card item-card item-card-click", attrs: { tabindex: "0", role: "button" } },
      el("div", { class: "item-icon item-icon-text", text: String(item.name ?? "").slice(0, 4) }),
      el(
        "div",
        { class: "item-main" },
        el("h3", { class: "item-title", text: item.name ?? "" }),
        el("p", { class: "item-sub", text: teacher || t("classes.noHomeroom") }),
        el("span", { class: "pill" }, el("span", { i18n: "classes.students", i18nParams: { n: studentCount(item) } }))
      )
    );
    const open = () => showRoster(item);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    if (can("classes:write")) {
      const actions = el(
        "div",
        { class: "row-actions" },
        el("button", { class: "icon-btn", attrs: { type: "button" }, title: "common.edit", on: { click: (e) => (e.stopPropagation(), editClass(item)) } }, icon("edit")),
        el("button", { class: "icon-btn icon-btn-danger", attrs: { type: "button" }, title: "common.delete", on: { click: (e) => (e.stopPropagation(), deleteClass(item)) } }, icon("trash"))
      );
      card.append(actions);
    }
    root.append(card);
  }
}

function showRoster(item) {
  const students = studentsOf(item.id);
  infoDialog({
    titleKey: "classes.roster",
    build: () => {
      const box = el("div", { class: "roster" });
      box.append(el("p", { class: "modal-text" }, el("strong", { text: item.name }), document.createTextNode(` · ${homeroomName(item) || t("classes.noHomeroom")}`)));
      if (students.length === 0) {
        box.append(el("p", { class: "field-hint", i18n: "classes.noStudents" }));
      } else {
        const list = el("ol", { class: "roster-list" });
        students.forEach((student) => list.append(el("li", { text: displayName(student) })));
        box.append(list);
      }
      return box;
    },
  });
}

function classFields(item = {}) {
  return [
    { name: "name", labelKey: "classes.field.name", required: true, maxLength: 60, placeholder: "7-A", value: item.name },
    {
      name: "homeroomTeacherId",
      labelKey: "classes.field.homeroom",
      type: "select",
      value: item.homeroomTeacherId ?? "",
      placeholderKey: "classes.noHomeroom",
      options: teachers().map((user) => ({ value: user.id, label: displayName(user) })),
    },
  ];
}

function payload({ name, homeroomTeacherId }) {
  const teacher = userById(homeroomTeacherId);
  return {
    name,
    homeroomTeacherId: homeroomTeacherId || "",
    homeroomTeacherName: teacher ? displayName(teacher) : "",
  };
}

async function afterChange(messageKey) {
  toast(t(messageKey), "success");
  await loadClasses();
  renderClasses();
  notifyDataChanged();
}

async function addClass() {
  const saved = await openFormModal({
    titleKey: "classes.new",
    fields: classFields(),
    onSubmit: async (values) => {
      await addDoc(collection(db, "classes"), {
        ...payload(values),
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    },
  });
  if (saved) afterChange("toast.saved");
}

async function editClass(item) {
  const saved = await openFormModal({
    titleKey: "classes.edit",
    fields: classFields(item),
    onSubmit: async (values) => {
      await updateDoc(doc(db, "classes", item.id), { ...payload(values), updatedAt: serverTimestamp() });
    },
  });
  if (saved) afterChange("toast.saved");
}

async function deleteClass(item) {
  const count = studentsOf(item.id).length;
  const confirmed = await confirmDialog({
    messageKey: count ? "classes.deleteWithStudents" : "confirm.deleteNamed",
    messageParams: { name: item.name, n: count },
  });
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "classes", item.id));
  } catch (error) {
    console.error(error);
    return toast(t("common.deleteError"), "error");
  }
  afterChange("toast.deleted");
}

export function renderClassesSection() {
  renderClasses();
}

export function showClassesLoading() {
  renderSkeleton(container());
}

export function initClasses() {
  byId("addClassBtn").addEventListener("click", addClass);
}

export function resetClasses() {
  clear(container());
}
