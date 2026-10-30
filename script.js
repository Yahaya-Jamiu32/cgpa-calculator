/* 
   CGPA Calculator – script.js
   --------------------------------------------------------------------------
   CONTENTS
     1. Configuration      (grade scale, limits – edit these to fit your school)
     2. App state          (the data the whole app works from)
     3. Small helpers
     4. Saving & loading   (localStorage)
     5. Course management  (add, remove, clear)
     6. Validation
     7. Calculation        (pure maths, no page access)
     8. Showing results & errors
     9. Navigation between views
    10. Event listeners
    11. Start-up
    */
"use strict";
/* 
   1. CONFIGURATION
    */

// The ONLY place grade points live. Edit to match your university's policy.
// Every dropdown, table and calculation reads from this object.
const GRADE_SCALE = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
// Highest grade point on the scale (used to check the "previous CGPA" input)
const MAX_POINT = Math.max(...Object.values(GRADE_SCALE));
// Credit units offered in each course's dropdown
const CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];
// Upper limit for "credit units completed before" (guards against typos)
const MAX_PREV_CREDITS = 500;
// Name under which data is saved in the browser. Change the "v1" if the saved format changes.
const STORAGE_KEY = "cgpa-calc-v1";

// Example courses shown the first time the app opens (editable / removable)
const SAMPLE = [
  {
    code: "CSC101",
    title: "Introduction to Computer Science",
    credit: 3,
    grade: "A",
  },
  { code: "MAT101", title: "Mathematics I", credit: 3, grade: "B" },
  { code: "PHY101", title: "Physics I", credit: 3, grade: "C" },
  { code: "ENG101", title: "English Language", credit: 2, grade: "B" },
];

/* 
   2. APP STATE
    */
let nextId = 1; // gives every course row a unique id
let courses = []; // [{ id, code, title, credit, grade }]
let prev = { credits: "", cgpa: "" }; // optional earlier results (strings from the inputs):
// credits = units completed before, cgpa = CGPA before this semester
let lastResult = null; // output of the last successful Calculate (null = nothing yet)

/* 
   3. SMALL HELPERS
    */

// Shortcut for document.getElementById
const $ = (id) => document.getElementById(id);
// Escapes HTML so user text can never be run as code (prevents XSS)
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Display rounding: 2 decimals (the tiny 1e-9 avoids float errors like 2.675 -> 2.67)
const fmt = (n) => (Math.round((n + 1e-9) * 100) / 100).toFixed(2);
// True only for real grades on the scale (safe against names like "toString")
const isGrade = (g) => Object.prototype.hasOwnProperty.call(GRADE_SCALE, g);
// Names of the app's pages; must match the data-view / id="view-..." in index.html
const VIEWS = ["home", "calculator", "results", "about"];

/* 
   4. SAVING & LOADING
   localStorage can be blocked (private mode, sandboxed frames), so every
   access is wrapped in try/catch and failure is silently ignored.
    */

// Saves courses and previous-semester data in this browser only
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ courses, prev }));
  } catch (e) {
    /* ignore */
  }
}
// Restores saved data. Anything malformed is cleaned; with no saved data the sample courses are used.
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (d && Array.isArray(d.courses)) {
      courses = d.courses.map((c) => ({
        id: nextId++,
        code: String(c.code ?? ""),
        title: String(c.title ?? ""),
        credit: CREDIT_OPTIONS.includes(Number(c.credit))
          ? Number(c.credit)
          : 3,
        grade: isGrade(c.grade) ? c.grade : "",
      }));
      prev = {
        credits: String(d.prev?.credits ?? ""),
        cgpa: String(d.prev?.cgpa ?? ""),
      };
      return;
    }
  } catch (e) {
    /* fall through */
  }
  courses = SAMPLE.map((c) => ({ ...c, id: nextId++ }));
}

/* 
   5. COURSE MANAGEMENT
    */

// Adds an empty course row and focuses its first field
function addCourse() {
  courses.push({ id: nextId++, code: "", title: "", credit: 3, grade: "" });
  renderCourses();
  save();
  markStale();
  const rows = document.querySelectorAll("#course-body tr");
  rows[rows.length - 1].querySelector("input").focus();
}
// Removes one course by its id
function removeCourse(id) {
  courses = courses.filter((c) => c.id !== id);
  renderCourses();
  save();
  markStale();
}
// Shows the "you changed something" notice if results already exist
function markStale() {
  if (lastResult)
    document.querySelectorAll(".stale").forEach((el) => {
      el.hidden = false;
    });
}
// Opens the confirmation dialog (nothing is deleted until the user confirms)
function clearAll() {
  const d = $("confirm-dlg");
  if (typeof d.showModal !== "function") {
    // very old browsers without <dialog>
    if (
      window.confirm(
        "Delete all courses and previous-semester data? This cannot be undone.",
      )
    )
      doClear();
    return;
  }
  d.returnValue = "";
  d.showModal();
}
// Actually deletes everything; called only after the user confirms
function doClear() {
  courses = [];
  prev = { credits: "", cgpa: "" };
  lastResult = null;
  $("prev-credits").value = "";
  $("prev-cgpa").value = "";
  hideErrors();
  $("results-box").hidden = true;
  save();
  renderCourses();
  renderDetails();
}

// Builds the HTML for one course row (all user text is escaped)
function rowHTML(c, i) {
  const credits = CREDIT_OPTIONS.map(
    (n) =>
      `<option value="${n}"${+c.credit === n ? " selected" : ""}>${n}</option>`,
  ).join("");
  const grades =
    `<option value="">Select</option>` +
    Object.keys(GRADE_SCALE)
      .map((g) => `<option${c.grade === g ? " selected" : ""}>${g}</option>`)
      .join("");
  return `<tr data-id="${c.id}">
    <td class="n">${i + 1}</td>
    <td data-label="Course code"><input data-f="code" value="${esc(c.code)}" aria-label="Course code, row ${i + 1}" placeholder="e.g. CSC101" maxlength="12"></td>
    <td class="title" data-label="Course title"><input data-f="title" value="${esc(c.title)}" aria-label="Course title, row ${i + 1}" placeholder="e.g. Mathematics" maxlength="80"></td>
    <td data-label="Credit unit"><select data-f="credit" aria-label="Credit unit, row ${i + 1}">${credits}</select></td>
    <td data-label="Grade"><select data-f="grade" aria-label="Grade, row ${i + 1}">${grades}</select></td>
    <td class="act"><button class="rm" type="button" aria-label="Remove course ${i + 1}"><svg class="ic" aria-hidden="true"><use href="#i-trash"/></svg></button></td>
  </tr>`;
}
// Redraws the whole course table from the `courses` array
function renderCourses() {
  $("course-body").innerHTML = courses.map(rowHTML).join("");
  $("empty").hidden = courses.length > 0;
}

/* 
   6. VALIDATION
    */

// Checks every input. Returns { errors: [messages], valid: [courses] }.
// Bad fields get the .bad class so they are highlighted. `valid` is empty if any error exists.
function validate() {
  const errors = [];
  document.querySelectorAll(".bad").forEach((el) => el.classList.remove("bad"));
  if (courses.length === 0)
    return { errors: ["Add at least one course."], valid: [] };
  const seen = Object.create(null);
  courses.forEach((c, i) => {
    const row = document.querySelector(`tr[data-id="${c.id}"]`);
    const mark = (f) =>
      row.querySelector(`[data-f="${f}"]`).classList.add("bad");
    const key = c.code.trim().toUpperCase();
    if (!key) {
      errors.push(`Row ${i + 1}: enter a course code.`);
      mark("code");
    } else if (key in seen) {
      errors.push(
        `Row ${i + 1}: ${key} is already listed in row ${seen[key]}.`,
      );
      mark("code");
    } else seen[key] = i + 1;
    if (!c.title.trim()) {
      errors.push(`Row ${i + 1}: enter a course title.`);
      mark("title");
    }
    if (!Number.isInteger(+c.credit) || +c.credit <= 0) {
      errors.push(`Row ${i + 1}: credit unit must be a positive whole number.`);
      mark("credit");
    }
    if (!isGrade(c.grade)) {
      errors.push(`Row ${i + 1}: choose a grade.`);
      mark("grade");
    }
  });
  [
    ["prev-credits", "Previous credit units"],
    ["prev-cgpa", "Previous CGPA"],
  ].forEach(([id, label]) => {
    if ($(id).validity.badInput) {
      errors.push(`${label}: enter a valid number.`);
      $(id).classList.add("bad");
    }
  });
  const pc = prev.credits !== "",
    pg = prev.cgpa !== "";
  if (errors.some((m) => m.endsWith("valid number."))) {
    /* already reported */
  } else if (pc !== pg) {
    errors.push(
      "Previous semesters: fill in both fields, or leave both blank.",
    );
    $(pc ? "prev-cgpa" : "prev-credits").classList.add("bad");
  } else if (pc) {
    const cr = Number(prev.credits),
      cg = Number(prev.cgpa);
    if (
      !Number.isFinite(cr) ||
      cr <= 0 ||
      cr > MAX_PREV_CREDITS ||
      !Number.isInteger(cr)
    ) {
      errors.push(
        `Previous credit units must be a whole number from 1 to ${MAX_PREV_CREDITS}.`,
      );
      $("prev-credits").classList.add("bad");
    }
    if (!Number.isFinite(cg) || cg < 0 || cg > MAX_POINT) {
      errors.push(`Previous CGPA must be between 0 and ${MAX_POINT}.`);
      $("prev-cgpa").classList.add("bad");
    }
  }
  return { errors, valid: errors.length ? [] : courses };
}

/* 
   7. CALCULATION  (pure functions: numbers in, numbers out)
   GPA  = total quality points / total credit units
   Quality points of a course = grade point x credit unit
    */

// Semester totals and GPA for a list of valid courses (null if there are no credits)
function calcSemester(list) {
  const credits = list.reduce((s, c) => s + Number(c.credit), 0);
  const points = list.reduce(
    (s, c) => s + GRADE_SCALE[c.grade] * Number(c.credit),
    0,
  );
  if (credits === 0) return null;
  return { credits, points, gpa: points / credits };
}
// Cumulative CGPA = (previous CGPA x previous credits + this semester's points)
//                   / (previous credits + this semester's credits)
// With no previous data it is based on this semester only (hasPrev = false).
function calcCumulative(sem, p) {
  if (p.credits === "" || p.cgpa === "")
    return {
      ...sem,
      cgpa: sem.gpa,
      hasPrev: false,
      totalCredits: sem.credits,
      totalPoints: sem.points,
    };
  const pc = Number(p.credits),
    pp = Number(p.cgpa) * pc;
  const totalCredits = pc + sem.credits,
    totalPoints = pp + sem.points;
  return {
    cgpa: totalPoints / totalCredits,
    hasPrev: true,
    totalCredits,
    totalPoints,
  };
}

// Runs when the user presses Calculate / Recalculate: validate, compute, show
function calculate() {
  const { errors, valid } = validate();
  if (errors.length) {
    showErrors(errors);
    const bad = document.querySelector(".bad");
    if (bad) bad.focus();
    return;
  }
  const sem = calcSemester(valid);
  if (!sem) {
    showErrors(["Total credit units are zero, so a GPA cannot be calculated."]);
    return;
  }
  hideErrors();
  document.querySelectorAll(".stale").forEach((el) => {
    el.hidden = true;
  });
  const cum = calcCumulative(sem, prev);
  lastResult = {
    sem,
    cum,
    prev: { ...prev },
    courses: valid.map((c) => ({
      ...c,
      points: GRADE_SCALE[c.grade] * Number(c.credit),
    })),
  };
  renderResults();
  renderDetails();
  $("results-box").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "nearest",
  });
}

/* 
   8. SHOWING RESULTS & ERRORS
    */

// Shows the red error box with a list of friendly messages
function showErrors(list) {
  const e = $("errors");
  e.innerHTML =
    "<ul>" + list.map((m) => `<li>${esc(m)}</li>`).join("") + "</ul>";
  e.hidden = false;
}
function hideErrors() {
  $("errors").hidden = true;
}
// Explains what the CGPA is based on (so a single semester is never passed off as cumulative)
function cgpaNote(r) {
  return r.cum.hasPrev
    ? `Includes ${r.prev.credits} earlier credit units`
    : "Based only on this semester (no earlier results entered)";
}
// Fills the GPA / CGPA cards under the calculator
function renderResults() {
  if (!lastResult) return;
  const r = lastResult;
  $("results-box").hidden = false;
  $("r-gpa").textContent = fmt(r.sem.gpa);
  $("r-gpa-note").textContent = `${r.sem.credits} credit units`;
  $("r-cgpa").textContent = fmt(r.cum.cgpa);
  $("r-cgpa-note").textContent = cgpaNote(r);
  $("r-totals").textContent =
    `This semester: ${r.sem.credits} credit units, ${fmt(r.sem.points)} quality points.`;
}
// Fills the Results page (summary + course breakdown) or shows its empty state
function renderDetails() {
  const has = !!lastResult;
  $("results-empty").hidden = has;
  $("results-detail").hidden = !has;
  if (!has) return;
  const r = lastResult;
  $("d-cgpa").textContent = fmt(r.cum.cgpa);
  $("d-cgpa-note").textContent = cgpaNote(r);
  let rows = "";
  if (r.cum.hasPrev)
    rows += `<tr><td>Earlier semesters</td><td>${r.prev.credits}</td><td>${fmt(Number(r.prev.cgpa) * Number(r.prev.credits))}</td><td>${fmt(Number(r.prev.cgpa))}</td></tr>`;
  rows += `<tr><td>Current semester</td><td>${r.sem.credits}</td><td>${fmt(r.sem.points)}</td><td>${fmt(r.sem.gpa)}</td></tr>`;
  rows += `<tr><th>Cumulative</th><th>${r.cum.totalCredits}</th><th>${fmt(r.cum.totalPoints)}</th><th>${fmt(r.cum.cgpa)}</th></tr>`;
  $("d-sem").innerHTML = rows;
  $("d-courses").innerHTML = r.courses
    .map(
      (c) =>
        `<tr><td>${esc(c.code)} ${esc(c.title)}</td><td>${c.credit}</td><td>${esc(c.grade)}</td><td>${fmt(c.points)}</td></tr>`,
    )
    .join("");
}
// Builds the grade point guide table from GRADE_SCALE
function renderGuide() {
  $("guide-body").innerHTML = Object.entries(GRADE_SCALE)
    .map(([g, p]) => `<tr><td>${g}</td><td>${fmt(p)}</td></tr>`)
    .join("");
}

/* 
   9. NAVIGATION  (single page: views are shown/hidden, no reloads)
    */

// Shows one view, highlights its nav buttons, and updates the URL hash (#calculator, ...)
function showView(name) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  document.querySelectorAll(".nav-btn").forEach((b) => {
    const on = b.dataset.view === name;
    b.classList.toggle("active", on);
    on
      ? b.setAttribute("aria-current", "page")
      : b.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  try {
    if (location.hash !== "#" + name)
      history.replaceState(null, "", "#" + name);
  } catch (e) {
    /* sandboxed frames may block this */
  }
}

/* 
   10. EVENT LISTENERS
    */

// One click listener handles all nav buttons and all remove (trash) buttons
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-view]");
  if (nav) return showView(nav.dataset.view);
  const rm = e.target.closest(".rm");
  if (rm) removeCourse(+rm.closest("tr").dataset.id);
});
// Copies what the user types/selects in a course row into the `courses` array
function onFieldChange(e) {
  const el = e.target,
    row = el.closest("tr");
  if (!row || !el.dataset.f) return;
  const c = courses.find((x) => x.id === +row.dataset.id);
  c[el.dataset.f] = el.dataset.f === "credit" ? Number(el.value) : el.value;
  el.classList.remove("bad");
  save();
  markStale();
}
$("course-body").addEventListener("input", onFieldChange);
$("course-body").addEventListener("change", onFieldChange);
$("prev-credits").addEventListener("input", (e) => {
  prev.credits = e.target.value;
  e.target.classList.remove("bad");
  save();
  markStale();
});
$("prev-cgpa").addEventListener("input", (e) => {
  prev.cgpa = e.target.value;
  e.target.classList.remove("bad");
  save();
  markStale();
});
$("confirm-dlg").addEventListener("close", () => {
  if ($("confirm-dlg").returnValue === "ok") doClear();
});
window.addEventListener("hashchange", () => {
  const v = location.hash.slice(1);
  if (VIEWS.includes(v)) showView(v);
});
$("add-course").addEventListener("click", addCourse);
$("clear-all").addEventListener("click", clearAll);
$("calculate").addEventListener("click", calculate);
$("recalc").addEventListener("click", () => {
  showView("calculator");
  calculate();
});

/* 
   11. START-UP
    */
load();
renderGuide();
renderCourses();
renderDetails();
$("prev-credits").value = prev.credits;
$("prev-cgpa").value = prev.cgpa;
const start = location.hash.slice(1);
showView(VIEWS.includes(start) ? start : "home");
