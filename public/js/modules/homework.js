import { schoolDB } from "../data-store.js";
import { can, getRole, getUser } from "../auth.js";
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

const container = () => byId("homeworkContainer");

function canDelete(item) {
  if (can("homework:deleteAny")) return true;
  return getRole() === "teacher";
}

function calculateDueStatus(dueDateStr) {
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffHours = (due - now) / (1000 * 60 * 60);

  if (diffHours < 0) return { label: "Muddati o'tgan", color: "hw-expired" };
  if (diffHours <= 24) return { label: "Ertagacha", color: "hw-urgent" };
  if (diffHours <= 72) return { label: "2-3 kun ichida", color: "hw-soon" };
  return { label: dueDateStr, color: "hw-normal" };
}

export function renderHomework() {
  const root = container();
  if (!root) return;

  const user = getUser();
  const items = schoolDB.getHomework();

  if (items.length === 0) {
    return renderEmpty(root, { iconName: "homework", hintKey: can("homework:write") ? "empty.hint.add" : null });
  }

  clear(root);

  for (const item of items) {
    const isCompleted = (item.completedBy || []).includes(user?.uid || "st-9a-1");
    const dueInfo = calculateDueStatus(item.dueDate);

    const card = el(
      "article",
      { class: `card hw-card ${isCompleted ? "hw-card-done" : ""}` },
      el(
        "div",
        { class: "hw-header" },
        el("div", { class: "hw-subject-badge", text: item.subject || "Umumiy" }),
        el("span", { class: "hw-class-pill", text: `${item.className} sinfi` })
      ),
      el("h3", { class: "hw-title", text: item.title }),
      el(
        "div",
        { class: "hw-meta-row" },
        el("span", { class: `hw-due-pill ${dueInfo.color}` }, icon("attendance"), el("span", { text: t("homework.dueDate", { date: item.dueDate }) })),
        item.teacher ? el("span", { class: "hw-teacher text-muted", text: `Ustoz: ${item.teacher}` }) : null
      ),
      el(
        "div",
        { class: "hw-actions" },
        el(
          "button",
          {
            class: `btn btn-sm ${isCompleted ? "btn-success" : "btn-secondary"} btn-flex`,
            attrs: { type: "button" },
            on: {
              click: () => {
                schoolDB.toggleHomeworkCompleted(item.id, user?.uid || "st-9a-1");
                toast(isCompleted ? "Qaytarildi" : "Vazifa bajarildi deb belgilandi! 🎉", "success");
                renderHomework();
                notifyDataChanged();
              },
            },
          },
          icon("check"),
          el("span", { text: isCompleted ? t("homework.done") : t("homework.markDone") })
        ),
        canDelete(item)
          ? el(
              "button",
              {
                class: "icon-btn icon-btn-danger",
                attrs: { type: "button" },
                title: "common.delete",
                on: { click: () => deleteHomework(item) },
              },
              icon("trash")
            )
          : null
      )
    );

    root.append(card);
  }
}

export async function loadHomework() {
  renderHomework();
}

function addHomework() {
  const classes = schoolDB.getClasses();
  return openFormModal({
    titleKey: "homework.new",
    fields: [
      { name: "className", labelKey: "homework.field.class", type: "text", required: true, maxLength: 60, placeholder: "9-A" },
      { name: "subject", labelKey: "homework.field.subject", type: "text", required: true, placeholder: "Algebra" },
      { name: "title", labelKey: "homework.field.title", type: "textarea", required: true, maxLength: 300, placeholder: "Vazifa matni va darslikdagi betlar..." },
      { name: "dueDate", labelKey: "homework.field.dueDate", type: "text", placeholder: "YYYY-MM-DD", value: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10) },
    ],
    onSubmit: async ({ title, className, subject, dueDate }) => {
      schoolDB.addHomework({ title, className, subject, dueDate });
      toast(t("toast.saved"), "success");
      loadHomework();
      notifyDataChanged();
    },
  });
}

async function deleteHomework(item) {
  const ok = await confirmDialog({
    titleKey: "common.delete",
    message: t("homework.confirmDelete"),
    confirmKey: "common.delete",
    danger: true,
  });
  if (!ok) return;

  schoolDB.deleteHomework(item.id);
  toast(t("toast.deleted"), "info");
  loadHomework();
  notifyDataChanged();
}

export function initHomework() {
  byId("addHomeworkBtn")?.addEventListener("click", addHomework);
}

export function resetHomework() {
  // ready
}
