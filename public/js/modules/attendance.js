import { schoolDB } from "../data-store.js";
import { can, getRole, getUser } from "../auth.js";
import { t } from "../i18n.js";
import {
  byId,
  el,
  clear,
  toast,
  notifyDataChanged,
  renderEmpty,
  icon,
} from "../ui.js";

let selectedClass = "9-A";
let selectedDate = new Date().toISOString().slice(0, 10);
let currentRecords = {};

export function validPercent(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0 && num <= 100 ? num : null;
}

export function levelFor(percent) {
  if (percent >= 95) return "good";
  if (percent >= 85) return "mid";
  return "low";
}

function initAttendanceControls() {
  const classSelect = byId("attClassSelect");
  const dateInput = byId("attDateInput");
  const markAllBtn = byId("attMarkAllBtn");
  const saveBtn = byId("attSaveBtn");

  if (classSelect) {
    const classes = schoolDB.getClasses();
    clear(classSelect);
    classes.forEach((c) => {
      const opt = el("option", { attrs: { value: c.name }, text: `${c.name} sinfi (${c.teacher || "Rahbar"})` });
      if (c.name === selectedClass) opt.selected = true;
      classSelect.append(opt);
    });

    classSelect.addEventListener("change", (e) => {
      selectedClass = e.target.value;
      loadClassRollCall();
    });
  }

  if (dateInput) {
    dateInput.value = selectedDate;
    dateInput.addEventListener("change", (e) => {
      selectedDate = e.target.value;
      loadClassRollCall();
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      const students = schoolDB.getStudents(selectedClass);
      students.forEach((st) => {
        currentRecords[st.id] = "present";
      });
      renderRollCallList();
      toast(t("attendance.markAllPresent") + " ✓", "info");
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const saved = schoolDB.saveDailyAttendance(selectedClass, selectedDate, currentRecords);
      toast(t("attendance.savedSuccess", { className: selectedClass, percent: saved.stats.percent }), "success");
      notifyDataChanged();
      renderAttendanceSummary();
    });
  }
}

function loadClassRollCall() {
  const saved = schoolDB.getDailyAttendance(selectedClass, selectedDate);
  const students = schoolDB.getStudents(selectedClass);

  currentRecords = {};
  if (saved && saved.records) {
    currentRecords = { ...saved.records };
  } else {
    // Standart: barchasi bor
    students.forEach((st) => {
      currentRecords[st.id] = "present";
    });
  }

  renderRollCallList();
}

function renderRollCallList() {
  const root = byId("attendanceRollCallContainer");
  if (!root) return;

  const students = schoolDB.getStudents(selectedClass);
  clear(root);

  if (students.length === 0) {
    return renderEmpty(root, { iconName: "attendance" });
  }

  let presentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;
  let absentCount = 0;

  students.forEach((st, idx) => {
    const status = currentRecords[st.id] || "present";
    if (status === "present") presentCount++;
    else if (status === "late") lateCount++;
    else if (status === "excused") excusedCount++;
    else if (status === "absent") absentCount++;

    const createStatusBtn = (type, label, colorClass) => {
      const isSelected = status === type;
      return el(
        "button",
        {
          class: `att-pill-btn ${isSelected ? `att-pill-selected ${colorClass}` : ""}`,
          attrs: { type: "button" },
          on: {
            click: () => {
              currentRecords[st.id] = type;
              renderRollCallList();
            },
          },
        },
        label
      );
    };

    const row = el(
      "div",
      { class: "att-student-row" },
      el(
        "div",
        { class: "att-student-info" },
        el("span", { class: "att-student-num", text: String(idx + 1) }),
        el("span", { class: "student-avatar-inline", text: st.name[0] }),
        el(
          "div",
          {},
          el("span", { class: "att-student-name font-semibold", text: st.name }),
          el("span", { class: "att-student-parent text-muted", text: `Tel: ${st.parentPhone}` })
        )
      ),
      el(
        "div",
        { class: "att-student-actions" },
        createStatusBtn("present", "✓ Bor", "att-green"),
        createStatusBtn("late", "⏱ Kechikdi", "att-amber"),
        createStatusBtn("excused", "📋 Sababli", "att-blue"),
        createStatusBtn("absent", "✗ Yo'q", "att-red")
      )
    );

    root.append(row);
  });

  // Jonli hisob-kitob vidjeti
  const total = students.length || 1;
  const currentPercent = Math.round(((presentCount + lateCount) / total) * 1000) / 10;

  const statLive = byId("attLiveStats");
  if (statLive) {
    statLive.innerHTML = `
      <div class="att-live-grid">
        <div class="att-stat-item att-stat-green"><span>Bor:</span> <strong>${presentCount}</strong></div>
        <div class="att-stat-item att-stat-amber"><span>Kechikkan:</span> <strong>${lateCount}</strong></div>
        <div class="att-stat-item att-stat-blue"><span>Sababli:</span> <strong>${excusedCount}</strong></div>
        <div class="att-stat-item att-stat-red"><span>Yo'q:</span> <strong>${absentCount}</strong></div>
        <div class="att-stat-item att-stat-main"><span>Davomat:</span> <strong>${currentPercent}%</strong></div>
      </div>
    `;
  }
}

function renderAttendanceSummary() {
  const root = byId("attendanceContainer");
  if (!root) return;

  const items = schoolDB.getAttendanceSummary();
  clear(root);

  for (const item of items) {
    const percent = validPercent(item.percent);
    const level = percent === null ? "low" : levelFor(percent);

    const bar = el("div", { class: `progress level-${level}` }, el("span", { class: "progress-fill" }));
    bar.firstChild.style.width = `${percent ?? 0}%`;

    const card = el(
      "article",
      {
        class: "card item-card item-card-column card-clickable",
        on: {
          click: () => {
            selectedClass = item.className;
            const selectEl = byId("attClassSelect");
            if (selectEl) selectEl.value = item.className;
            loadClassRollCall();
            window.scrollTo({ top: 300, behavior: "smooth" });
          },
        },
      },
      el(
        "div",
        { class: "item-row" },
        el("h3", { class: "item-title", text: `${item.className} sinfi` }),
        el("span", { class: `badge-pill level-${level}`, text: percent === null ? "—" : `${percent}%` })
      ),
      bar
    );

    root.append(card);
  }
}

export async function loadAttendance() {
  initAttendanceControls();
  loadClassRollCall();
  renderAttendanceSummary();
}

export function initAttendance() {
  // Main start
}

export function resetAttendance() {
  currentRecords = {};
}
