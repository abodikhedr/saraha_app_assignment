import { success_response } from "../../common/utils/success.response.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";
import * as dbService from "../../DB/service/db.service.js";





export const createMessage = async (req, res, next) => {
    const { content, userId } = req.body
    if (!content && !req.files.length) {
        throw new Error("content is required");
    }
    const user = await dbService.findById({
        model: userModel,
        id: userId
    })
    if (!user) {
        throw new Error("user doesnt exist");
    }
        const paths = []
    if (req?.files?.length) {
        for (const file of req.files) {
            paths.push(file.path)
            console.log({ file });
        }
    }
    const message=await dbService.create({
        model:messageModel,
        data:{
            content,
            attachments:paths,
            userId
        }
    })
    return res.status(201).json({ message: "done", })
}

export const getMessages = async (req, res, next) => {
    const messages=await dbService.find({
        model:messageModel,
        filter:{
            userId:req.user._id
        }
    })
    if (!messages) {
        throw new Error("message not found");
    }
    return success_response({ res, statuscode: 201, message: "done",data:messages })

}

export const getMessageBYId = async (req, res, next) => {
    const message=await dbService.findOne({
        model:messageModel,
        filter:{
            _id:req.params.id,
            userId:req.user._id
        }
    })
    if (!message) {
        throw new Error("message not found");
    }
        return success_response({ res, statuscode: 200, message: "done",data:message })
}

export const deleteMessage = async (req, res, next) => {
    const message=await dbService.deleteOne({
        model:messageModel,
        filter:{
            _id:req.params.id,
            userId:req.user._id
        }
    })
    if (!message) {
        throw new Error("message not found");
    }
    return success_response({ res, statuscode: 200, message: "message deleted"})

}