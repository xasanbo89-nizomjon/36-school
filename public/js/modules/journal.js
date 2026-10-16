import { auth, db, doc, writeBatch, serverTimestamp, where } from "../firebase.js";
import { getRole } from "../auth.js";
import { GRADES, ATTENDANCE_STATUSES, GRADE_TYPES } from "../config.js";
import { t } from "../i18n.js";
import {
  store, queryDocs, studentsOf, className, subjectName, displayName, isoDate, parseIso, weekdayOf,
} from "../data.js";
import {
  byId, el, clear, icon, toast, renderEmpty, renderLoadError, renderSkeleton, selectControl, tabs, setLoading,
  downloadCsv, notifyDataChanged,
} from "../ui.js";

/* ID = sana_sinf_fan_o'quvchi (firestore.rules shuni tekshiradi) */
export const entryId = (date, classId, subjectId, studentId) => `${date}_${classId}_${subjectId}_${studentId}`;

const STATUS_ICON = { present: "check", late: "clock", excused: "info", absent: "x" };

const view = { mode: "lesson", classId: "", subjectId: "", date: isoDate(), month: isoDate().slice(0, 7), gradeType: "daily" };
let rows = []; // [{ student, status, grade, comment, dirty }]
let todayLessons = [];
let dirty = false;

const container = () => byId("journalContainer");

/* ---------- Yuklash ---------- */

async function loadTodayLessons() {
  try {
    const mine = await queryDocs("lessons", where("teacherId", "==", auth.currentUser.uid));
    const today = weekdayOf(parseIso(view.date));
    todayLessons = mine.filter((lesson) => lesson.weekday === today).sort((a, b) => a.period - b.period);
  } catch (error) {
    console.error(error);
    todayLessons = [];
  }
}

async function loadLesson() {
  const body = byId("journalBody");
  if (!view.classId || !view.subjectId) {
    renderEmpty(body, { iconName: "journal", titleKey: "journal.pick" });
    return;
  }
  renderSkeleton(body, { count: 4 });

  const students = studentsOf(view.classId);
  try {
    const entries = await queryDocs(
      "journal",
      where("classId", "==", view.classId),
      where("subjectId", "==", view.subjectId),
      where("date", "==", view.date)
    );
    const byStudent = new Map(entries.map((entry) => [entry.studentId, entry]));
    rows = students.map((student) => {
      const entry = byStudent.get(student.id);
      return {
        student,
        status: entry?.status ?? "present",
        grade: entry?.grade ?? null,
        comment: entry?.comment ?? "",
        saved: Boolean(entry),
      };
    });
    const firstType = entries.find((entry) => entry.gradeType)?.gradeType;
    if (firstType) view.gradeType = firstType;
    dirty = false;
    renderLesson();
  } catch (error) {
    console.error("Jurnalni yuklab bo'lmadi:", error);
    renderLoadError(body);
  }
}

/* ---------- Dars rejimi ---------- */

function segment(row, value, update) {
  const active = row.status === value;
  return el(
    "button",
    {
      class: `seg seg-${value}${active ? " active" : ""}`,
      title: `status.${value}`,
      attrs: { type: "button", "aria-pressed": String(active) },
      on: { click: () => update(value) },
    },
    icon(STATUS_ICON[value], "icon icon-sm")
  );
}

function renderRow(row, index) {
  const line = el("div", { class: "journal-row" });

  const draw = () => {
    clear(line);
    line.classList.toggle("is-absent", row.status === "absent");

    const statusGroup = el("div", { class: "segmented", attrs: { role: "group", "aria-label": t("journal.attendance") } });
    for (const status of ATTENDANCE_STATUSES) {
      statusGroup.append(
        segment(row, status, (value) => {
          row.status = value;
          if (value === "absent") row.grade = null;
          markDirty();
          draw();
        })
      );
    }

    const gradeGroup = el("div", { class: "grade-picker", attrs: { role: "group", "aria-label": t("journal.grade") } });
    for (const grade of GRADES) {
      const active = row.grade === grade;
      gradeGroup.append(
        el("button", {
          class: `grade-btn grade-${grade}${active ? " active" : ""}`,
          text: String(grade),
          attrs: { type: "button", "aria-pressed": String(active) },
          on: {
            click: () => {
              row.grade = active ? null : grade;
              markDirty();
              draw();
            },
          },
        })
      );
    }
    if (row.status === "absent") gradeGroup.querySelectorAll("button").forEach((button) => (button.disabled = true));

    const comment = el("input", {
      class: "input input-sm",
      attrs: { type: "text", maxlength: "200", placeholder: t("journal.comment"), "aria-label": t("journal.comment") },
    });
    comment.value = row.comment;
    comment.addEventListener("input", () => {
      row.comment = comment.value;
      markDirty();
    });

    line.append(
      el("span", { class: "journal-num", text: String(index + 1) }),
      el("span", { class: "journal-name", text: displayName(row.student) }),
      statusGroup,
      gradeGroup,
      comment
    );
  };

  draw();
  return line;
}

function markDirty() {
  dirty = true;
  const button = byId("journalSave");
  if (button) button.classList.add("pulse");
  const stats = byId("journalStats");
  if (stats) stats.replaceWith(statsBar());
}

function statsBar() {
  const { counts, avg } = summary();
  return el(
    "div",
    { class: "journal-stats", attrs: { id: "journalStats", "aria-live": "polite" } },
    ...ATTENDANCE_STATUSES.map((status) =>
      el("span", { class: `stat-chip chip-${status}` }, icon(STATUS_ICON[status], "icon icon-sm"), el("span", { text: `${t(`status.${status}`)}: ${counts[status]}` }))
    ),
    el("span", { class: "stat-chip" }, el("span", { text: `${t("journal.avg")}: ${avg}` }))
  );
}

function summary() {
  const counts = Object.fromEntries(ATTENDANCE_STATUSES.map((status) => [status, 0]));
  rows.forEach((row) => counts[row.status]++);
  const grades = rows.map((row) => row.grade).filter(Boolean);
  const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "—";
  return { counts, avg, graded: grades.length };
}

function renderLesson() {
  const body = byId("journalBody");
  clear(body);

  if (rows.length === 0) {
    renderEmpty(body, { iconName: "users", titleKey: "journal.noStudents", hintKey: "journal.noStudentsHint" });
    return;
  }

  const head = el(
    "div",
    { class: "journal-head" },
    statsBar(),
    el(
      "div",
      { class: "toolbar-row" },
      selectControl({
        options: GRADE_TYPES.map((type) => ({ value: type, labelKey: `gradeType.${type}` })),
        value: view.gradeType,
        label: t("journal.gradeType"),
        onChange: (value) => {
          view.gradeType = value;
          markDirty();
        },
      }),
      el("button", {
        class: "btn btn-secondary",
        i18n: "journal.allPresent",
        attrs: { type: "button" },
        on: {
          click: () => {
            rows.forEach((row) => (row.status = "present"));
            markDirty();
            renderLesson();
          },
        },
      })
    )
  );

  const list = el("div", { class: "journal-list" });
  rows.forEach((row, index) => list.append(renderRow(row, index)));

  const saveBtn = el(
    "button",
    { class: "btn btn-primary btn-lg", attrs: { type: "button", id: "journalSave" }, on: { click: save } },
    icon("check"),
    el("span", { i18n: "journal.save" })
  );
  if (dirty) saveBtn.classList.add("pulse");

  body.append(head, list, el("div", { class: "journal-footer" }, el("span", { class: "field-hint", i18n: "journal.saveHint" }), saveBtn));
}

async function save() {
  const button = byId("journalSave");
  setLoading(button, true);
  try {
    const batch = writeBatch(db);
    for (const row of rows) {
      const data = {
        studentId: row.student.id,
        classId: view.classId,
        subjectId: view.subjectId,
        date: view.date,
        status: row.status,
        teacherId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };
      if (row.grade) {
        data.grade = row.grade;
        data.gradeType = view.gradeType;
      }
      const comment = row.comment.trim().slice(0, 200);
      if (comment) data.comment = comment;
      batch.set(doc(db, "journal", entryId(view.date, view.classId, view.subjectId, row.student.id)), data);
    }
    await batch.commit();
    dirty = false;
    toast(t("journal.saved"), "success");
    notifyDataChanged();
    renderLesson();
  } catch (error) {
    console.error(error);
    toast(t("common.saveError"), "error");
    setLoading(button, false);
  }
}

/* ---------- Oylik jurnal ---------- */

async function loadMonth() {
  const body = byId("journalBody");
  if (!view.classId || !view.subjectId) {
    renderEmpty(body, { iconName: "journal", titleKey: "journal.pick" });
    return;
  }
  renderSkeleton(body, { count: 3 });

  const start = `${view.month}-01`;
  const end = `${view.month}-31`;
  try {
    const entries = await queryDocs(
      "journal",
      where("classId", "==", view.classId),
      where("subjectId", "==", view.subjectId),
      where("date", ">=", start),
      where("date", "<=", end)
    );
    renderMonth(entries);
  } catch (error) {
    console.error("Oylik jurnal:", error);
    renderLoadError(body);
    if (String(error?.message).includes("index")) body.append(el("p", { class: "field-hint", i18n: "journal.indexHint" }));
  }
}

function cellText(entry) {
  if (!entry) return "";
  if (entry.status === "absent") return t("status.short.absent");
  if (entry.grade) return String(entry.grade);
  if (entry.status === "late") return t("status.short.late");
  if (entry.status === "excused") return t("status.short.excused");
  return "·";
}

function renderMonth(entries) {
  const body = byId("journalBody");
  clear(body);

  const students = studentsOf(view.classId);
  const dates = [...new Set(entries.map((entry) => entry.date))].sort();
  if (students.length === 0 || dates.length === 0) {
    renderEmpty(body, { iconName: "journal", titleKey: "journal.monthEmpty" });
    return;
  }

  const index = new Map(entries.map((entry) => [`${entry.studentId}_${entry.date}`, entry]));
  const table = el("table", { class: "grid-table" });
  const headRow = el("tr", {}, el("th", { class: "sticky-col", i18n: "users.col.name" }));
  dates.forEach((date) => headRow.append(el("th", { text: date.slice(8) })));
  headRow.append(el("th", { i18n: "journal.avg" }), el("th", { i18n: "journal.absences" }));
  table.append(el("thead", {}, headRow));

  const tbody = el("tbody");
  const csv = [[t("users.col.name"), ...dates, t("journal.avg"), t("journal.absences")]];
  for (const student of students) {
    const tr = el("tr", {}, el("th", { class: "sticky-col", text: displayName(student) }));
    const grades = [];
    let absences = 0;
    const csvRow = [displayName(student)];
    for (const date of dates) {
      const entry = index.get(`${student.id}_${date}`);
      if (entry?.grade) grades.push(entry.grade);
      if (entry?.status === "absent") absences++;
      const text = cellText(entry);
      csvRow.push(text);
      tr.append(
        el("td", {
          class: entry?.grade ? `grade-cell grade-${entry.grade}` : entry?.status === "absent" ? "grade-cell is-absent" : "grade-cell",
          text,
          attrs: entry?.comment ? { title: entry.comment } : {},
        })
      );
    }
    const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "—";
    tr.append(el("td", { class: "grade-cell strong", text: avg }), el("td", { class: "grade-cell", text: String(absences) }));
    csvRow.push(avg, absences);
    csv.push(csvRow);
    tbody.append(tr);
  }
  table.append(tbody);

  body.append(
    el(
      "div",
      { class: "toolbar-row toolbar-end" },
      el(
        "button",
        {
          class: "btn btn-secondary",
          attrs: { type: "button" },
          on: { click: () => downloadCsv(`jurnal-${className(view.classId)}-${subjectName(view.subjectId)}-${view.month}.csv`, csv) },
        },
        icon("download"),
        el("span", { i18n: "common.exportCsv" })
      )
    ),
    el("div", { class: "table-scroll" }, table)
  );
}

/* ---------- Boshqaruv paneli ---------- */

function renderControls() {
  const root = container();
  clear(root);

  const controls = el("div", { class: "card panel journal-controls" });
  controls.append(
    tabs(
      [
        { value: "lesson", labelKey: "journal.mode.lesson" },
        { value: "month", labelKey: "journal.mode.month" },
      ],
      view.mode,
      (mode) => {
        if (dirty && !confirm(t("journal.unsaved"))) return;
        view.mode = mode;
        renderControls();
      }
    )
  );

  if (view.mode === "lesson" && todayLessons.length) {
    const chips = el("div", { class: "lesson-chips" }, el("span", { class: "field-hint", i18n: "journal.todayLessons" }));
    for (const lesson of todayLessons) {
      const active = lesson.classId === view.classId && lesson.subjectId === view.subjectId;
      chips.append(
        el("button", {
          class: active ? "chip active" : "chip",
          text: `${lesson.period}. ${className(lesson.classId)} · ${subjectName(lesson.subjectId)}`,
          attrs: { type: "button" },
          on: {
            click: () => {
              view.classId = lesson.classId;
              view.subjectId = lesson.subjectId;
              renderControls();
            },
          },
        })
      );
    }
    controls.append(chips);
  }

  const onPick = (key) => (value) => {
    if (dirty && !confirm(t("journal.unsaved"))) return renderControls();
    view[key] = value;
    refreshBody();
  };

  const row = el("div", { class: "toolbar-row" });
  row.append(
    selectControl({
      options: store.classes.map((item) => ({ value: item.id, label: item.name })),
      value: view.classId,
      placeholderKey: "journal.chooseClass",
      label: t("users.field.class"),
      onChange: onPick("classId"),
    }),
    selectControl({
      options: store.subjects.map((item) => ({ value: item.id, label: item.name })),
      value: view.subjectId,
      placeholderKey: "journal.chooseSubject",
      label: t("schedule.field.subject"),
      onChange: onPick("subjectId"),
    })
  );

  if (view.mode === "lesson") {
    const date = el("input", { class: "select", attrs: { type: "date", max: isoDate(), "aria-label": t("journal.date") } });
    date.value = view.date;
    date.addEventListener("change", async () => {
      if (!date.value) return;
      if (dirty && !confirm(t("journal.unsaved"))) {
        date.value = view.date;
        return;
      }
      view.date = date.value;
      await loadTodayLessons();
      renderControls();
    });
    row.append(date);
  } else {
    const month = el("input", { class: "select", attrs: { type: "month", "aria-label": t("journal.month") } });
    month.value = view.month;
    month.addEventListener("change", () => {
      if (!month.value) return;
      view.month = month.value;
      refreshBody();
    });
    row.append(month);
  }
  controls.append(row);

  root.append(controls, el("div", { class: "journal-body", attrs: { id: "journalBody" } }));
  refreshBody();
}

function refreshBody() {
  if (view.mode === "lesson") loadLesson();
  else loadMonth();
}

export async function loadJournal() {
  if (store.subjects.length === 0 || store.classes.length === 0) {
    clear(container());
    renderEmpty(container(), { iconName: "journal", titleKey: "journal.setupFirst" });
    return;
  }
  await loadTodayLessons();

  // O'qituvchi uchun: hozirgi (yoki keyingi) darsni avtomatik tanlash
  if (!view.classId && todayLessons.length && getRole() === "teacher") {
    view.classId = todayLessons[0].classId;
    view.subjectId = todayLessons[0].subjectId;
  }
  renderControls();
}

export function initJournal() {
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
}

export function resetJournal() {
  Object.assign(view, { mode: "lesson", classId: "", subjectId: "", date: isoDate(), month: isoDate().slice(0, 7), gradeType: "daily" });
  rows = [];
  todayLessons = [];
  dirty = false;
  clear(container());
}
