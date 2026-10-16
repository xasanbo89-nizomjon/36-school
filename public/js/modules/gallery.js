import {
  auth,
  db,
  addDoc,
  deleteDoc,
  collection,
  doc,
  serverTimestamp,
  listDocs,
} from "../firebase.js";
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
  renderLoadError,
  renderSkeleton,
} from "../ui.js";

export const galleryState = { items: [], ok: false };

const container = () => byId("galleryContainer");

function renderGallery() {
  const root = container();
  if (!galleryState.ok) return renderLoadError(root);

  // Eski yozuvlar orasida https bo'lmagan manzillar bo'lishi mumkin — ular ko'rsatilmaydi
  const visible = galleryState.items
    .map((item) => ({ ...item, safeUrl: toHttpsUrl(item.image) }))
    .filter((item) => item.safeUrl);

  if (visible.length === 0) {
    return renderEmpty(root, { iconName: "gallery", hintKey: can("gallery:write") ? "empty.hint.add" : null });
  }

  clear(root);
  for (const item of visible) {
    const card = el(
      "figure",
      { class: "card gallery-card" },
      el("img", {
        attrs: {
          src: item.safeUrl,
          alt: item.title ?? "",
          loading: "lazy",
          referrerpolicy: "no-referrer",
        },
      }),
      el("figcaption", { class: "gallery-caption" }, el("span", { class: "item-title", text: item.title ?? "" }))
    );

    if (can("gallery:write")) {
      card.lastChild.append(
        el(
          "button",
          { class: "icon-btn icon-btn-danger", attrs: { type: "button" }, title: "common.delete", on: { click: () => deleteImage(item) } },
          icon("trash")
        )
      );
    }
    root.append(card);
  }
}

export async function loadGallery() {
  renderSkeleton(container(), { count: 3 });
  try {
    galleryState.items = await listDocs("gallery");
    galleryState.ok = true;
  } catch (error) {
    console.error("Galereyani yuklab bo'lmadi:", error);
    galleryState.items = [];
    galleryState.ok = false;
  }
  renderGallery();
}

function addImage() {
  return openFormModal({
    titleKey: "gallery.new",
    fields: [
      { name: "title", labelKey: "gallery.field.title", type: "text", required: true, maxLength: 100 },
      { name: "image", labelKey: "gallery.field.url", type: "url", required: true, maxLength: 2000, placeholder: "https://" },
    ],
    onSubmit: async ({ title, image }) => {
      await addDoc(collection(db, "gallery"), {
        title,
        image,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    },
  }).then((saved) => {
    if (!saved) return;
    toast(t("toast.saved"), "success");
    loadGallery();
  });
}

async function deleteImage(item) {
  const confirmed = await confirmDialog({ messageParams: { name: item.title } });
  if (!confirmed) return;
  try {
    await deleteDoc(doc(db, "gallery", item.id));
  } catch (error) {
    console.error(error);
    return toast(t("common.deleteError"), "error");
  }
  toast(t("toast.deleted"), "success");
  loadGallery();
}

export function initGallery() {
  byId("addGalleryBtn").addEventListener("click", addImage);
}

export function resetGallery() {
  galleryState.items = [];
  galleryState.ok = false;
  clear(container());
}
