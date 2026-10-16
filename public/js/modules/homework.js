import { auth, db, addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp, listDocs, where } from "../firebase.js";
import { can, getRole, getProfile } from "../auth.js";
import { STAFF } from "../config.js";
import { t } from "../i18n.js";
import {
  store, queryDocs, visibleClassIds, className, subjectById, classById, displayName, userById, isoDate, addDays, parseIso,
} from "../data.js";
import {
  byId, el, clear, icon, toast, confirmDialog, openFormModal, renderEmpty, renderLoadError, renderSkeleton,
  selectControl, tabs, notifyDataChanged,
} from "../ui.js";

export const homeworkState = { items: [], ok: false };
const view = { classId: "", when: "upcoming" };

const container = () => byId("homeworkContainer");
const isStaff = () => STAFF.includes(getRole());

function canModify(item) {
  if (can("homework:deleteAny")) return true;
  return getRole() === "teacher" && item.createdBy === auth.currentUser?.uid;
}

/* Muddat holati: overdue / today / tomorrow / later / none */
function dueState(dueDate) {
  if (!dueDate) return "none";
  const today = isoDate();
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  if (dueDate === isoDate(addDays(new Date(), 1))) return "tomorrow";
  return "later";
}

function dueLabel(item) {
  const state = dueState(item.dueDate);
  if (state === "none") return null;
  const date = parseIso(item.dueDate);
  const text = state === "later" || state === "overdue"
    ? `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`
    : t(`homework.due.${state}`);
  return el("span", { class: `due-badge due-${state}` }, icon("clock", "icon icon-sm"), el("span", { text }));
}

function visibleItems() {
  const today = isoDate();
  return homeworkState.items
    .filter((item) => !view.classId || item.classId === view.classId)
    .filter((item) => {
      if (view.when === "all") return true;
      return !item.dueDate || item.dueDate >= today;
    })
    .sort((a, b) => String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999")));
}

function renderToolbar() {
  const bar = el("div", { class: "toolbar-row" });
  bar.append(
    tabs(
      [
        { value: "upcoming", labelKey: "homework.filter.upcoming" },
        { value: "all", labelKey: "homework.filter.all" },
      ],
      view.when,
      (value) => {
        view.when = value;
        renderHomework();
      }
    )
  );
  const classIds = visibleClassIds();
  if (classIds.length > 1) {
    bar.append(
      selectControl({
        options: classIds.map((id) => ({ value: id, label: className(id) })),
        value: view.classId,
        placeholderKey: "users.allClasses",
        label: t("users.field.class"),
        onChange: (value) => {
          view.classId = value;
          renderHomework();
        },
      })
    );
  }
  return bar;
}

function renderHomework() {
  const root = container();
  if (!homeworkState.ok) return renderLoadError(root);
  clear(root);
  root.append(renderToolbar());

  const list = el("div", { class: "card-grid" });
  root.append(list);
  const items = visibleItems();
  if (items.length === 0) {
    return renderEmpty(list, { iconName: "homework", titleKey: "homework.empty", hintKey: can("homework:write") ? "empty.hint.add" : null });
  }

  for (const item of items) {
    const subject = subjectById(item.subjectId)?.name ?? item.subjectName;
    const klass = item.classId ? className(item.classId) : item.className;
    const author = displayName(userById(item.createdBy)) !== "—" ? displayName(userById(item.createdBy)) : item.createdByName;

    const card = el(
      "article",
      { class: `card hw-card due-border-${dueState(item.dueDate)}` },
      el(
        "div",
        { class: "hw-top" },
        el("div", { class: "badge-row" }, subject ? el("span", { class: "pill", text: subject }) : null, klass && klass !== "—" ? el("span", { class: "pill pill-muted", text: klass }) : null),
        dueLabel(item)
      ),
      el("h3", { class: "item-title item-title-wrap", text: item.title ?? "" }),
      item.description ? el("p", { class: "hw-desc", text: item.description }) : null,
      author ? el("p", { class: "item-sub" }, icon("user", "icon icon-sm"), el("span", { text: author })) : null
    );

    if (canModify(item)) {
      card.append(
        el(
          "div",
          { class: "row-actions hw-actions" },
          el("button", { class: "icon-btn", attrs: { type: "button" }, title: "common.edit", on: { click: () => editHomework(item) } }, icon("edit")),
          el("button", { class: "icon-btn icon-btn-danger", attrs: { type: "button" }, title: "common.delete", on: { click: () => deleteHomework(item) } }, icon("trash"))
        )
      );
    }
    list.append(card);
  }
}

export async function loadHomework() {
  renderSkeleton(container());
  try {
    if (isStaff()) {
      homeworkState.items = await listDocs("homework");
    } else {
      const lists = await Promise.all(visibleClassIds().map((id) => queryDocs("homework", where("classId", "==", id))));
      homeworkState.items = lists.flat();
    }
    homeworkState.ok = true;
  } catch (error) {
    console.error("Vazifalarni yuklab bo'lmadi:", error);
    homeworkState.items = [];
    homeworkState.ok = false;
  }
  renderHomework();
}

function fields(item = {}) {
  return [
    {
      name: "classId",
      labelKey: "users.field.class",
      type: "select",
      required: true,
      value: item.classId ?? view.classId,
      placeholderKey: "journal.chooseClass",
      options: store.classes.map((klass) => ({ value: klass.id, label: klass.name })),
    },
    {
      name: "subjectId",
      labelKey: "schedule.field.subject",
      type: "select",
      required: true,
      value: item.subjectId ?? "",
      placeholderKey: "journal.chooseSubject",
      options: store.subjects.map((subject) => ({ value: subject.id, label: subject.name })),
    },
    { name: "title", labelKey: "homework.field.title", required: true, maxLength: 200, value: item.title, placeholder: "§12, 1–5-mashqlar" },
    { name: "description", labelKey: "homework.field.description", type: "textarea", maxLength: 2000, value: item.description },
    { name: "dueDate", labelKey: "homework.field.due", type: "date", value: item.dueDate ?? isoDate(addDays(new Date(), 1)) },
  ];
}

function payload(values) {
  return {
    title: values.title,
    description: values.description ?? "",
    classId: values.classId,
    className: classById(values.classId)?.name ?? "",
    subjectId: values.subjectId,
    subjectName: subjectById(values.subjectId)?.name ?? "",
    dueDate: values.dueDate ?? "",
  };
}

async function after(key) {
  toast(t(key), "success");
  await loadHomework();
  notifyDataChanged();
}

async function addHomework() {
  if (store.classes.length === 0 || store.subjects.length === 0) return toast(t("journal.setupFirst"), "info", 6000);
  const saved = await openFormModal({
    titleKey: "homework.new",
    fields: fields(),
    onSubmit: async (values) => {
      await addDoc(collection(db, "homework"), {
        ...payload(values),
        createdBy: auth.currentUser.uid,
        createdByName: getProfile()?.name || auth.currentUser.email || "",
        createdAt: serverTimestamp(),
      });
    },
  });
  if (saved) after("toast.saved");
}

async function editHomework(item) {
  const saved = await openFormModal({
    titleKey: "homework.edit",
    fields: fields(item),
    onSubmit: async (values) => updateDoc(doc(db, "homework", item.id), payload(values)),
  });
  if (saved) after("toast.saved");
}

async function deleteHomework(item) {
  const confirmed = await confirmDialog({ messageParams: { name: item.title } });
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "homework", item.id));
  } catch (error) {
    console.error(error);
    return toast(t("common.deleteError"), "error");
  }
  after("toast.deleted");
}

export function initHomework() {
  byId("addHomeworkBtn").addEventListener("click", addHomework);
}

export function resetHomework() {
  homeworkState.items = [];
  homeworkState.ok = false;
  Object.assign(view, { classId: "", when: "upcoming" });
  clear(container());
}
