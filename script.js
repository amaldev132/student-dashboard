// ============================================================
//  FIREBASE CONFIG — replace these values with your own project
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getDatabase, ref, onValue, push, update, remove, set
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAiT52KuA3Dwlbz47hgRvxpOOM6ryHoX6s",
  authDomain:        "student-dashboard-4f780.firebaseapp.com",
  databaseURL:       "https://student-dashboard-4f780-default-rtdb.firebaseio.com",
  projectId:         "student-dashboard-4f780",
  storageBucket:     "student-dashboard-4f780.firebasestorage.app",
  messagingSenderId: "651813426401",
  appId:             "1:651813426401:web:c694f61f71313ff186d3a0",
  measurementId:     "G-8RDYN0PXEG"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ============================================================
//  APP STATE
// ============================================================
var role            = "";
var currentStudent  = "";
var loginType       = "";
var adminPassword   = "admin123";
var teacherPassword = "teacher123";

// Local mirror of DB data: { firebaseKey: { name, prop, bg, comp, time, active, note } }
var studentsMap = {};

// ============================================================
//  REALTIME LISTENER — attaches once after login
// ============================================================
function attachRealtimeListener() {
  const studentsRef = ref(db, "students");
  onValue(studentsRef, (snapshot) => {
    studentsMap = snapshot.val() || {};
    renderTable();
  });
}

// ============================================================
//  FIREBASE CRUD
// ============================================================

/* Add a new student */
async function addStudentDB(name, prop, bg, comp) {
  const studentsRef = ref(db, "students");
  await push(studentsRef, {
    name:   name,
    prop:   prop,
    bg:     bg,
    comp:   comp,
    time:   0,
    active: false,
    note:   false
  });
}

/* Update any fields on a student */
async function updateStudentDB(key, fields) {
  const studentRef = ref(db, "students/" + key);
  await update(studentRef, fields);
}

/* Delete a student */
async function deleteStudentDB(key) {
  const studentRef = ref(db, "students/" + key);
  await remove(studentRef);
}

// ============================================================
//  STATUS BADGE
// ============================================================
function showStatus(msg, isError) {
  var el = document.getElementById("loadingMsg");
  if (!el) {
    el = document.createElement("div");
    el.id = "loadingMsg";
    el.style.cssText = "position:fixed;top:16px;right:20px;background:#7c6af7;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;font-family:monospace;z-index:9999;display:none;box-shadow:0 4px 16px rgba(124,106,247,0.4);";
    document.body.appendChild(el);
  }
  el.innerText   = msg;
  el.style.background = isError ? "#ff3355" : "#00cc6a";
  el.style.display    = "block";
  setTimeout(function () {
    el.style.display    = "none";
    el.style.background = "#7c6af7";
  }, 2500);
}

// ============================================================
//  LOGIN
// ============================================================
window.loginAdmin = function () {
  loginType = "admin";
  document.getElementById("modalTitle").innerText = "Enter Admin Password";
  document.getElementById("passwordModal").style.display = "flex";
  document.getElementById("passwordInput").focus();
};

window.loginTeacher = function () {
  loginType = "teacher";
  document.getElementById("modalTitle").innerText = "Enter Teacher Password";
  document.getElementById("passwordModal").style.display = "flex";
  document.getElementById("passwordInput").focus();
};

window.submitPassword = function () {
  var pass = document.getElementById("passwordInput").value.trim();
  if (loginType === "admin" && pass === adminPassword) {
    role = "admin"; closeModal(); openDashboard();
  } else if (loginType === "teacher" && pass === teacherPassword) {
    role = "teacher"; closeModal(); openDashboard();
  } else {
    alert("Wrong password");
  }
};

window.closeModal = function () {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("passwordInput").value = "";
};

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && document.getElementById("passwordModal").style.display === "flex") {
    window.submitPassword();
  }
});

/* Student login — checks if name exists in Firebase */
window.loginStudent = async function () {
  var name = document.getElementById("studentNameLogin").value.trim();
  if (name === "") { alert("Enter student name"); return; }
  name = name.toUpperCase();

  // Pull once to verify
  const studentsRef = ref(db, "students");
  onValue(studentsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const found = Object.values(data).find(s => s.name === name);
    if (!found) {
      alert("Student not found");
    } else {
      currentStudent = name;
      role = "student";
      openDashboard();
    }
  }, { onlyOnce: true });
};

document.addEventListener("DOMContentLoaded", function () {
  var input = document.getElementById("studentNameLogin");
  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") window.loginStudent();
    });
  }
});

// ============================================================
//  OPEN DASHBOARD
// ============================================================
function openDashboard() {
  document.getElementById("loginPage").style.display  = "none";
  document.getElementById("dashboard").style.display  = "block";

  var tag = document.getElementById("roleTag");
  if (tag) tag.textContent = role.toUpperCase();

  var title = document.getElementById("dashTitle");
  if (title && role === "student") title.textContent = "Welcome, " + currentStudent;

  if (role === "admin") {
    var panel = document.getElementById("adminPanel");
    if (panel) panel.style.display = "block";
  }

  // Attach the realtime listener — all updates flow through here
  attachRealtimeListener();
}

window.logout = function () {
  location.reload();
};

// ============================================================
//  RENDER TABLE
// ============================================================
function renderTable() {
  var tbody   = document.getElementById("tableBody");
  tbody.innerHTML = "";

  var countEl = document.getElementById("tableCount");
  var entries = Object.entries(studentsMap); // [ [key, student], ... ]

  if (countEl) countEl.textContent = entries.length + " students";

  entries.forEach(function ([key, s], i) {
    var ttl = (s.prop || 0) + (s.bg || 0);
    var compControls = "";

    if (role === "admin" || role === "teacher" ||
        (role === "student" && s.name === currentStudent)) {
      compControls =
        '<button onclick="addComp(\'' + key + '\')">+</button>' +
        '<button onclick="removeComp(\'' + key + '\')">-</button>' +
        '<button onclick="resetComp(\'' + key + '\')">Reset</button>';
    }

    var statusHTML = "";
    if (s.active) {
      var noteText = s.note ? '<div class="activeNote">Deactivates after 24 hours</div>' : "";
      statusHTML   = '<div><span class="activeText">Active</span>' + noteText + '</div>';
      if (role === "admin" || role === "teacher") {
        statusHTML += '<button class="resetActiveBtn" onclick="resetActive(\'' + key + '\')">Reset Active</button>';
      }
    } else {
      if (role === "admin" || role === "teacher" ||
          (role === "student" && s.name === currentStudent)) {
        statusHTML =
          '<span class="inactiveBadge">Inactive</span>' +
          '<button class="activateBtn" onclick="activateStudent(\'' + key + '\')">Activate</button>';
      } else {
        statusHTML = '<span class="inactiveBadge">Inactive</span>';
      }
    }

    var deleteBtn = role === "admin"
      ? '<button class="deleteBtn" onclick="deleteStudentRow(\'' + key + '\')">X</button>'
      : "";

    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (i + 1) + "</td>" +
      "<td>" + s.name + " " + deleteBtn + "</td>" +
      "<td>" + (s.prop || 0) + "</td>" +
      "<td>" + (s.bg   || 0) + "</td>" +
      "<td>" + ttl + "</td>" +
      '<td class="compColumn"><span class="compValue">' + (s.comp || 0) + '</span>' +
        '<div class="compButtons">' + compControls + "</div></td>" +
      "<td><span id='timer_" + key + "'></span>" + statusHTML + "</td>";
    tbody.appendChild(row);
  });
}

// ============================================================
//  ACTIVATE
// ============================================================
window.activateStudent = async function (key) {
  if (studentsMap[key] && studentsMap[key].active) return;
  await updateStudentDB(key, { active: true, time: 86400, note: true });
  // Clear the "note" flag after 3 s
  setTimeout(async function () {
    await updateStudentDB(key, { note: false });
  }, 3000);
};

window.resetActive = async function (key) {
  await updateStudentDB(key, { active: false, time: 0, note: false });
};

// ============================================================
//  COMP
// ============================================================
window.addComp = async function (key) {
  var cur = (studentsMap[key] && studentsMap[key].comp) || 0;
  await updateStudentDB(key, { comp: cur + 1 });
};

window.removeComp = async function (key) {
  var cur = (studentsMap[key] && studentsMap[key].comp) || 0;
  if (cur <= 0) return;
  await updateStudentDB(key, { comp: cur - 1 });
};

window.resetComp = async function (key) {
  await updateStudentDB(key, { comp: 0 });
};

// ============================================================
//  ADD STUDENT (admin only)
// ============================================================
window.addStudent = async function () {
  if (role !== "admin") { alert("Only admin can add students"); return; }
  var name = document.getElementById("newStudentName").value.trim().toUpperCase();
  var prop = parseInt(document.getElementById("newStudentProp").value) || 0;
  var bg   = parseInt(document.getElementById("newStudentBg").value)   || 0;
  var comp = parseInt(document.getElementById("newStudentComp").value) || 0;
  if (name === "") { alert("Enter student name"); return; }

  var duplicate = Object.values(studentsMap).find(s => s.name === name);
  if (duplicate) { alert("Student already exists"); return; }

  try {
    await addStudentDB(name, prop, bg, comp);
    showStatus("Student added", false);
    document.getElementById("newStudentName").value = "";
    document.getElementById("newStudentProp").value = "";
    document.getElementById("newStudentBg").value   = "";
    document.getElementById("newStudentComp").value = "";
  } catch (e) {
    console.error(e);
    showStatus("Add failed", true);
  }
};

// ============================================================
//  DELETE STUDENT (admin only)
// ============================================================
window.deleteStudent = async function () {
  if (role !== "admin") { alert("Only admin can delete students"); return; }
  var indexInput = document.getElementById("deleteStudentIndex").value;
  if (indexInput === "") { alert("Enter student SL number"); return; }
  var idx = parseInt(indexInput) - 1;
  var entries = Object.entries(studentsMap);
  if (idx < 0 || idx >= entries.length) { alert("Invalid SL number"); return; }
  var [key, student] = entries[idx];
  if (!confirm("Delete " + student.name + " ?")) return;
  try {
    await deleteStudentDB(key);
    showStatus("Deleted", false);
    document.getElementById("deleteStudentIndex").value = "";
  } catch (e) {
    console.error(e);
    showStatus("Delete failed", true);
  }
};

window.deleteStudentRow = async function (key) {
  if (role !== "admin") return;
  var s = studentsMap[key];
  if (!s || !confirm("Delete " + s.name + " ?")) return;
  try {
    await deleteStudentDB(key);
    showStatus("Deleted", false);
  } catch (e) {
    console.error(e);
    showStatus("Delete failed", true);
  }
};

// ============================================================
//  SEARCH
// ============================================================
window.searchStudent = function () {
  var input = document.getElementById("searchBox").value.toLowerCase();
  document.querySelectorAll("#tableBody tr").forEach(function (r) {
    r.style.display = r.children[1].innerText.toLowerCase().includes(input) ? "" : "none";
  });
};

// ============================================================
//  EXPORT CSV
// ============================================================
window.exportCSV = function () {
  var csv = "Name,PROP,BG,Total,COMP\n";
  Object.values(studentsMap).forEach(function (s) {
    csv += s.name + "," + (s.prop||0) + "," + (s.bg||0) + "," +
           ((s.prop||0)+(s.bg||0)) + "," + (s.comp||0) + "\n";
  });
  var a  = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "students.csv";
  a.click();
};

// ============================================================
//  COUNTDOWN TIMER  (client-side only; time is synced to DB
//  every 60 s so all tabs stay in rough sync)
// ============================================================
var timerSaveTick = 0;

setInterval(function () {
  Object.entries(studentsMap).forEach(function ([key, s]) {
    if (s.active) {
      if (s.time > 0) {
        s.time--;        // decrement local mirror only
      } else {
        // Time up — reset in DB
        updateStudentDB(key, { active: false, time: 0, note: false });
        return;
      }
    }

    // Update the timer span if visible
    var el = document.getElementById("timer_" + key);
    if (el) {
      if (s.active) {
        var h   = Math.floor(s.time / 3600);
        var m   = Math.floor((s.time % 3600) / 60);
        var sec = s.time % 60;
        el.innerText = h + "h " + m + "m " + sec + "s";
      } else {
        el.innerText = "";
      }
    }
  });

  // Persist time every 60 s for any active student
  timerSaveTick++;
  if (timerSaveTick >= 60) {
    timerSaveTick = 0;
    Object.entries(studentsMap).forEach(function ([key, s]) {
      if (s.active) {
        updateStudentDB(key, { time: s.time });
      }
    });
  }
}, 1000);
