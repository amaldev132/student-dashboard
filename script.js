let role="";
let currentStudent="";
let loginType="";

const adminPassword="admin123";
const teacherPassword="teacher123";


/* DEFAULT STUDENTS */

const defaultStudents=[

{name:"IRFAN",prop:48,bg:1,comp:0,time:0,active:false,note:false},
{name:"ZIYAD",prop:47,bg:1,comp:0,time:0,active:false,note:false},
{name:"SETHU L K",prop:13,bg:1,comp:0,time:0,active:false,note:false},
{name:"SARANG",prop:4,bg:1,comp:0,time:0,active:false,note:false},
{name:"MHD AMAL",prop:17,bg:1,comp:0,time:0,active:false,note:false}

];


/* LOAD STUDENTS */

function loadStudents(){

let saved=JSON.parse(localStorage.getItem("students"));

if(!saved){

localStorage.setItem("students",JSON.stringify(defaultStudents));

return JSON.parse(JSON.stringify(defaultStudents));

}

return saved;

}

let students=loadStudents();


/* SAVE */

function saveData(){
localStorage.setItem("students",JSON.stringify(students));
}



/* LOGIN MODAL */

function loginAdmin(){

loginType="admin";

document.getElementById("modalTitle").innerText="Enter Admin Password";

document.getElementById("passwordModal").style.display="flex";

document.getElementById("passwordInput").focus();

}

function loginTeacher(){

loginType="teacher";

document.getElementById("modalTitle").innerText="Enter Teacher Password";

document.getElementById("passwordModal").style.display="flex";

document.getElementById("passwordInput").focus();

}



/* SUBMIT PASSWORD */

function submitPassword(){

let pass=document.getElementById("passwordInput").value.trim();

if(loginType==="admin" && pass===adminPassword){

role="admin";
closeModal();
openDashboard();

}

else if(loginType==="teacher" && pass===teacherPassword){

role="teacher";
closeModal();
openDashboard();

}

else{

alert("Wrong password");

}

}


function closeModal(){

document.getElementById("passwordModal").style.display="none";

document.getElementById("passwordInput").value="";

}



/* ENTER KEY PASSWORD */

document.addEventListener("keydown",function(e){

if(e.key==="Enter"){

let modal=document.getElementById("passwordModal");

if(modal.style.display==="flex"){
submitPassword();
}

}

});



/* STUDENT LOGIN */

function loginStudent(){

let name=document.getElementById("studentNameLogin").value.trim();

if(name===""){
alert("Enter student name");
return;
}

name=name.toUpperCase();

let found=students.find(s=>s.name===name);

if(!found){
alert("Student not found");
return;
}

currentStudent=name;

role="student";

openDashboard();

}



/* ENTER KEY STUDENT NAME */

document.addEventListener("DOMContentLoaded",function(){

let input=document.getElementById("studentNameLogin");

if(input){

input.addEventListener("keypress",function(e){

if(e.key==="Enter"){
loginStudent();
}

});

}

});



/* OPEN DASHBOARD */

function openDashboard(){

document.getElementById("loginPage").style.display="none";
document.getElementById("dashboard").style.display="block";

/* SHOW ADMIN PANEL */

if(role==="admin"){

let panel=document.getElementById("adminPanel");

if(panel){
panel.style.display="block";
}

}

renderTable();

}


function logout(){
location.reload();
}



/* TABLE */

function renderTable(){

let tbody=document.getElementById("tableBody");

tbody.innerHTML="";

students.forEach((s,i)=>{

let ttl=s.prop+s.bg;

let compControls="";

if(role==="admin" || role==="teacher" || (role==="student" && s.name===currentStudent)){

compControls=`
<button onclick="addComp(${i})">+</button>
<button onclick="removeComp(${i})">−</button>
<button onclick="resetComp(${i})">Reset</button>
`;

}


let statusHTML="";

if(s.active){

let noteText="";

if(s.note){
noteText=`<div class="activeNote">Deactivates after 24 hours</div>`;
}

statusHTML=`
<div>
<span class="activeText">Active</span>
${noteText}
</div>
`;

if(role==="admin" || role==="teacher"){

statusHTML+=`
<button class="resetActiveBtn" onclick="resetActive(${i})">Reset Active</button>
`;

}

}

else{

if(role==="admin" || role==="teacher" || (role==="student" && s.name===currentStudent)){

statusHTML=`
<span class="inactiveBadge">Inactive</span>
<button class="activateBtn" onclick="activateStudent(${i})">Activate</button>
`;

}

else{

statusHTML=`<span class="inactiveBadge">Inactive</span>`;

}

}


let row=document.createElement("tr");

row.innerHTML=`

<td>${i+1}</td>

<td>
${s.name}
${role==="admin" ? `<button class="deleteBtn" onclick="deleteStudentRow(${i})">X</button>` : ""}
</td>

<td>${s.prop}</td>
<td>${s.bg}</td>
<td>${ttl}</td>

<td class="compColumn">

<span class="compValue">${s.comp}</span>

<div class="compButtons">
${compControls}
</div>

</td>

<td>

<span id="timer${i}"></span>

${statusHTML}

</td>

`;

tbody.appendChild(row);

});

}



/* ACTIVATE */

function activateStudent(i){

if(!students[i].active){

students[i].active=true;
students[i].time=86400;
students[i].note=true;

saveData();
renderTable();

setTimeout(()=>{

students[i].note=false;

saveData();
renderTable();

},3000);

}

}



/* RESET ACTIVE */

function resetActive(i){

students[i].active=false;
students[i].time=0;
students[i].note=false;

saveData();
renderTable();

}



/* COMPLETION */

function addComp(i){

students[i].comp++;

saveData();
renderTable();

}

function removeComp(i){

if(students[i].comp>0){

students[i].comp--;

saveData();
renderTable();

}

}

function resetComp(i){

students[i].comp=0;

saveData();
renderTable();

}



/* ADD STUDENT WITH DETAILS */

function addStudent(){

if(role!=="admin"){
alert("Only admin can add students");
return;
}

let name=document.getElementById("newStudentName").value.trim().toUpperCase();
let prop=parseInt(document.getElementById("newStudentProp").value) || 0;
let bg=parseInt(document.getElementById("newStudentBg").value) || 0;
let comp=parseInt(document.getElementById("newStudentComp").value) || 0;

if(name===""){
alert("Enter student name");
return;
}

let exists=students.find(s=>s.name===name);

if(exists){
alert("Student already exists");
return;
}

students.push({
name:name,
prop:prop,
bg:bg,
comp:comp,
time:0,
active:false,
note:false
});

saveData();
renderTable();

/* clear inputs */

document.getElementById("newStudentName").value="";
document.getElementById("newStudentProp").value="";
document.getElementById("newStudentBg").value="";
document.getElementById("newStudentComp").value="";

}



/* DELETE STUDENT BY SL */

function deleteStudent(){

if(role!=="admin"){
alert("Only admin can delete students");
return;
}

let index=document.getElementById("deleteStudentIndex").value;

if(index===""){
alert("Enter student SL number");
return;
}

index=parseInt(index)-1;

if(index<0 || index>=students.length){
alert("Invalid SL number");
return;
}

if(!confirm("Delete "+students[index].name+" ?")) return;

students.splice(index,1);

saveData();
renderTable();

document.getElementById("deleteStudentIndex").value="";

}



/* DELETE BUTTON */

function deleteStudentRow(i){

if(role!=="admin") return;

if(!confirm("Delete "+students[i].name+" ?")) return;

students.splice(i,1);

saveData();
renderTable();

}



/* SEARCH */

function searchStudent(){

let input=document.getElementById("searchBox").value.toLowerCase();

let rows=document.querySelectorAll("#tableBody tr");

rows.forEach(r=>{

let name=r.children[1].innerText.toLowerCase();

r.style.display=name.includes(input)?"":"none";

});

}



/* EXPORT CSV */

function exportCSV(){

let csv="Name,PROP,BG,Total,COMP\n";

students.forEach(s=>{
csv+=`${s.name},${s.prop},${s.bg},${s.prop+s.bg},${s.comp}\n`;
});

let blob=new Blob([csv]);

let a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="students.csv";

a.click();

}



/* TIMER */

setInterval(()=>{

students.forEach((s,i)=>{

if(s.active){

if(s.time>0){

s.time--;

}else{

s.active=false;
s.time=0;
s.note=false;

saveData();
renderTable();

}

}

let h=Math.floor(s.time/3600);
let m=Math.floor((s.time%3600)/60);
let sec=s.time%60;

let el=document.getElementById("timer"+i);

if(el){

if(s.active){
el.innerText=`${h}h ${m}m ${sec}s`;
}else{
el.innerText="";
}

}

});

},1000);