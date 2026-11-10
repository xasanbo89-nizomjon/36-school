import { schoolDB } from "../data-store.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import { byId, el, clear, icon, toast, openFormModal, renderEmpty, notifyDataChanged } from "../ui.js";

let searchQuery = "";

const container = () => byId("teachersContainer");

export function renderTeachers() {
  const root = container();
  if (!root) return;

  let items = schoolDB.getTeachers();

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter((tch) => tch.name.toLowerCase().includes(q) || tch.subject.toLowerCase().includes(q));
  }

  if (items.length === 0) {
    return renderEmpty(root, { iconName: "teachers" });
  }

  clear(root);

  for (const tch of items) {
    const card = el(
      "article",
      { class: "card teacher-card" },
      el(
        "div",
        { class: "teacher-card-top" },
        el("div", { class: "teacher-avatar-circle" }, el("span", { text: tch.avatar || tch.name[0] })),
        el(
          "div",
          { class: "teacher-info-head" },
          el("h3", { class: "teacher-name font-semibold", text: tch.name }),
          el("p", { class: "teacher-subject text-primary font-medium", text: tch.subject }),
          el("span", { class: "badge-pill badge-category", text: tch.category || "Oliy toifa" })
        )
      ),
      el(
        "div",
        { class: "teacher-details-list" },
        el("div", { class: "teacher-detail-item" }, icon("classes"), el("span", { text: t("teachers.room", { r: tch.room }) })),
        el("div", { class: "teacher-detail-item" }, icon("attendance"), el("span", { text: t("teachers.hours", { h: tch.hours }) })),
        el("div", { class: "teacher-detail-item" }, icon("mail"), el("span", { text: t("teachers.phone", { p: tch.phone }) }))
      )
    );

    root.append(card);
  }
}

export async function loadTeachers() {
  renderTeachers();
}

function addTeacherModal() {
  openFormModal({
    titleKey: "teachers.new",
    fields: [
      { name: "name", labelKey: "teachers.fieldName", type: "text", required: true, maxLength: 80, placeholder: "Dilnoza Rahimova" },
      { name: "subject", labelKey: "teachers.fieldSubject", type: "text", required: true, placeholder: "Matematika" },
      { name: "category", labelKey: "teachers.fieldCategory", type: "text", value: "Oliy toifa" },
      { name: "room", labelKey: "teachers.fieldRoom", type: "text", placeholder: "304" },
      { name: "phone", labelKey: "teachers.fieldPhone", type: "text", placeholder: "+998 90 123-45-67" },
    ],
    onSubmit: async (values) => {
      schoolDB.addTeacher(values);
      toast(t("toast.saved"), "success");
      loadTeachers();
      notifyDataChanged();
    },
  });
}

export function initTeachers() {
  byId("addTeacherBtn")?.addEventListener("click", addTeacherModal);

  byId("teachersSearchInput")?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderTeachers();
  });
}

export function resetTeachers() {
  searchQuery = "";
}
