import {
  db, collection, query, where, limit, getCountFromServer, getAggregateFromServer, average, count,
} from "../firebase.js";
import { getRole, getProfile } from "../auth.js";
import { STAFF } from "../config.js";
import { t } from "../i18n.js";
import {
  store, queryDocs, usersByRole, familyStudents, className, subjectName, displayName, userById, isoDate, addDays,
  weekdayOf, parseIso,
} from "../data.js";
import { byId, el, clear, icon, renderEmpty, renderSkeleton, selectControl } from "../ui.js";
import { BELLS } from "./schedule.js";

const MEDALS = ["🥇", "🥈", "🥉"];
const PERIOD_DAYS = 30;
const TREND_DAYS = 14;

let chart = null;
let cache = null; // oxirgi yuklangan ma'lumot — til/tema almashganda tarmoqsiz qayta chiziladi
let familyStudentId = "";

const container = () => byId("dashboardContainer");
const journal = () => collection(db, "journal");

/* ---------- Umumiy bo'laklar ---------- */

function statCard(iconName, value, labelKey, tone = "", hint = null) {
  return el(
    "div",
    { class: "card stat-card" },
    el("span", { class: `stat-icon ${tone}` }, icon(iconName)),
    el(
      "div",
      {},
      el("div", { class: "stat-value", text: value }),
      el("div", { class: "stat-label", i18n: labelKey }),
      hint ? el("div", { class: "stat-hint", text: hint }) : null
    )
  );
}

function panel(titleKey, ...children) {
  return el("div", { class: "card panel" }, el("h2", { class: "panel-title", i18n: titleKey }), ...children);
}

/* Brauzerda o'zbek locale bo'lmasligi mumkin — sana o'zimizning lug'atdan */
export function longDate(date) {
  return t("date.long", { weekday: t(`weekday.${weekdayOf(date)}`), day: date.getDate(), month: t(`month.${date.getMonth() + 1}`) });
}

function greeting() {
  const hour = new Date().getHours();
  const key = hour < 12 ? "dash.greeting.morning" : hour < 18 ? "dash.greeting.day" : "dash.greeting.evening";
  const name = (getProfile()?.name || "").split(" ")[0];
  return el(
    "div",
    { class: "page-header" },
    el(
      "div",
      {},
      el("h1", { class: "page-title", text: name ? `${t(key)}, ${name}!` : `${t(key)}!` }),
      el("p", { class: "page-subtitle", text: longDate(new Date()) })
    )
  );
}

const pct = (part, total) => (total ? Math.round(((total - part) / total) * 100) : null);
const fmtAvg = (value) => (typeof value === "number" && !Number.isNaN(value) ? value.toFixed(2) : "—");

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function destroyChart() {
  chart?.destroy();
  chart = null;
}

/* ---------- Ma'muriyat / o'qituvchi ---------- */

async function countWhere(...constraints) {
  const snap = await getCountFromServer(query(journal(), ...constraints));
  return snap.data().count;
}

async function loadSchoolData() {
  const today = isoDate();
  const since = isoDate(addDays(new Date(), -PERIOD_DAYS));

  const trendDays = [];
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const date = addDays(new Date(), -i);
    if (date.getDay() !== 0) trendDays.push(isoDate(date)); // yakshanbasiz
  }

  const safe = (promise, fallback = null) => promise.catch((error) => (console.error(error), fallback));

  const [todayTotal, todayAbsent, avgAll, trend, ranking, absentees] = await Promise.all([
    safe(countWhere(where("date", "==", today)), 0),
    safe(countWhere(where("date", "==", today), where("status", "==", "absent")), 0),
    safe(getAggregateFromServer(query(journal(), where("date", ">=", since)), { avg: average("grade") }).then((s) => s.data().avg)),
    safe(
      Promise.all(
        trendDays.map(async (date) => {
          const [total, absent] = await Promise.all([countWhere(where("date", "==", date)), countWhere(where("date", "==", date), where("status", "==", "absent"))]);
          return { date, value: pct(absent, total) };
        })
      ),
      []
    ),
    safe(
      Promise.all(
        store.classes.map(async (klass) => {
          const snap = await getAggregateFromServer(query(journal(), where("classId", "==", klass.id), where("date", ">=", since)), {
            avg: average("grade"),
            n: count(),
          });
          return { name: klass.name, avg: snap.data().avg, n: snap.data().n };
        })
      ),
      []
    ),
    safe(queryDocs("journal", where("date", "==", today), where("status", "==", "absent"), limit(100)), []),
  ]);

  return { todayTotal, todayAbsent, avgAll, trend, ranking, absentees };
}

function renderSchool(data) {
  const root = container();
  clear(root);
  destroyChart();

  const students = usersByRole("student").length;
  const teacherCount = usersByRole("teacher").length;
  const todayPct = pct(data.todayAbsent, data.todayTotal);

  root.append(
    greeting(),
    el(
      "div",
      { class: "stats-grid stats-4" },
      statCard("users", String(students), "stats.students"),
      statCard("classes", String(teacherCount), "stats.teachers", "stat-icon-violet"),
      statCard("attendance", todayPct === null ? "—" : `${todayPct}%`, "stats.todayAttendance", "stat-icon-green", data.todayTotal ? t("dash.marks", { n: data.todayTotal }) : t("dash.noMarksToday")),
      statCard("star", fmtAvg(data.avgAll), "stats.avgGrade", "stat-icon-amber", t("dash.lastDays", { n: PERIOD_DAYS }))
    )
  );

  // Davomat dinamikasi
  const chartBox = el("div", { class: "chart-box" }, el("canvas", { attrs: { id: "statsChart" } }));
  const trendPanel = panel("dash.trend", chartBox);

  // Sinflar reytingi (o'rtacha baho)
  const rankList = el("div", { class: "rank-list" });
  const ranked = data.ranking.filter((row) => typeof row.avg === "number").sort((a, b) => b.avg - a.avg).slice(0, 7);
  if (ranked.length === 0) renderEmpty(rankList, { iconName: "star", titleKey: "dash.noGrades" });
  ranked.forEach((row, index) => {
    const bar = el("div", { class: `progress level-${row.avg >= 4.5 ? "good" : row.avg >= 3.5 ? "mid" : "low"}` }, el("span", { class: "progress-fill" }));
    bar.firstChild.style.width = `${(row.avg / 5) * 100}%`;
    rankList.append(
      el(
        "div",
        { class: "rank-row" },
        el("span", { class: "rank-medal", text: MEDALS[index] ?? `${index + 1}` }),
        el("div", { class: "rank-main" }, el("div", { class: "item-row" }, el("span", { class: "item-title", text: row.name }), el("span", { class: "item-value", text: row.avg.toFixed(2) })), bar)
      )
    );
  });

  root.append(el("div", { class: "dashboard-grid" }, trendPanel, panel("dash.ranking", rankList)));

  // Bugun kelmaganlar
  const absentBox = el("div", { class: "absent-list" });
  const byStudent = new Map();
  for (const entry of data.absentees) {
    const list = byStudent.get(entry.studentId) ?? [];
    list.push(entry);
    byStudent.set(entry.studentId, list);
  }
  if (byStudent.size === 0) {
    renderEmpty(absentBox, { iconName: "check", titleKey: data.todayTotal ? "dash.allPresent" : "dash.noMarksToday" });
  } else {
    for (const [studentId, list] of byStudent) {
      const student = userById(studentId);
      absentBox.append(
        el(
          "div",
          { class: "absent-row" },
          el("span", { class: "avatar avatar-sm", text: displayName(student).charAt(0).toUpperCase() }),
          el("div", { class: "item-main" }, el("span", { class: "item-title", text: displayName(student) }), el("span", { class: "item-sub", text: `${className(list[0].classId)} · ${list.map((entry) => subjectName(entry.subjectId)).join(", ")}` })),
          el("span", { class: "stat-chip chip-absent", text: String(list.length) })
        )
      );
    }
  }
  root.append(panel("dash.absentToday", absentBox));

  drawTrend(data.trend);
}

function drawTrend(trend) {
  const canvas = byId("statsChart");
  if (!canvas || typeof Chart === "undefined") return;
  Chart.getChart(canvas)?.destroy();

  const hasData = trend.some((row) => row.value !== null);
  if (!hasData) {
    const box = canvas.parentElement;
    clear(box);
    renderEmpty(box, { iconName: "dashboard", titleKey: "dash.noTrend" });
    return;
  }

  const primary = cssVar("--primary");
  const textColor = cssVar("--text-muted");
  const gridColor = cssVar("--border");
  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: trend.map((row) => `${parseIso(row.date).getDate()}.${String(parseIso(row.date).getMonth() + 1).padStart(2, "0")}`),
      datasets: [
        {
          label: t("stats.attendance"),
          data: trend.map((row) => row.value),
          borderColor: primary,
          backgroundColor: `${primary}22`,
          fill: true,
          tension: 0.35,
          spanGaps: true,
          pointRadius: 4,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { min: 0, max: 100, ticks: { color: textColor, callback: (v) => `${v}%` }, grid: { color: gridColor } },
      },
    },
  });
}

/* ---------- O'quvchi / ota-ona ---------- */

async function loadFamilyData(student) {
  const since = isoDate(addDays(new Date(), -PERIOD_DAYS));
  const [entries, lessons, homework] = await Promise.all([
    queryDocs("journal", where("studentId", "==", student.id), where("date", ">=", since)).catch((e) => (console.error(e), [])),
    student.classId ? queryDocs("lessons", where("classId", "==", student.classId)).catch(() => []) : [],
    student.classId ? queryDocs("homework", where("classId", "==", student.classId)).catch(() => []) : [],
  ]);
  return { student, entries, lessons, homework };
}

function renderFamily({ student, entries, lessons, homework }) {
  const root = container();
  clear(root);
  destroyChart();
  root.append(greeting());

  const students = familyStudents();
  if (students.length > 1) {
    root.append(
      el(
        "div",
        { class: "toolbar-row" },
        selectControl({
          options: students.map((item) => ({ value: item.id, label: displayName(item) })),
          value: student.id,
          label: t("diary.child"),
          onChange: (value) => {
            familyStudentId = value;
            loadDashboard();
          },
        })
      )
    );
  }

  const grades = entries.map((entry) => entry.grade).filter(Boolean);
  const absent = entries.filter((entry) => entry.status === "absent").length;
  const today = isoDate();
  const dueSoon = homework.filter((item) => item.dueDate && item.dueDate >= today && item.dueDate <= isoDate(addDays(new Date(), 3)));

  root.append(
    el(
      "div",
      { class: "stats-grid stats-4" },
      statCard("star", grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2) : "—", "stats.avgGrade", "stat-icon-amber", t("dash.lastDays", { n: PERIOD_DAYS })),
      statCard("attendance", entries.length ? `${pct(absent, entries.length)}%` : "—", "stats.attendance", "stat-icon-green"),
      statCard("x", String(absent), "diary.absences", "stat-icon-red"),
      statCard("homework", String(dueSoon.length), "dash.dueSoon", "stat-icon-violet")
    )
  );

  // Bugungi darslar
  const todayBox = el("ol", { class: "diary-lessons" });
  const todayLessons = lessons.filter((lesson) => lesson.weekday === weekdayOf(new Date())).sort((a, b) => a.period - b.period);
  if (todayLessons.length === 0) todayBox.append(el("li", { class: "field-hint", i18n: "diary.noLessons" }));
  for (const lesson of todayLessons) {
    todayBox.append(
      el(
        "li",
        { class: "diary-lesson" },
        el("span", { class: "diary-period" }, el("strong", { text: String(lesson.period) }), el("small", { text: BELLS[lesson.period] ?? "" })),
        el("div", { class: "diary-lesson-main" }, el("span", { class: "item-title", text: subjectName(lesson.subjectId) !== "—" ? subjectName(lesson.subjectId) : lesson.subjectName }), lesson.room ? el("span", { class: "item-sub", text: lesson.room }) : null)
      )
    );
  }

  // Fanlar bo'yicha o'rtacha
  const bySubject = new Map();
  for (const entry of entries) {
    if (!entry.grade) continue;
    const list = bySubject.get(entry.subjectId) ?? [];
    list.push(entry.grade);
    bySubject.set(entry.subjectId, list);
  }
  const subjectsBox = el("div", { class: "rank-list" });
  if (bySubject.size === 0) renderEmpty(subjectsBox, { iconName: "star", titleKey: "dash.noGrades" });
  [...bySubject.entries()]
    .map(([id, list]) => ({ name: subjectName(id), avg: list.reduce((a, b) => a + b, 0) / list.length, n: list.length }))
    .sort((a, b) => b.avg - a.avg)
    .forEach((row) => {
      const bar = el("div", { class: `progress level-${row.avg >= 4.5 ? "good" : row.avg >= 3.5 ? "mid" : "low"}` }, el("span", { class: "progress-fill" }));
      bar.firstChild.style.width = `${(row.avg / 5) * 100}%`;
      subjectsBox.append(el("div", { class: "rank-main" }, el("div", { class: "item-row" }, el("span", { class: "item-title", text: row.name }), el("span", { class: "item-value", text: row.avg.toFixed(1) })), bar));
    });

  root.append(el("div", { class: "dashboard-grid" }, panel("dash.todayLessons", todayBox), panel("dash.bySubject", subjectsBox)));

  // So'nggi baholar
  const recent = entries.filter((entry) => entry.grade).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const recentBox = el("div", { class: "recent-grades" });
  if (recent.length === 0) renderEmpty(recentBox, { iconName: "star", titleKey: "dash.noGrades" });
  for (const entry of recent) {
    const date = parseIso(entry.date);
    recentBox.append(
      el(
        "div",
        { class: "recent-row" },
        el("span", { class: `grade-badge grade-${entry.grade}`, text: String(entry.grade) }),
        el("div", { class: "item-main" }, el("span", { class: "item-title", text: subjectName(entry.subjectId) }), entry.comment ? el("span", { class: "item-sub", text: entry.comment }) : null),
        el("span", { class: "cell-muted", text: `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}` })
      )
    );
  }
  root.append(panel("dash.recentGrades", recentBox));
}

/* ---------- Kirish nuqtalari ---------- */

export async function loadDashboard() {
  renderSkeleton(container(), { count: 3 });
  if (STAFF.includes(getRole())) {
    cache = { type: "school", data: await loadSchoolData() };
    renderSchool(cache.data);
    return;
  }
  const students = familyStudents();
  const student = students.find((item) => item.id === familyStudentId) ?? students[0];
  if (!student) {
    cache = null;
    clear(container());
    renderEmpty(container(), { iconName: "users", titleKey: "diary.noChild" });
    return;
  }
  familyStudentId = student.id;
  cache = { type: "family", data: await loadFamilyData(student) };
  renderFamily(cache.data);
}

/* Til yoki tema almashganda — tarmoqqa chiqmasdan qayta chizish */
export function renderDashboard() {
  if (!cache) return;
  if (cache.type === "school") renderSchool(cache.data);
  else renderFamily(cache.data);
}

export function resetDashboard() {
  destroyChart();
  cache = null;
  familyStudentId = "";
  clear(container());
}
