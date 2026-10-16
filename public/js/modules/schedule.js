import { auth, db, setDoc, deleteDoc, doc, serverTimestamp, where } from "../firebase.js";
import { can, getRole } from "../auth.js";
import { STAFF, WEEKDAYS, PERIODS } from "../config.js";
import { t } from "../i18n.js";
import {
  store, queryDocs, visibleClassIds, className, subjectById, userById, displayName, teachers, weekdayOf,
} from "../data.js";
import { byId, el, clear, toast, openFormModal, renderEmpty, renderLoadError, renderSkeleton, selectControl, tabs } from "../ui.js";

/* Qo'ng'iroqlar jadvali (45 daqiqalik dars, 10 daqiqalik tanaffus) */
export const BELLS = {
  1: "08:00", 2: "08:55", 3: "09:50", 4: "10:50", 5: "11:45", 6: "12:40", 7: "13:35", 8: "14:30",
};

const view = { mode: "class", classId: "" };
let lessons = [];
let ok = false;

const container = () => byId("scheduleContainer");
const isTeacherLike = () => STAFF.includes(getRole()) && getRole() !== "superadmin";

export const lessonId = (classId, weekday, period) => `${classId}_${weekday}_${period}`;

async function fetchLessons() {
  if (view.mode === "mine") return queryDocs("lessons", where("teacherId", "==", auth.currentUser.uid));
  if (!view.classId) return [];
  return queryDocs("lessons", where("classId", "==", view.classId));
}

/* Boshqa modullar uchun: bitta sinfning jadvali */
export function lessonsOfClass(classId) {
  return queryDocs("lessons", where("classId", "==", classId));
}

async function load() {
  renderSkeleton(container(), { count: 2 });
  try {
    lessons = await fetchLessons();
    ok = true;
  } catch (error) {
    console.error("Jadvalni yuklab bo'lmadi:", error);
    lessons = [];
    ok = false;
  }
  render();
}

function lessonAt(weekday, period) {
  return lessons.find((lesson) => lesson.weekday === weekday && lesson.period === period) ?? null;
}

function cellContent(lesson) {
  if (!lesson) return [el("span", { class: "slot-empty", text: "—" })];
  const subject = subjectById(lesson.subjectId)?.name ?? lesson.subjectName ?? "—";
  const teacher = displayName(userById(lesson.teacherId)) !== "—" ? displayName(userById(lesson.teacherId)) : lesson.teacherName;
  return [
    el("span", { class: "slot-subject", text: subject }),
    view.mode === "mine"
      ? el("span", { class: "slot-meta", text: className(lesson.classId) })
      : teacher ? el("span", { class: "slot-meta", text: teacher }) : null,
    lesson.room ? el("span", { class: "slot-room", text: lesson.room }) : null,
  ];
}

function renderControls() {
  const bar = el("div", { class: "toolbar-row" });
  const classIds = visibleClassIds();

  if (isTeacherLike()) {
    bar.append(
      tabs(
        [
          { value: "class", labelKey: "schedule.byClass" },
          { value: "mine", labelKey: "schedule.mine" },
        ],
        view.mode,
        (mode) => {
          view.mode = mode;
          load();
        }
      )
    );
  }

  if (view.mode === "class" && classIds.length > 1) {
    bar.append(
      selectControl({
        options: classIds.map((id) => ({ value: id, label: className(id) })),
        value: view.classId,
        label: t("users.field.class"),
        onChange: (value) => {
          view.classId = value;
          load();
        },
      })
    );
  }
  return bar;
}

function render() {
  const root = container();
  clear(root);
  root.append(renderControls());

  if (!ok) {
    const box = el("div");
    renderLoadError(box);
    return root.append(box);
  }
  if (view.mode === "class" && !view.classId) {
    const box = el("div");
    renderEmpty(box, { iconName: "calendar", titleKey: "schedule.noClass" });
    return root.append(box);
  }

  const today = weekdayOf(new Date());
  const editable = can("schedule:write") && view.mode === "class";

  const grid = el("div", { class: "schedule-grid", attrs: { role: "table" } });
  grid.append(el("div", { class: "schedule-corner", attrs: { role: "columnheader" } }));
  for (const day of WEEKDAYS) {
    grid.append(el("div", { class: day === today ? "schedule-day is-today" : "schedule-day", i18n: `weekday.${day}`, attrs: { role: "columnheader" } }));
  }

  for (const period of PERIODS) {
    grid.append(
      el("div", { class: "schedule-period", attrs: { role: "rowheader" } }, el("strong", { text: String(period) }), el("span", { text: BELLS[period] ?? "" }))
    );
    for (const day of WEEKDAYS) {
      const lesson = lessonAt(day, period);
      const cell = el(
        editable ? "button" : "div",
        {
          class: `schedule-slot${lesson ? " has-lesson" : ""}${day === today ? " is-today" : ""}`,
          attrs: editable ? { type: "button", role: "cell", "aria-label": `${t(`weekday.${day}`)}, ${period}` } : { role: "cell" },
        },
        ...cellContent(lesson)
      );
      if (editable) cell.addEventListener("click", () => editSlot(day, period, lesson));
      grid.append(cell);
    }
  }

  const scroller = el("div", { class: "card panel schedule-scroll" }, grid);
  root.append(scroller);
  if (editable) root.append(el("p", { class: "field-hint", i18n: "schedule.editHint" }));
}

async function editSlot(weekday, period, lesson) {
  if (store.subjects.length === 0) return toast(t("schedule.needSubjects"), "info", 6000);
  const id = lessonId(view.classId, weekday, period);
  let removed = false;

  const saved = await openFormModal({
    titleKey: "schedule.editTitle",
    descriptionKey: "schedule.editDescription",
    fields: [
      {
        name: "subjectId",
        labelKey: "schedule.field.subject",
        type: "select",
        value: lesson?.subjectId ?? "",
        placeholderKey: "schedule.noLesson",
        options: store.subjects.map((subject) => ({ value: subject.id, label: subject.name })),
      },
      {
        name: "teacherId",
        labelKey: "schedule.field.teacher",
        type: "select",
        value: lesson?.teacherId ?? "",
        placeholderKey: "common.notSelected",
        options: teachers().map((user) => ({ value: user.id, label: displayName(user) })),
      },
      { name: "room", labelKey: "schedule.field.room", maxLength: 20, value: lesson?.room ?? "", placeholder: "204" },
    ],
    onSubmit: async ({ subjectId, teacherId, room }) => {
      if (!subjectId) {
        if (lesson) await deleteDoc(doc(db, "lessons", id));
        removed = true;
        return;
      }
      const teacher = userById(teacherId);
      await setDoc(doc(db, "lessons", id), {
        classId: view.classId,
        weekday,
        period,
        subjectId,
        subjectName: subjectById(subjectId)?.name ?? "",
        teacherId: teacherId || "",
        teacherName: teacher ? displayName(teacher) : "",
        room: room || "",
        updatedBy: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    },
  });
  if (!saved) return;
  toast(t(removed ? "toast.deleted" : "toast.saved"), "success");
  load();
}

export function loadSchedule() {
  const classIds = visibleClassIds();
  if (!classIds.includes(view.classId)) view.classId = classIds[0] ?? "";
  if (getRole() === "teacher" && view.mode === "class" && !view.touched) {
    view.mode = "mine";
    view.touched = true;
  }
  return load();
}

export function resetSchedule() {
  Object.assign(view, { mode: "class", classId: "", touched: false });
  lessons = [];
  ok = false;
  clear(container());
}
