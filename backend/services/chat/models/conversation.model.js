import mongoose from "mongoose"
const conversationSchema = new mongoose.Schema({
    title: {
        type: String,
        default: "New Chat"
    },
    userId: {
        type: String
    },
    type: {
        type: String,
        enum: ["chat", "project"],
        default: "chat"
    },
    projectFiles: [{
        name: String,
        content: String
    }]
},{ timestamps: true })

const Conversation = mongoose.model("Conversation", conversationSchema)
export default Conversation
