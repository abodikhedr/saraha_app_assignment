import { Router } from "express";
import * as MS from "./message.service.js";
import { validation } from "../../common/middleware/validation.js";
import { createMessageSchema } from "./message.validator.js";
import { multerLocal } from "../../common/middleware/multer.js";
import { multer_Enum } from "../../common/enum/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.js";

const messageRouter = Router()

messageRouter.post("/", multerLocal({
    customPath: "messages",
    customTypes: multer_Enum.images
}).array("attachments"),
    validation(createMessageSchema),
    MS.createMessage
)

messageRouter.get("/",authentication,MS.getMessages)
messageRouter.get("/:id",authentication,MS.getMessageBYId)
messageRouter.delete("/:id",authentication,MS.deleteMessage)

export default messageRouter