import Conversation from "../models/conversation.model.js"
import Message from "../models/message.model.js"

export const createConversation = async (req,res) =>{
    try {
        const userId = req.headers["x-user-id"]
        const { title, type, projectFiles } = req.body || {}
        const queryType = req.query?.type
        const conversationType = type || queryType || "chat"
        const conversationTitle = title || (conversationType === "project" ? "New Project" : "New Chat")

        const conversation = await Conversation.create({
            userId: userId,
            title: conversationTitle,
            type: conversationType,
            projectFiles: projectFiles || []
        })
        return res.status(200).json(conversation)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`create conversation error ${error}`})
    }
}

export const getConversations = async (req , res) =>{
      try {
        const userId = req.headers["x-user-id"]
        const conversations = await Conversation.find({
            userId:userId
        }).sort({updatedAt:-1})
        return res.status(200).json(conversations)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`create conversation error ${error}`})
    }
}

export const updateConversation = async (req , res) =>{
      try {
        const {id,title,type,projectFiles} = req.body
        const updateFields = {}
        if (title !== undefined) updateFields.title = title
        if (type !== undefined) updateFields.type = type
        if (projectFiles !== undefined) updateFields.projectFiles = projectFiles

        const conversation = await Conversation.findByIdAndUpdate(id, updateFields, { new: true })
        return res.status(200).json(conversation)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`update conversation error ${error}`})
    }
}

export const saveMessage = async (req,res) =>{
    try {
        const {conversationId, role,content,images,artifacts} = req.body
        const message = await Message.create({
            conversationId,
            role,
            content,
            images,
            artifacts
        })
        
        return res.status(200).json(message)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`save message error ${error}`})
    }
}


export const getMessages = async (req,res) =>{
    try {
        const messages = await Message.find({
            conversationId:req.params.conversationId
        })
        
        return res.status(200).json(messages)
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:`get messages error ${error}`})
    }
}

export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params
        await Conversation.findByIdAndDelete(conversationId)
        await Message.deleteMany({ conversationId })
        return res.status(200).json({ message: "Conversation deleted successfully", conversationId })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `delete conversation error ${error}` })
    }
}

