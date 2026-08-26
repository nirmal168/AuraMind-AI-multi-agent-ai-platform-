import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/db.js"
import router from "./routes/authRoute.js"

dotenv.config()

const port = process.env.PORT

const app = express()
app.use(express.json())
app.use("/",router)
app.use("/" , (req,res)=>{
  res.json("hello form auth")
})

app.listen(port,()=>{
    console.log(`auth started at ${port}`)
    connectDb()
})
