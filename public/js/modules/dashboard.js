import { schoolDB } from "../data-store.js";
import { getRole, getUser } from "../auth.js";
import { byId, el, clear, renderEmpty, onDataChanged, icon } from "../ui.js";
import { t } from "../i18n.js";
import { showSection } from "../router.js";

const MEDALS = ["🥇", "🥈", "🥉", "4", "5"];
let chart = null;
let bellTimer = null;

/* Raqamlar hisoblash animatsiyasi (CountUp) */
function animateValue(node, start, end, duration = 800, suffix = "") {
  if (!node) return;
  if (isNaN(end)) {
    node.textContent = String(end) + suffix;
    return;
  }
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeOutQuad = 1 - (1 - progress) * (1 - progress);
    const current = Math.floor(start + (end - start) * easeOutQuad);
    node.textContent = current.toLocaleString() + suffix;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      node.textContent = end.toLocaleString() + suffix;
    }
  };
  window.requestAnimationFrame(step);
}

/* Jonli Maktab Qo'ng'iroqlari va Dars Holati */
function updateBellStatus() {
  const bellBox = byId("bellStatusBox");
  if (!bellBox) return;

  const status = schoolDB.getCurrentBellStatus();
  clear(bellBox);

  const dot = el("span", { class: `status-pulse ${status.inLesson ? "status-pulse-green" : "status-pulse-amber"}` });
  const textCol = el(
    "div",
    { class: "bell-info" },
    el("div", { class: "bell-badge" }, status.inLesson ? t("bell.nowLesson") : t("bell.break")),
    el("h4", { class: "bell-title", text: status.label }),
    el("p", { class: "bell-sub", text: `${status.timeRange} ${status.inLesson ? ` • ${t("bell.remaining", { m: status.remainingMinutes })}` : ""}` })
  );

  bellBox.append(dot, textCol);
}

export function renderDashboard() {
  const role = getRole();
  const schoolInfo = schoolDB.getSchoolInfo();
  const classes = schoolDB.getClasses();
  const teachers = schoolDB.getTeachers();
  const attendanceList = schoolDB.getAttendanceSummary();

  // Hisoblashlar
  const totalStudents = classes.reduce((sum, c) => sum + (Number(c.students) || 0), 0) || schoolInfo.totalStudents;
  const totalTeachers = teachers.length || schoolInfo.totalTeachers;
  const totalClasses = classes.length || schoolInfo.totalClasses;

  const validPercents = attendanceList.map((a) => Number(a.percent)).filter((p) => !isNaN(p) && p > 0);
  const avgAttendance = validPercents.length
    ? Math.round((validPercents.reduce((a, b) => a + b, 0) / validPercents.length) * 10) / 10
    : 96.5;

  // Stat kartochkalariga animatsiyali raqamlar
  const studentCountEl = byId("studentCount");
  const teacherCountEl = byId("teacherCount");
  const classCountEl = byId("classCount");
  const attendancePercentEl = byId("attendancePercent");

  if (studentCountEl) animateValue(studentCountEl, 0, totalStudents);
  if (teacherCountEl) animateValue(teacherCountEl, 0, totalTeachers);
  if (classCountEl) animateValue(classCountEl, 0, totalClasses);
  if (attendancePercentEl) animateValue(attendancePercentEl, 0, Math.round(avgAttendance), 800, "%");

  // Qo'ng'iroqlar holati
  updateBellStatus();
  if (bellTimer) clearInterval(bellTimer);
  bellTimer = setInterval(updateBellStatus, 30000);

  // Reyting (Top sinflar)
  renderTopClasses(attendanceList);

  // Chart.js chizmasi
  renderChart(classes, attendanceList);

  // So'nggi e'lonlar vidjeti
  renderRecentAnnouncements();
}

function renderTopClasses(attendanceList) {
  const root = byId("rankingContainer");
  if (!root) return;

  const ranked = [...attendanceList]
    .filter((a) => Number(a.percent) > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  if (ranked.length === 0) {
    return renderEmpty(root, { iconName: "attendance" });
  }

  clear(root);
  ranked.forEach((entry, idx) => {
    const level = entry.percent >= 95 ? "good" : entry.percent >= 85 ? "mid" : "low";
    const row = el(
      "div",
      { class: "rank-row rank-row-hover" },
      el("span", { class: `rank-medal medal-${idx < 3 ? idx + 1 : "other"}`, text: MEDALS[idx] }),
      el(
        "div",
        { class: "rank-main" },
        el(
          "div",
          { class: "item-row" },
          el("span", { class: "item-title font-semibold", text: `${entry.className} sinfi` }),
          el("span", { class: `item-value badge-pill level-${level}`, text: `${entry.percent}%` })
        ),
        el(
          "div",
          { class: `progress level-${level}` },
          el("span", { class: "progress-fill", attrs: { style: `width: ${entry.percent}%;` } })
        )
      )
    );
    root.append(row);
  });
}

function renderChart(classes, attendanceList) {
  const canvas = byId("statsChart");
  if (!canvas || typeof Chart === "undefined") return;

  chart?.destroy();

  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";

  const topClasses = classes.slice(0, 7);
  const labels = topClasses.map((c) => c.name);
  const studentData = topClasses.map((c) => c.students);
  const attendanceData = topClasses.map((c) => {
    const item = attendanceList.find((a) => a.className === c.name);
    return item ? item.percent : 95;
  });

  chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: t("dash.chart.students"),
          data: studentData,
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.8)" : "rgba(37, 99, 235, 0.85)",
          borderRadius: 8,
          borderSkipped: false,
          yAxisID: "y",
        },
        {
          label: t("dash.chart.attendance"),
          data: attendanceData,
          type: "line",
          borderColor: "#10b981",
          backgroundColor: "#10b981",
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: "Inter", size: 12, weight: 500 } },
        },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#0f172a",
          titleFont: { family: "Inter", size: 13, weight: 600 },
          bodyFont: { family: "Inter", size: 12 },
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { family: "Inter" } },
          grid: { display: false },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          ticks: { color: textColor, font: { family: "Inter" } },
          grid: { color: gridColor },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          min: 80,
          max: 100,
          ticks: {
            color: "#10b981",
            font: { family: "Inter" },
            callback: (val) => `${val}%`,
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

function renderRecentAnnouncements() {
  const container = byId("recentNewsContainer");
  if (!container) return;

  const news = schoolDB.getAnnouncements().slice(0, 3);
  clear(container);

  if (news.length === 0) {
    return renderEmpty(container, { iconName: "announcements" });
  }

  for (const item of news) {
    const card = el(
      "div",
      { class: "mini-news-card", on: { click: () => showSection("announcementsSection") } },
      el(
        "div",
        { class: "mini-news-head" },
        el("span", { class: `badge-tag ${item.important ? "badge-important" : "badge-neutral"}`, text: item.categoryName }),
        el("span", { class: "mini-news-date", text: item.date })
      ),
      el("h4", { class: "mini-news-title", text: item.title }),
      el("p", { class: "mini-news-desc", text: item.content.slice(0, 80) + "..." })
    );
    container.append(card);
  }
}

export function initDashboard() {
  // Tezkor tugmalar
  byId("quickTakeAttendanceBtn")?.addEventListener("click", () => showSection("attendanceSection"));
  byId("quickAddHomeworkBtn")?.addEventListener("click", () => showSection("homeworkSection"));
  byId("quickScheduleBtn")?.addEventListener("click", () => showSection("scheduleSection"));
  byId("quickAnnounceBtn")?.addEventListener("click", () => showSection("announcementsSection"));

  onDataChanged(renderDashboard);
}

export async function loadDashboard() {
  renderDashboard();
}

export function resetDashboard() {
  chart?.destroy();
  chart = null;
  if (bellTimer) {
    clearInterval(bellTimer);
    bellTimer = null;
  }
}

export function showDashboardLoading() {
  /* No-op: Local data instantly available */
}
