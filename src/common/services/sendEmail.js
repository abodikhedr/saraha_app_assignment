import nodemailer from "nodemailer";
import {randomInt, randomUUID} from "crypto"
import { USER_EMAIL, USER_PASSWORD } from "../../../config/config.service.js";


export const sendEmail = async ({ to, subject, html, attachments = [] } = {}) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: USER_EMAIL,
            pass: USER_PASSWORD
        }
    })

    const info = await transporter.sendMail({
        from: `"abodi" <${USER_EMAIL}>`,
        to: to,
        subject: subject,
        html: html || "<h1>hello<h1>",
        attachments: attachments
    })


    return info.accepted.length > 0 ? true : false
}

export const generate_otp=async()=>{
    return  randomInt(100000,1000000).toString()
}
