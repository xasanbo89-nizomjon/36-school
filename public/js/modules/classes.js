import { schoolDB } from "../data-store.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import {
  byId,
  el,
  clear,
  icon,
  toast,
  confirmDialog,
  openFormModal,
  renderEmpty,
  notifyDataChanged,
} from "../ui.js";

let activeFilter = "all";
let searchQuery = "";

const container = () => byId("classesContainer");

/* Sinf o'quvchilari ro'yxati modali */
function openStudentRosterModal(cls) {
  const students = schoolDB.getStudents(cls.name);
  const title = t("students.modalTitle", { className: cls.name });

  const body = el("div", { class: "students-modal-content" });

  const topRow = el(
    "div",
    { class: "students-modal-top" },
    el("div", { class: "students-count-badge", text: `${students.length} nafar o'quvchi ro'yxatda` }),
    can("classes:write")
      ? el(
          "button",
          {
            class: "btn btn-sm btn-primary",
            attrs: { type: "button" },
            on: { click: () => addNewStudentModal(cls, () => openStudentRosterModal(cls)) },
          },
          icon("plus"),
          el("span", { text: t("students.add") })
        )
      : null
  );

  const tableWrap = el("div", { class: "table-responsive mt-3" });
  const table = el(
    "table",
    { class: "data-table" },
    el(
      "thead",
      {},
      el(
        "tr",
        {},
        el("th", { text: "#" }),
        el("th", { text: t("students.name") }),
        el("th", { text: t("students.parent") }),
        el("th", { text: t("students.phone") }),
        el("th", { text: t("students.rating") })
      )
    )
  );

  const tbody = el("tbody");
  if (students.length === 0) {
    tbody.append(
      el(
        "tr",
        {},
        el("td", { attrs: { colspan: 5, style: "text-align: center; padding: 2rem;" }, text: t("common.noData") })
      )
    );
  } else {
    students.forEach((st, idx) => {
      tbody.append(
        el(
          "tr",
          { class: "table-row-hover" },
          el("td", { class: "text-muted", text: String(idx + 1) }),
          el(
            "td",
            { class: "font-semibold" },
            el("span", { class: "student-avatar-inline", text: st.name[0] }),
            st.name
          ),
          el("td", { text: st.parentName || "—" }),
          el("td", { class: "text-muted", text: st.parentPhone || "—" }),
          el(
            "td",
            {},
            el("span", { class: `badge-rating ${st.rating >= 4.8 ? "rating-high" : "rating-mid"}`, text: `${st.rating} ⭐` })
          )
        )
      );
    });
  }

  table.append(tbody);
  tableWrap.append(table);
  body.append(topRow, tableWrap);

  // Standart modal orqali ochish
  const closeBtn = el("button", { class: "icon-btn", attrs: { type: "button" }, title: "common.close" }, icon("x"));
  const dialog = el(
    "div",
    { class: "modal modal-lg", attrs: { role: "dialog", "aria-modal": "true" } },
    el("div", { class: "modal-header" }, el("h2", { class: "modal-title", text: title }), closeBtn),
    body
  );
  const overlay = el("div", { class: "modal-overlay" }, dialog);

  const close = () => {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 150);
  };
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) close();
  });
  document.body.append(overlay);
}

function addNewStudentModal(cls, onDone) {
  openFormModal({
    titleKey: "students.newTitle",
    fields: [
      { name: "name", labelKey: "students.fieldName", type: "text", required: true, maxLength: 80, placeholder: "Ali Valiyev" },
      { name: "parentName", labelKey: "students.fieldParent", type: "text", maxLength: 80, placeholder: "Vali Karimov" },
      { name: "parentPhone", labelKey: "students.fieldPhone", type: "text", maxLength: 30, placeholder: "+998 90 123-45-67" },
      { name: "rating", labelKey: "students.fieldRating", type: "number", min: 1, max: 5, placeholder: "5.0" },
    ],
    onSubmit: async ({ name, parentName, parentPhone, rating }) => {
      schoolDB.addStudent({
        className: cls.name,
        classId: cls.id,
        name,
        parentName,
        parentPhone,
        rating: Number(rating) || 5.0,
      });
      toast(t("toast.saved"), "success");
      notifyDataChanged();
      loadClasses();
      onDone?.();
    },
  });
}

function renderClasses() {
  const root = container();
  if (!root) return;

  let items = schoolDB.getClasses();

  // Filtr
  if (activeFilter === "primary") {
    items = items.filter((c) => c.gradeLevel >= 1 && c.gradeLevel <= 4);
  } else if (activeFilter === "middle") {
    items = items.filter((c) => c.gradeLevel >= 5 && c.gradeLevel <= 9);
  } else if (activeFilter === "high") {
    items = items.filter((c) => c.gradeLevel >= 10 && c.gradeLevel <= 11);
  }

  // Qidiruv
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q) || (c.teacher && c.teacher.toLowerCase().includes(q)));
  }

  if (items.length === 0) {
    return renderEmpty(root, { iconName: "classes", hintKey: can("classes:write") ? "empty.hint.add" : null });
  }

  clear(root);

  for (const item of items) {
    const students = Number(item.students) || 0;
    const card = el(
      "article",
      { class: "card class-item-card" },
      el(
        "div",
        { class: "class-card-head" },
        el("div", { class: "class-badge-icon" }, el("span", { class: "class-name-badge", text: item.name })),
        el("div", { class: "class-shift-pill", text: `${item.shift || 1}-smena` })
      ),
      el(
        "div",
        { class: "class-card-body" },
        el(
          "div",
          { class: "class-meta-row" },
          el("span", { class: "class-meta-label", text: t("classes.teacher") + ":" }),
          el("span", { class: "class-meta-value font-medium", text: item.teacher || "Belgilanmagan" })
        ),
        el(
          "div",
          { class: "class-meta-row" },
          el("span", { class: "class-meta-label", text: t("classes.room") + ":" }),
          el("span", { class: "class-meta-value", text: `${item.room || 101}-xona` })
        ),
        el(
          "div",
          { class: "class-meta-row" },
          el("span", { class: "class-meta-label", text: "O'quvchilar:" }),
          el("span", { class: "class-meta-value text-primary font-semibold", text: `${students} nafar` })
        )
      ),
      el(
        "div",
        { class: "class-card-actions" },
        el(
          "button",
          {
            class: "btn btn-sm btn-secondary btn-flex",
            attrs: { type: "button" },
            on: { click: () => openStudentRosterModal(item) },
          },
          icon("classes"),
          el("span", { text: t("classes.viewStudents") })
        ),
        can("classes:write")
          ? el(
              "button",
              {
                class: "icon-btn icon-btn-danger",
                attrs: { type: "button" },
                title: "common.delete",
                on: { click: () => deleteClass(item) },
              },
              icon("trash")
            )
          : null
      )
    );

    root.append(card);
  }
}

export async function loadClasses() {
  renderClasses();
}

function addClass() {
  return openFormModal({
    titleKey: "classes.new",
    fields: [
      { name: "name", labelKey: "classes.field.name", type: "text", required: true, maxLength: 60, placeholder: "7-A" },
      { name: "teacher", labelKey: "classes.field.teacher", type: "text", maxLength: 80, placeholder: "Zilola Karimova" },
      { name: "students", labelKey: "classes.field.students", type: "number", required: true, integer: true, min: 0, max: 60, value: "30" },
      { name: "room", labelKey: "classes.field.room", type: "text", maxLength: 30, placeholder: "204" },
      { name: "shift", labelKey: "classes.field.shift", type: "number", min: 1, max: 2, value: "1" },
    ],
    onSubmit: async (values) => {
      schoolDB.addClass(values);
      toast(t("toast.saved"), "success");
      loadClasses();
      notifyDataChanged();
    },
  });
}

async function deleteClass(item) {
  const ok = await confirmDialog({
    titleKey: "common.delete",
    message: t("classes.confirmDelete", { name: item.name }),
    confirmKey: "common.delete",
    danger: true,
  });
  if (!ok) return;

  schoolDB.deleteClass(item.id);
  toast(t("toast.deleted"), "info");
  loadClasses();
  notifyDataChanged();
}

export function initClasses() {
  byId("addClassBtn")?.addEventListener("click", addClass);

  // Filtr tugmalari
  document.querySelectorAll(".js-class-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".js-class-filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      renderClasses();
    });
  });

  // Qidiruv maydoni
  byId("classesSearchInput")?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderClasses();
  });
}

export function resetClasses() {
  activeFilter = "all";
  searchQuery = "";
}
