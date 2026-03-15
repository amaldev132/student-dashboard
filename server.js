const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

// DATABASE PATH
const dbPath = path.join(__dirname, "database.json")

// SERVE FRONTEND FILES
app.use(express.static(path.join(__dirname, "../frontend")))


// LOGIN API
app.post("/api/login", (req,res)=>{

const {username,password} = req.body

const db = JSON.parse(fs.readFileSync(dbPath))

const user = db.users.find(
u => u.username === username && u.password === password
)

if(user){
res.json({success:true,role:user.role})
}else{
res.json({success:false})
}

})


// GET STUDENTS
app.get("/api/students",(req,res)=>{

const db = JSON.parse(fs.readFileSync(dbPath))
res.json(db.students)

})


// ADD STUDENT
app.post("/api/add-student",(req,res)=>{

const db = JSON.parse(fs.readFileSync(dbPath))

const student = req.body

student.id = Date.now()

db.students.push(student)

fs.writeFileSync(dbPath,JSON.stringify(db,null,2))

res.json({success:true})

})


// DELETE STUDENT
app.post("/api/delete-student",(req,res)=>{

const {id} = req.body

const db = JSON.parse(fs.readFileSync(dbPath))

db.students = db.students.filter(s => s.id != id)

fs.writeFileSync(dbPath,JSON.stringify(db,null,2))

res.json({success:true})

})


// LOAD FRONTEND
app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"../frontend/index.html"))
})


// START SERVER
const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
console.log("Server running on port",PORT)
})