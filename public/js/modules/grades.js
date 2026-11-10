import { schoolDB } from "../data-store.js";
import { can, getRole, getUser } from "../auth.js";
import { t } from "../i18n.js";
import { byId, el, clear, toast, notifyDataChanged, renderEmpty, openFormModal, icon } from "../ui.js";

let selectedClass = "9-A";
let selectedSubject = "Algebra";

const SUBJECTS = ["Algebra", "Fizika", "Ingliz tili", "Ona tili", "Kimyo", "Biologiya", "Tarix", "Informatika"];

export function renderGrades() {
  const root = byId("gradesTableContainer");
  if (!root) return;

  const role = getRole();
  const user = getUser();
  const gradesList = schoolDB.getGrades(selectedClass, selectedSubject);

  clear(root);

  if (gradesList.length === 0) {
    return renderEmpty(root, { iconName: "grades" });
  }

  const tableWrap = el("div", { class: "table-responsive" });
  const table = el(
    "table",
    { class: "data-table gradebook-table" },
    el(
      "thead",
      {},
      el(
        "tr",
        {},
        el("th", { text: "#" }),
        el("th", { text: t("grades.student") }),
        el("th", { text: t("grades.marks") }),
        el("th", { text: t("grades.average") }),
        can("grades:write") ? el("th", { text: t("grades.addMark") }) : null
      )
    )
  );

  const tbody = el("tbody");

  gradesList.forEach((entry, idx) => {
    // Baholar pilleri
    const marksWrap = el("div", { class: "marks-list" });
    entry.marks.forEach((m) => {
      const markColor = m === 5 ? "mark-5" : m === 4 ? "mark-4" : m === 3 ? "mark-3" : "mark-2";
      marksWrap.append(el("span", { class: `mark-badge ${markColor}`, text: String(m) }));
    });

    const avgColor = entry.average >= 4.5 ? "rating-high" : entry.average >= 3.8 ? "rating-mid" : "rating-low";

    const tr = el(
      "tr",
      { class: "table-row-hover" },
      el("td", { class: "text-muted", text: String(idx + 1) }),
      el(
        "td",
        { class: "font-semibold" },
        el("span", { class: "student-avatar-inline", text: entry.studentName[0] }),
        entry.studentName
      ),
      el("td", {}, marksWrap),
      el("td", {}, el("span", { class: `badge-rating ${avgColor}`, text: `${entry.average}` })),
      can("grades:write")
        ? el(
            "td",
            {},
            el("div", { class: "quick-grade-picker" },
              [5, 4, 3, 2].map((val) =>
                el(
                  "button",
                  {
                    class: `quick-grade-btn grade-btn-${val}`,
                    attrs: { type: "button", title: `${val} baho qo'yish` },
                    on: {
                      click: () => {
                        schoolDB.addGradeMark(selectedClass, selectedSubject, entry.studentId, val);
                        toast(t("grades.markSaved"), "success");
                        renderGrades();
                        notifyDataChanged();
                      },
                    },
                  },
                  String(val)
                )
              )
            )
          )
        : null
    );

    tbody.append(tr);
  });

  table.append(tbody);
  tableWrap.append(table);
  root.append(tableWrap);
}

function initGradesControls() {
  const classSelect = byId("gradesClassSelect");
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
      renderGrades();
    });
  }

  const subjectSelect = byId("gradesSubjectSelect");
  if (subjectSelect) {
    clear(subjectSelect);
    SUBJECTS.forEach((sub) => {
      const opt = el("option", { attrs: { value: sub }, text: sub });
      if (sub === selectedSubject) opt.selected = true;
      subjectSelect.append(opt);
    });

    subjectSelect.addEventListener("change", (e) => {
      selectedSubject = e.target.value;
      renderGrades();
    });
  }
}

export async function loadGrades() {
  initGradesControls();
  renderGrades();
}

export function initGrades() {
  // ready
}

export function resetGrades() {
  selectedSubject = "Algebra";
}
