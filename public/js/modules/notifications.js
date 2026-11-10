import { schoolDB } from "../data-store.js";
import { byId, el, clear, icon } from "../ui.js";
import { t } from "../i18n.js";

export function initNotifications() {
  const bellBtn = byId("notificationBtn");
  const notifDropdown = byId("notificationDropdown");
  const notifList = byId("notificationList");
  const badge = byId("notificationBadge");
  const markAllBtn = byId("notifMarkAllBtn");

  function renderList() {
    const notifications = schoolDB.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;

    if (badge) {
      badge.textContent = String(unreadCount);
      badge.hidden = unreadCount === 0;
    }

    if (!notifList) return;
    clear(notifList);

    if (notifications.length === 0) {
      notifList.append(el("p", { class: "notif-empty text-muted", text: t("notifications.empty") }));
      return;
    }

    notifications.forEach((item) => {
      const row = el(
        "div",
        { class: `notif-item ${item.read ? "notif-read" : "notif-unread"}` },
        el("div", { class: "notif-icon-box" }, icon(item.type === "homework" ? "homework" : item.type === "attendance" ? "attendance" : "announcements")),
        el(
          "div",
          { class: "notif-content" },
          el("h4", { class: "notif-title", text: item.title }),
          el("p", { class: "notif-msg", text: item.message }),
          el("span", { class: "notif-time text-muted", text: item.time })
        ),
        !item.read ? el("span", { class: "notif-unread-dot" }) : null
      );
      notifList.append(row);
    });
  }

  if (bellBtn && notifDropdown) {
    bellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = notifDropdown.hidden;
      notifDropdown.hidden = !isHidden;
      if (isHidden) renderList();
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.hidden && !notifDropdown.contains(e.target)) {
        notifDropdown.hidden = true;
      }
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      schoolDB.markNotificationsRead();
      renderList();
    });
  }

  renderList();
}
