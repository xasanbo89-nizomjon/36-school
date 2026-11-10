import { schoolDB } from "../data-store.js";
import { getUser, getRole, updateUserProfile, can } from "../auth.js";
import { t } from "../i18n.js";
import { byId, toast, notifyDataChanged } from "../ui.js";

export function renderSettings() {
  const user = getUser();
  const school = schoolDB.getSchoolInfo();

  // Profil maydonlari
  const nameInput = byId("settingsProfileName");
  const emailInput = byId("settingsProfileEmail");
  const phoneInput = byId("settingsProfilePhone");

  if (nameInput) nameInput.value = user?.displayName || user?.name || "Foydalanuvchi";
  if (emailInput) emailInput.value = user?.email || "";
  if (phoneInput) phoneInput.value = user?.phone || "+998 90 123-45-67";

  // Maktab maydonlari
  const schName = byId("settingsSchoolName");
  const schDirector = byId("settingsSchoolDirector");
  const schPhone = byId("settingsSchoolPhone");
  const schAddress = byId("settingsSchoolAddress");

  if (schName) schName.value = school.name;
  if (schDirector) schDirector.value = school.director;
  if (schPhone) schPhone.value = school.phone;
  if (schAddress) schAddress.value = school.region;

  // Agar oddiy o'quvchi yoki ota-ona bo'lsa, maktab sozlamalarini disabled qilish
  const canEditSchool = can("settings:write");
  [schName, schDirector, schPhone, schAddress].forEach((inp) => {
    if (inp) inp.disabled = !canEditSchool;
  });
}

export function initSettings() {
  byId("saveProfileSettingsBtn")?.addEventListener("click", () => {
    const name = byId("settingsProfileName")?.value.trim();
    const phone = byId("settingsProfilePhone")?.value.trim();
    if (name) {
      updateUserProfile({ name, displayName: name, phone });
      toast(t("settings.saved"), "success");
    }
  });

  byId("saveSchoolSettingsBtn")?.addEventListener("click", () => {
    if (!can("settings:write")) {
      return toast("Faqat maktab rahbariyati o'zgartira oladi", "error");
    }
    const name = byId("settingsSchoolName")?.value.trim();
    const director = byId("settingsSchoolDirector")?.value.trim();
    const phone = byId("settingsSchoolPhone")?.value.trim();
    const region = byId("settingsSchoolAddress")?.value.trim();

    schoolDB.updateSchoolInfo({ name, director, phone, region });
    toast(t("settings.saved"), "success");
    notifyDataChanged();
  });
}

export async function loadSettings() {
  renderSettings();
}

export function resetSettings() {
  // ready
}
