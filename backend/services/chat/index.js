import express from "express"
import dotenv from "dotenv"
import connectDb from "./config/db.js"
import router from "./routes/chatRoute.js"


dotenv.config()

const port = process.env.PORT

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use("/",router)
app.use("/" , (req,res)=>{
  res.json("hello form chat")
})

app.listen(port,()=>{
    console.log(`chat started at ${port}`)
    connectDb()
})
