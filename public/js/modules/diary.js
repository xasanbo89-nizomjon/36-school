import { where } from "../firebase.js";
import { WEEKDAYS } from "../config.js";
import { t } from "../i18n.js";
import {
  queryDocs, familyStudents, className, subjectName, subjectById, displayName, isoDate, weekStart, addDays, parseIso,
} from "../data.js";
import { byId, el, clear, icon, renderEmpty, renderLoadError, renderSkeleton, selectControl } from "../ui.js";
import { BELLS } from "./schedule.js";

const view = { studentId: "", week: weekStart() };
const container = () => byId("diaryContainer");

const STATUS_ICON = { late: "clock", excused: "info", absent: "x" };

export function currentStudent() {
  const students = familyStudents();
  return students.find((student) => student.id === view.studentId) ?? students[0] ?? null;
}

function formatDay(date) {
  return `${t(`weekday.${((date.getDay() + 6) % 7) + 1}`)}, ${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function renderControls(student) {
  const bar = el("div", { class: "toolbar-row diary-controls" });
  const students = familyStudents();

  if (students.length > 1) {
    bar.append(
      selectControl({
        options: students.map((item) => ({ value: item.id, label: displayName(item) })),
        value: student.id,
        label: t("diary.child"),
        onChange: (value) => {
          view.studentId = value;
          loadDiary();
        },
      })
    );
  }

  const shift = (days) => () => {
    view.week = addDays(view.week, days);
    loadDiary();
  };
  const end = addDays(view.week, 5);
  bar.append(
    el(
      "div",
      { class: "week-nav" },
      el("button", { class: "icon-btn", attrs: { type: "button" }, title: "diary.prevWeek", on: { click: shift(-7) } }, icon("chevron-left")),
      el("span", { class: "week-label", text: `${view.week.getDate()}.${String(view.week.getMonth() + 1).padStart(2, "0")} — ${end.getDate()}.${String(end.getMonth() + 1).padStart(2, "0")}` }),
      el("button", { class: "icon-btn", attrs: { type: "button" }, title: "diary.nextWeek", on: { click: shift(7) } }, icon("chevron-right")),
      el("button", {
        class: "btn btn-secondary btn-sm",
        i18n: "diary.thisWeek",
        attrs: { type: "button" },
        on: {
          click: () => {
            view.week = weekStart();
            loadDiary();
          },
        },
      })
    )
  );
  return bar;
}

function entryBadges(entry) {
  if (!entry) return [];
  const items = [];
  if (entry.grade) items.push(el("span", { class: `grade-badge grade-${entry.grade}`, text: String(entry.grade), title: `gradeType.${entry.gradeType ?? "daily"}` }));
  if (entry.status && entry.status !== "present") {
    items.push(el("span", { class: `stat-chip chip-${entry.status}` }, icon(STATUS_ICON[entry.status], "icon icon-sm"), el("span", { i18n: `status.${entry.status}` })));
  }
  return items;
}

export async function loadDiary() {
  const root = container();
  const student = currentStudent();
  if (!student) return renderEmpty(root, { iconName: "diary", titleKey: "diary.noChild" });
  view.studentId = student.id;

  clear(root);
  root.append(
    el(
      "div",
      { class: "diary-student card" },
      el("span", { class: "avatar", text: displayName(student).charAt(0).toUpperCase() }),
      el("div", {}, el("strong", { text: displayName(student) }), el("p", { class: "item-sub", text: student.classId ? className(student.classId) : t("users.noClass") }))
    ),
    renderControls(student)
  );
  const body = el("div", { class: "diary-week" });
  root.append(body);

  if (!student.classId) return renderEmpty(body, { iconName: "diary", titleKey: "diary.noClass" });
  renderSkeleton(body, { count: 3 });

  const start = isoDate(view.week);
  const end = isoDate(addDays(view.week, 6));
  try {
    const [lessons, entries, homework] = await Promise.all([
      queryDocs("lessons", where("classId", "==", student.classId)),
      queryDocs("journal", where("studentId", "==", student.id), where("date", ">=", start), where("date", "<=", end)),
      queryDocs("homework", where("classId", "==", student.classId)),
    ]);
    renderWeek(body, { lessons, entries, homework });
  } catch (error) {
    console.error("Kundalikni yuklab bo'lmadi:", error);
    renderLoadError(body);
  }
}

function renderWeek(body, { lessons, entries, homework }) {
  clear(body);
  const today = isoDate();

  // Hafta xulosasi
  const grades = entries.map((entry) => entry.grade).filter(Boolean);
  const absent = entries.filter((entry) => entry.status === "absent").length;
  const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "—";
  body.append(
    el(
      "div",
      { class: "stats-grid stats-compact" },
      miniStat("star", avg, "diary.weekAvg"),
      miniStat("check", String(grades.length), "diary.gradesCount"),
      miniStat("x", String(absent), "diary.absences")
    )
  );

  const days = el("div", { class: "diary-days" });
  for (const weekday of WEEKDAYS) {
    const date = addDays(view.week, weekday - 1);
    const iso = isoDate(date);
    const dayLessons = lessons.filter((lesson) => lesson.weekday === weekday).sort((a, b) => a.period - b.period);
    const dayEntries = entries.filter((entry) => entry.date === iso);

    // Jadvalda yo'q, lekin jurnalga yozilgan fanlar ham ko'rsatiladi
    const extra = dayEntries.filter((entry) => !dayLessons.some((lesson) => lesson.subjectId === entry.subjectId));

    const card = el("article", { class: `card diary-day${iso === today ? " is-today" : ""}` });
    card.append(el("h3", { class: "diary-day-title", text: formatDay(date) }));

    const hasHomework = homework.some((item) => item.dueDate === iso);
    if (dayLessons.length === 0 && extra.length === 0 && !hasHomework) {
      card.append(el("p", { class: "field-hint", i18n: "diary.noLessons" }));
    }

    const list = el("ol", { class: "diary-lessons" });
    for (const lesson of dayLessons) {
      const entry = dayEntries.find((item) => item.subjectId === lesson.subjectId);
      const due = homework.filter((item) => item.subjectId === lesson.subjectId && item.dueDate === iso);
      list.append(lessonItem(`${lesson.period}`, BELLS[lesson.period], subjectName(lesson.subjectId) !== "—" ? subjectName(lesson.subjectId) : lesson.subjectName, entry, due));
    }
    for (const entry of extra) {
      const due = homework.filter((item) => item.subjectId === entry.subjectId && item.dueDate === iso);
      list.append(lessonItem("·", "", subjectName(entry.subjectId), entry, due));
    }
    // Shu kunga topshiriladigan, lekin yuqorida chiqmagan vazifalar
    const shownSubjects = new Set([...dayLessons.map((lesson) => lesson.subjectId), ...extra.map((entry) => entry.subjectId)]);
    const orphanHomework = homework.filter((item) => item.dueDate === iso && !shownSubjects.has(item.subjectId));
    for (const item of orphanHomework) {
      list.append(lessonItem("·", "", subjectById(item.subjectId)?.name ?? item.subjectName ?? "—", null, [item]));
    }
    card.append(list);
    days.append(card);
  }
  body.append(days);
}

function lessonItem(number, time, subject, entry, homework) {
  return el(
    "li",
    { class: "diary-lesson" },
    el("span", { class: "diary-period" }, el("strong", { text: number }), time ? el("small", { text: time }) : null),
    el(
      "div",
      { class: "diary-lesson-main" },
      el("div", { class: "item-row" }, el("span", { class: "item-title", text: subject }), el("span", { class: "badge-row" }, ...entryBadges(entry))),
      ...homework.map((item) => el("p", { class: "diary-hw" }, icon("homework", "icon icon-sm"), el("span", { text: item.title }))),
      entry?.comment ? el("p", { class: "diary-comment", text: entry.comment }) : null
    )
  );
}

function miniStat(iconName, value, labelKey) {
  return el(
    "div",
    { class: "card stat-card" },
    el("span", { class: "stat-icon" }, icon(iconName)),
    el("div", {}, el("div", { class: "stat-value", text: value }), el("div", { class: "stat-label", i18n: labelKey }))
  );
}

export function resetDiary() {
  view.studentId = "";
  view.week = weekStart();
  clear(container());
}

export { parseIso };
