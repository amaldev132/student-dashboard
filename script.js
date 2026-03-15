const JSONBIN_ID  = "69b6ad84aa77b81da9e7f7f0";
const JSONBIN_KEY = "$2a$10$BCQJfJsKGvF89LyZm9cU5.3xhRWFppe0QkbCg2pus/vIzTZKTVr0m";

var role = "";
var currentStudent = "";
var loginType = "";
var adminPassword   = "admin123";
var teacherPassword = "teacher123";
var students = [];
var autoRefreshInterval = null;
var saving = false;

/* LOAD */
async function loadStudents(){
  try {
    var res = await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_ID + "/latest", {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    var data = await res.json();
    if(data.record && Array.isArray(data.record)){
      students = data.record;
    }
  } catch(e){ console.error("Load failed:", e); }
}

/* SAVE - body wrapped in { record: [...] } as JSONBin requires */
async function saveStudents(){
  saving = true;
  showLoading(true);
  try {
    var res = await fetch("https://api.jsonbin.io/v3/b/" + JSONBIN_ID, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify({ record: students })
    });
    if(!res.ok){
      var err = await res.text();
      console.error("Save failed:", res.status, err);
      showStatus("Save failed " + res.status, true);
    } else {
      showStatus("Saved", false);
      /* reload so all devices see latest */
      await loadStudents();
      renderTable();
    }
  } catch(e){
    console.error("Save error:", e);
    showStatus("Network error", true);
  }
  saving = false;
  showLoading(false);
}

/* STATUS BADGE */
function showLoading(show){
  var el = document.getElementById("loadingMsg");
  if(!el){
    el = document.createElement("div");
    el.id = "loadingMsg";
    el.style.cssText = "position:fixed;top:16px;right:20px;background:#7c6af7;color:#fff;padding:8px 18px;border-radius:20px;font-size:13px;font-family:monospace;z-index:9999;display:none;box-shadow:0 4px 16px rgba(124,106,247,0.4);";
    el.innerText = "Syncing...";
    document.body.appendChild(el);
  }
  el.style.display = show ? "block" : "none";
}
function showStatus(msg, isError){
  var el = document.getElementById("loadingMsg");
  if(!el) return;
  el.innerText = msg;
  el.style.background = isError ? "#ff3355" : "#00cc6a";
  el.style.display = "block";
  setTimeout(function(){
    el.style.display = "none";
    el.innerText = "Syncing...";
    el.style.background = "#7c6af7";
  }, 2500);
}

/* LOGIN */
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
  } else { alert("Wrong password"); }
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

/* STUDENT LOGIN */
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

/* OPEN DASHBOARD */
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

  /* AUTO-REFRESH — skips if saving is in progress */
  if(autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(async function(){
    if(!saving){
      await loadStudents();
      renderTable();
    }
  }, 5000);
}
function logout(){
  if(autoRefreshInterval) clearInterval(autoRefreshInterval);
  location.reload();
}

/* RENDER TABLE */
function renderTable(){
  var tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  var countEl = document.getElementById("tableCount");
  if(countEl) countEl.textContent = students.length + " students";
  students.forEach(function(s, i){
    var ttl = s.prop + s.bg;
    var compControls = "";
    if(role === "admin" || role === "teacher" || (role === "student" && s.name === currentStudent)){
      compControls =
        '<button onclick="addComp(' + i + ')">+</button>' +
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
        statusHTML = '<span class="inactiveBadge">Inactive</span><button class="activateBtn" onclick="activateStudent(' + i + ')">Activate</button>';
      } else {
        statusHTML = '<span class="inactiveBadge">Inactive</span>';
      }
    }
    var deleteBtn = role === "admin" ? '<button class="deleteBtn" onclick="deleteStudentRow(' + i + ')">X</button>' : "";
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + (i+1) + "</td>" +
      "<td>" + s.name + " " + deleteBtn + "</td>" +
      "<td>" + s.prop + "</td>" +
      "<td>" + s.bg + "</td>" +
      "<td>" + ttl + "</td>" +
      '<td class="compColumn"><span class="compValue">' + s.comp + '</span><div class="compButtons">' + compControls + "</div></td>" +
      "<td><span id='timer" + i + "'></span>" + statusHTML + "</td>";
    tbody.appendChild(row);
  });
}

/* ACTIVATE */
async function activateStudent(i){
  if(students[i].active) return;
  students[i].active = true;
  students[i].time   = 86400;
  students[i].note   = true;
  await saveStudents();
  setTimeout(async function(){
    students[i].note = false;
    await saveStudents();
  }, 3000);
}
async function resetActive(i){
  students[i].active = false;
  students[i].time   = 0;
  students[i].note   = false;
  await saveStudents();
}

/* COMP */
async function addComp(i){
  students[i].comp++;
  await saveStudents();
}
async function removeComp(i){
  if(students[i].comp <= 0) return;
  students[i].comp--;
  await saveStudents();
}
async function resetComp(i){
  students[i].comp = 0;
  await saveStudents();
}

/* ADD STUDENT */
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
  document.getElementById("newStudentName").value = "";
  document.getElementById("newStudentProp").value = "";
  document.getElementById("newStudentBg").value   = "";
  document.getElementById("newStudentComp").value = "";
}

/* DELETE STUDENT */
async function deleteStudent(){
  if(role !== "admin"){ alert("Only admin can delete students"); return; }
  var index = document.getElementById("deleteStudentIndex").value;
  if(index === ""){ alert("Enter student SL number"); return; }
  index = parseInt(index) - 1;
  if(index < 0 || index >= students.length){ alert("Invalid SL number"); return; }
  if(!confirm("Delete " + students[index].name + " ?")) return;
  students.splice(index, 1);
  await saveStudents();
  document.getElementById("deleteStudentIndex").value = "";
}
async function deleteStudentRow(i){
  if(role !== "admin") return;
  if(!confirm("Delete " + students[i].name + " ?")) return;
  students.splice(i, 1);
  await saveStudents();
}

/* SEARCH */
function searchStudent(){
  var input = document.getElementById("searchBox").value.toLowerCase();
  document.querySelectorAll("#tableBody tr").forEach(function(r){
    r.style.display = r.children[1].innerText.toLowerCase().includes(input) ? "" : "none";
  });
}

/* EXPORT CSV */
function exportCSV(){
  var csv = "Name,PROP,BG,Total,COMP\n";
  students.forEach(function(s){
    csv += s.name + "," + s.prop + "," + s.bg + "," + (s.prop+s.bg) + "," + s.comp + "\n";
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv]));
  a.download = "students.csv";
  a.click();
}

/* TIMER */
var timerSaveTick = 0;
setInterval(function(){
  students.forEach(function(s, i){
    if(s.active){
      if(s.time > 0){ s.time--; }
      else {
        s.active = false; s.time = 0; s.note = false;
        saveStudents();
      }
    }
    var h = Math.floor(s.time/3600);
    var m = Math.floor((s.time%3600)/60);
    var sec = s.time%60;
    var el = document.getElementById("timer"+i);
    if(el) el.innerText = s.active ? (h+"h "+m+"m "+sec+"s") : "";
  });
  timerSaveTick++;
  if(timerSaveTick >= 60){
    timerSaveTick = 0;
    if(students.some(function(s){ return s.active; })) saveStudents();
  }
}, 1000);
