import mongoose from "mongoose"

const connectDb = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DataBase is connected ")
    } catch (error) {
        console.log(`db error ${error}`)
    }
}

export default connectDb;