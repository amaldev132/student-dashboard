/* =====================================================
   FILL IN YOUR 2 JSONBIN VALUES BELOW BEFORE DEPLOYING
   ===================================================== */

const JSONBIN_ID  = "69b6a663c3097a1dd528c13c";      // put your Bin ID here
const JSONBIN_KEY = "$2a$10$BCQJfJsKGvF89LyZm9cU5.3xhRWFppe0QkbCg2pus/vIzTZKTVr0m";  // put your Master Key here

/* ===================================================== */

let role = "";
let currentStudent = "";
let loginType = "";

const adminPassword   = "admin123";
const teacherPassword = "teacher123";

let students = [];
let autoRefreshInterval = null;
let isSaving = false;


async function loadStudents(){
  try {
    const res = await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_ID + "/latest", {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    if(Array.isArray(data.record)) students = data.record;
  } catch(e) {
    console.error("Load failed", e);
  }
}

async function saveStudents(){
  if(isSaving) return;
  isSaving = true;
  showLoading(true);
  try {
    await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_ID, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify(students)
    });
  } catch(e) {
    console.error("Save failed", e);
    alert("Could not save. Check internet connection.");
  }
  isSaving = false;
  showLoading(false);
}

function showLoading(show){
  let el = document.getElementById("loadingMsg");
  if(!el){
    el = document.createElement("div");
    el.id = "loadingMsg";
    el.style.cssText = "position:fixed;top:16px;right:20px;background:#7c6af7;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;font-family:monospace;z-index:9999;display:none;box-shadow:0 4px 16px rgba(124,106,247,0.4);";
    el.innerText = "Syncing...";
    document.body.appendChild(el);
  }
  el.style.display = show ? "block" : "none";
}

function loginAdmin(){
  loginType = "admin";
  document.getElementById("modalTitle").innerText = "Enter Admin Password";
  document.getElementById("passwordModal").style.display = "flex";
  document.getElementById("passwordInput").focus();
}

function loginTeacher(){
  loginType = "teacher";
  document.getElementById("modalTitle").innerText = "Enter Teacher Password";
  document.getElementById("passwordModal").style.display = "flex";
  document.getElementById("passwordInput").focus();
}

function submitPassword(){
  var pass = document.getElementById("passwordInput").value.trim();
  if(loginType === "admin" && pass === adminPassword){
    role = "admin"; closeModal(); openDashboard();
  } else if(loginType === "teacher" && pass === teacherPassword){
    role = "teacher"; closeModal(); openDashboard();
  } else {
    alert("Wrong password");
  }
}

function closeModal(){
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("passwordInput").value = "";
}

document.addEventListener("keydown", function(e){
  if(e.key === "Enter" && document.getElementById("passwordModal").style.display === "flex"){
    submitPassword();
  }
});

async function loginStudent(){
  var name = document.getElementById("studentNameLogin").value.trim();
  if(name === ""){ alert("Enter student name"); return; }
  name = name.toUpperCase();
  showLoading(true);
  await loadStudents();
  showLoading(false);
  var found = students.find(function(s){ return s.name === name; });
  if(!found){ alert("Student not found"); return; }
  currentStudent = name;
  role = "student";
  openDashboard();
}

document.addEventListener("DOMContentLoaded", function(){
  var input = document.getElementById("studentNameLogin");
  if(input){
    input.addEventListener("keypress", function(e){
      if(e.key === "Enter") loginStudent();
    });
  }
});

async function openDashboard(){
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  var tag = document.getElementById("roleTag");
  if(tag) tag.textContent = role.toUpperCase();

  var title = document.getElementById("dashTitle");
  if(title && role === "student") title.textContent = "Welcome, " + currentStudent;

  if(role === "admin"){
    var panel = document.getElementById("adminPanel");
    if(panel) panel.style.display = "block";
  }

  showLoading(true);
  await loadStudents();
  showLoading(false);
  renderTable();

  if(autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(async function(){
    if(!isSaving){
      await loadStudents();
      renderTable();
    }
  }, 8000);
}

function logout(){
  if(autoRefreshInterval) clearInterval(autoRefreshInterval);
  location.reload();
}

function renderTable(){
  var tbody = document.getElementById("tableBody"); var countEl = document.getElementById("tableCount"); if(countEl) countEl.textContent = students.length + " students";
  tbody.innerHTML = "";

  students.forEach(function(s, i){
    var ttl = s.prop + s.bg;

    var compControls = "";
    if(role === "admin" || role === "teacher" || (role === "student" && s.name === currentStudent)){
      compControls = '<button onclick="addComp(' + i + ')">+</button>' +
                     '<button onclick="removeComp(' + i + ')">-</button>' +
                     '<button onclick="resetComp(' + i + ')">Reset</button>';
    }

    var statusHTML = "";
    if(s.active){
      var noteText = s.note ? '<div class="activeNote">Deactivates after 24 hours</div>' : "";
      statusHTML = '<div><span class="activeText">Active</span>' + noteText + '</div>';
      if(role === "admin" || role === "teacher"){
        statusHTML += '<button class="resetActiveBtn" onclick="resetActive(' + i + ')">Reset Active</button>';
      }
    } else {
      if(role === "admin" || role === "teacher" || (role === "student" && s.name === currentStudent)){
        statusHTML = '<span class="inactiveBadge">Inactive</span>' +
                     '<button class="activateBtn" onclick="activateStudent(' + i + ')">Activate</button>';
      } else {
        statusHTML = '<span class="inactiveBadge">Inactive</span>';
      }
    }

    var deleteBtn = role === "admin" ? '<button class="deleteBtn" onclick="deleteStudentRow(' + i + ')">X</button>' : "";

    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (i + 1) + "</td>" +
      "<td>" + s.name + " " + deleteBtn + "</td>" +
      "<td>" + s.prop + "</td>" +
      "<td>" + s.bg + "</td>" +
      "<td>" + ttl + "</td>" +
      '<td class="compColumn"><span class="compValue">' + s.comp + '</span><div class="compButtons">' + compControls + "</div></td>" +
      "<td><span id='timer" + i + "'></span>" + statusHTML + "</td>";

    tbody.appendChild(row);
  });
}

async function activateStudent(i){
  if(!students[i].active){
    students[i].active = true;
    students[i].time   = 86400;
    students[i].note   = true;
    await saveStudents();
    renderTable();
    setTimeout(async function(){
      students[i].note = false;
      await saveStudents();
      renderTable();
    }, 3000);
  }
}

async function resetActive(i){
  students[i].active = false;
  students[i].time   = 0;
  students[i].note   = false;
  await saveStudents();
  renderTable();
}

async function addComp(i){
  students[i].comp++;
  await saveStudents();
  renderTable();
}

async function removeComp(i){
  if(students[i].comp > 0){
    students[i].comp--;
    await saveStudents();
    renderTable();
  }
}

async function resetComp(i){
  students[i].comp = 0;
  await saveStudents();
  renderTable();
}

async function addStudent(){
  if(role !== "admin"){ alert("Only admin can add students"); return; }
  var name = document.getElementById("newStudentName").value.trim().toUpperCase();
  var prop = parseInt(document.getElementById("newStudentProp").value) || 0;
  var bg   = parseInt(document.getElementById("newStudentBg").value)   || 0;
  var comp = parseInt(document.getElementById("newStudentComp").value) || 0;
  if(name === ""){ alert("Enter student name"); return; }
  if(students.find(function(s){ return s.name === name; })){ alert("Student already exists"); return; }
  students.push({ id: Date.now(), name: name, prop: prop, bg: bg, comp: comp, time: 0, active: false, note: false });
  await saveStudents();
  renderTable();
  document.getElementById("newStudentName").value = "";
  document.getElementById("newStudentProp").value = "";
  document.getElementById("newStudentBg").value   = "";
  document.getElementById("newStudentComp").value = "";
}

async function deleteStudent(){
  if(role !== "admin"){ alert("Only admin can delete students"); return; }
  var index = document.getElementById("deleteStudentIndex").value;
  if(index === ""){ alert("Enter student SL number"); return; }
  index = parseInt(index) - 1;
  if(index < 0 || index >= students.length){ alert("Invalid SL number"); return; }
  if(!confirm("Delete " + students[index].name + " ?")) return;
  students.splice(index, 1);
  await saveStudents();
  renderTable();
  document.getElementById("deleteStudentIndex").value = "";
}

async function deleteStudentRow(i){
  if(role !== "admin") return;
  if(!confirm("Delete " + students[i].name + " ?")) return;
  students.splice(i, 1);
  await saveStudents();
  renderTable();
}

function searchStudent(){
  var input = document.getElementById("searchBox").value.toLowerCase();
  document.querySelectorAll("#tableBody tr").forEach(function(r){
    r.style.display = r.children[1].innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

function exportCSV(){
  var csv = "Name,PROP,BG,Total,COMP\n";
  students.forEach(function(s){
    csv += s.name + "," + s.prop + "," + s.bg + "," + (s.prop + s.bg) + "," + s.comp + "\n";
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "students.csv";
  a.click();
}

var timerSaveTick = 0;

setInterval(function(){
  students.forEach(function(s, i){
    if(s.active){
      if(s.time > 0){ s.time--; }
      else {
        s.active = false; s.time = 0; s.note = false;
        saveStudents(); renderTable();
      }
    }
    var h   = Math.floor(s.time / 3600);
    var m   = Math.floor((s.time % 3600) / 60);
    var sec = s.time % 60;
    var el  = document.getElementById("timer" + i);
    if(el) el.innerText = s.active ? (h + "h " + m + "m " + sec + "s") : "";
  });
  timerSaveTick++;
  if(timerSaveTick >= 60){
    timerSaveTick = 0;
    if(students.some(function(s){ return s.active; })) saveStudents();
  }
}, 1000);
