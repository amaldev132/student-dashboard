const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const DB_FILE = path.join(__dirname,"database.json");

function readDB(){
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data){
  fs.writeFileSync(DB_FILE,JSON.stringify(data,null,2));
}

/* LOGIN */

app.post("/login",(req,res)=>{

const {username,password}=req.body;

const db=readDB();

const user=db.users.find(
u=>u.username===username && u.password===password
);

if(user){
res.json({success:true,role:user.role});
}else{
res.json({success:false});
}

});

/* GET STUDENTS */

app.get("/students",(req,res)=>{

const db=readDB();

res.json(db.students);

});

/* UPDATE COMPLETION */

app.post("/update",(req,res)=>{

const {id,comp}=req.body;

const db=readDB();

const student=db.students.find(s=>s.id==id);

if(!student){
return res.json({success:false});
}

student.completion=comp;

writeDB(db);

res.json({success:true});

});

/* ACTIVATE */

app.post("/activate",(req,res)=>{

const {id}=req.body;

const db=readDB();

const student=db.students.find(s=>s.id==id);

student.status="active";

writeDB(db);

res.json({success:true});

});

/* RESET ACTIVE */

app.post("/resetActive",(req,res)=>{

const {id}=req.body;

const db=readDB();

const student=db.students.find(s=>s.id==id);

student.status="inactive";

writeDB(db);

res.json({success:true});

});

/* ADD STUDENT */

app.post("/addStudent",(req,res)=>{

const {name,prop,bg,comp}=req.body;

const db=readDB();

db.students.push({
id:Date.now(),
name,
proposal:prop,
background:bg,
completion:comp,
status:"inactive"
});

writeDB(db);

res.json({success:true});

});

/* DELETE */

app.post("/deleteStudent",(req,res)=>{

const {id}=req.body;

const db=readDB();

db.students=db.students.filter(s=>s.id!=id);

writeDB(db);

res.json({success:true});

});

app.listen(3000,()=>{
console.log("Server running on port 3000");
});