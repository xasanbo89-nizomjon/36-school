import { schoolDB } from "../data-store.js";
import { can } from "../auth.js";
import { t } from "../i18n.js";
import { byId, el, clear, icon, openFormModal, toast, notifyDataChanged, renderEmpty } from "../ui.js";

const DAYS = [
  { key: "monday", labelKey: "schedule.day.monday" },
  { key: "tuesday", labelKey: "schedule.day.tuesday" },
  { key: "wednesday", labelKey: "schedule.day.wednesday" },
  { key: "thursday", labelKey: "schedule.day.thursday" },
  { key: "friday", labelKey: "schedule.day.friday" },
  { key: "saturday", labelKey: "schedule.day.saturday" },
];

let selectedClass = "9-A";
let selectedDay = "monday";

const PERIOD_TIMES = {
  1: "08:30 - 09:15",
  2: "09:20 - 10:05",
  3: "10:15 - 11:00",
  4: "11:10 - 11:55",
  5: "12:05 - 12:50",
  6: "13:00 - 13:45",
};

export function renderSchedule() {
  const root = byId("scheduleGridContainer");
  if (!root) return;

  const lessons = schoolDB.getSchedule(selectedClass, selectedDay);
  clear(root);

  if (lessons.length === 0) {
    return renderEmpty(root, { iconName: "schedule", titleKey: "schedule.emptyDay" });
  }

  lessons.forEach((lesson) => {
    const time = PERIOD_TIMES[lesson.period] || "08:30 - 09:15";
    const card = el(
      "div",
      { class: "card schedule-card" },
      el(
        "div",
        { class: "schedule-time-box" },
        el("span", { class: "schedule-period-badge", text: `${lesson.period}-dars` }),
        el("span", { class: "schedule-time-text", text: time })
      ),
      el(
        "div",
        { class: "schedule-content" },
        el("h3", { class: "schedule-subject", text: lesson.subject }),
        el(
          "div",
          { class: "schedule-meta" },
          el("span", { class: "schedule-teacher text-muted" }, icon("user"), el("span", { text: lesson.teacher })),
          el("span", { class: "schedule-room text-primary font-medium" }, icon("classes"), el("span", { text: `${lesson.room}-xona` }))
        )
      )
    );
    root.append(card);
  });
}

function initControls() {
  const classSelect = byId("scheduleClassSelect");
  if (classSelect) {
    const classes = schoolDB.getClasses();
    clear(classSelect);
    classes.forEach((c) => {
      const opt = el("option", { attrs: { value: c.name }, text: `${c.name} sinfi` });
      if (c.name === selectedClass) opt.selected = true;
      classSelect.append(opt);
    });

    classSelect.addEventListener("change", (e) => {
      selectedClass = e.target.value;
      renderSchedule();
    });
  }

  const daysContainer = byId("scheduleDaysTabs");
  if (daysContainer) {
    clear(daysContainer);
    DAYS.forEach((d) => {
      const btn = el(
        "button",
        {
          class: `tab-btn ${d.key === selectedDay ? "active" : ""}`,
          attrs: { type: "button" },
          on: {
            click: () => {
              selectedDay = d.key;
              daysContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
              renderSchedule();
            },
          },
        },
        t(d.labelKey)
      );
      daysContainer.append(btn);
    });
  }

  byId("addLessonBtn")?.addEventListener("click", () => {
    openFormModal({
      titleKey: "schedule.addLesson",
      fields: [
        { name: "period", labelKey: "Dars soati (1-6)", type: "number", min: 1, max: 6, required: true, value: "1" },
        { name: "subject", labelKey: "Fan nomi", type: "text", required: true, placeholder: "Algebra" },
        { name: "teacher", labelKey: "O'qituvchi", type: "text", required: true, placeholder: "Z. Karimova" },
        { name: "room", labelKey: "Xona raqami", type: "text", required: true, placeholder: "304" },
      ],
      onSubmit: async (values) => {
        schoolDB.saveScheduleLesson(selectedClass, selectedDay, {
          period: Number(values.period),
          subject: values.subject,
          teacher: values.teacher,
          room: values.room,
        });
        toast(t("toast.saved"), "success");
        renderSchedule();
        notifyDataChanged();
      },
    });
  });

  byId("printScheduleBtn")?.addEventListener("click", () => {
    window.print();
  });
}

export async function loadSchedule() {
  initControls();
  renderSchedule();
}

export function initSchedule() {
  // ready
}

export function resetSchedule() {
  selectedDay = "monday";
}
