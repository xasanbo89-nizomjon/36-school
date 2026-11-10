import { schoolDB } from "../data-store.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import { byId, el, clear, icon, toast, openFormModal, renderEmpty, notifyDataChanged } from "../ui.js";

const container = () => byId("announcementsContainer");

export function renderAnnouncements() {
  const root = container();
  if (!root) return;

  const items = schoolDB.getAnnouncements();

  if (items.length === 0) {
    return renderEmpty(root, { iconName: "announcements" });
  }

  clear(root);

  for (const item of items) {
    const card = el(
      "article",
      { class: `card announcement-card ${item.important ? "announcement-card-important" : ""}` },
      el(
        "div",
        { class: "announcement-header" },
        el("div", { class: "announcement-tags" },
          item.important ? el("span", { class: "badge-pill badge-important", text: t("announcements.important") }) : null,
          el("span", { class: "badge-pill badge-category", text: item.categoryName || "E'lon" })
        ),
        el("span", { class: "announcement-date text-muted", text: item.date })
      ),
      el("h2", { class: "announcement-title", text: item.title }),
      el("p", { class: "announcement-content", text: item.content }),
      el(
        "div",
        { class: "announcement-footer" },
        el("span", { class: "announcement-author text-muted", text: `✍️ ${item.author || "Maktab ma'muriyati"}` }),
        el("span", { class: "announcement-views text-muted", text: t("announcements.views", { n: item.views || 100 }) })
      )
    );

    root.append(card);
  }
}

export async function loadAnnouncements() {
  renderAnnouncements();
}

function addAnnouncementModal() {
  openFormModal({
    titleKey: "announcements.new",
    fields: [
      { name: "title", labelKey: "announcements.fieldTitle", type: "text", required: true, maxLength: 150, placeholder: "Olimpiada natijalari..." },
      { name: "categoryName", labelKey: "announcements.fieldCategory", type: "text", value: "Tadbir" },
      { name: "content", labelKey: "announcements.fieldContent", type: "textarea", required: true, maxLength: 1000, placeholder: "E'lon to'liq matni..." },
    ],
    onSubmit: async (values) => {
      schoolDB.addAnnouncement(values);
      toast(t("toast.saved"), "success");
      loadAnnouncements();
      notifyDataChanged();
    },
  });
}

export function initAnnouncements() {
  byId("addAnnouncementBtn")?.addEventListener("click", addAnnouncementModal);
}

export function resetAnnouncements() {
  // ready
}
