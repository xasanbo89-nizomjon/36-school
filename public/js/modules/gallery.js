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
  toHttpsUrl,
  renderEmpty,
  notifyDataChanged,
} from "../ui.js";

const container = () => byId("galleryContainer");

function openLightbox(item) {
  const overlay = el("div", { class: "lightbox-overlay" });
  const content = el(
    "div",
    { class: "lightbox-content" },
    el("button", { class: "icon-btn lightbox-close", attrs: { type: "button" } }, icon("x")),
    el("img", { attrs: { src: item.image, alt: item.title, class: "lightbox-img" } }),
    el("div", { class: "lightbox-caption" }, el("h3", { text: item.title }), el("p", { class: "text-muted", text: item.date }))
  );

  overlay.append(content);

  const close = () => {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 180);
  };

  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", esc);
    }
  });

  document.body.append(overlay);
}

export function renderGallery() {
  const root = container();
  if (!root) return;

  const items = schoolDB.getGallery();

  if (items.length === 0) {
    return renderEmpty(root, { iconName: "gallery", hintKey: can("gallery:write") ? "empty.hint.add" : null });
  }

  clear(root);

  for (const item of items) {
    const card = el(
      "figure",
      {
        class: "card gallery-card gallery-card-hover",
        on: { click: () => openLightbox(item) },
      },
      el("div", { class: "gallery-img-wrap" },
        el("img", {
          attrs: {
            src: item.image,
            alt: item.title ?? "",
            loading: "lazy",
            referrerpolicy: "no-referrer",
            class: "gallery-img",
          },
        }),
        el("div", { class: "gallery-overlay-hint" }, icon("sparkles"), el("span", { text: "Ko'rish" }))
      ),
      el(
        "figcaption",
        { class: "gallery-caption" },
        el("span", { class: "item-title", text: item.title ?? "" }),
        can("gallery:write")
          ? el(
              "button",
              {
                class: "icon-btn icon-btn-danger gallery-delete-btn",
                attrs: { type: "button" },
                title: "common.delete",
                on: {
                  click: (e) => {
                    e.stopPropagation();
                    deleteImage(item);
                  },
                },
              },
              icon("trash")
            )
          : null
      )
    );

    root.append(card);
  }
}

export async function loadGallery() {
  renderGallery();
}

function addImage() {
  return openFormModal({
    titleKey: "gallery.new",
    fields: [
      { name: "title", labelKey: "gallery.field.title", type: "text", required: true, maxLength: 100, placeholder: "Maktab tadbiri" },
      { name: "image", labelKey: "gallery.field.url", type: "url", required: true, maxLength: 2000, placeholder: "https://images.unsplash.com/..." },
      { name: "category", labelKey: "gallery.field.category", type: "text", value: "Tadbir" },
    ],
    onSubmit: async ({ title, image, category }) => {
      schoolDB.addGalleryImage({ title, image, category });
      toast(t("toast.saved"), "success");
      loadGallery();
      notifyDataChanged();
    },
  });
}

async function deleteImage(item) {
  const ok = await confirmDialog({
    titleKey: "common.delete",
    message: t("gallery.confirmDelete"),
    confirmKey: "common.delete",
    danger: true,
  });
  if (!ok) return;

  schoolDB.deleteGalleryImage(item.id);
  toast(t("toast.deleted"), "info");
  loadGallery();
  notifyDataChanged();
}

export function initGallery() {
  byId("addGalleryBtn")?.addEventListener("click", addImage);
}

export function resetGallery() {
  // ready
}
