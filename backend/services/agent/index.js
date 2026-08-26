import dotenv from "dotenv"
import express from "express"
import connectDb from "./config/db.js"
import router from "./routes/agent.route.js"
import e from "express"




dotenv.config()                  

const port = process.env.PORT

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use("/",router)

app.use((err,req,res,next)=>{
  console.log(err)

  if(err.status){
    return res.status(err.status).json(err.data)
  }

  return res.status(500).json({message:`agent error ${err?.message || err}`})

})


app.use("/" , (req,res)=>{
  res.json("hello form agent")
})

app.listen(port,()=>{
    console.log(`agent started at ${port}`)
    connectDb()
})
