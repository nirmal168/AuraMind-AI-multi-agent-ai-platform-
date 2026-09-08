import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, "../.env") })
dotenv.config()

const connectDb = async () =>{
    try {
        const uri = process.env.MONGO_URI
        if (!uri) {
            console.error("❌ MONGO_URI is not set in environment variables!")
            return
        }
        await mongoose.connect(uri)
        console.log("DataBase is connected ")
    } catch (error) {
        console.log(`db error ${error}`)
    }
}

export default connectDb;