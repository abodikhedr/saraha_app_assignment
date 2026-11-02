import { deleteKey, getValue, incr, setValue, ttl } from "../../DB/service/redis.service.js";
import * as dbService from "../../DB/service/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { generate_otp, sendEmail } from "../../common/services/sendEmail.js";
import { hash } from "bcrypt";
import { eventEmitter } from "../../common/utils/events.js";
import { template } from "../../common/utils/html.templates.js";



export const sendEmailOtp = async ({ email, isConfirmed = false, }) => {
    const isBlocked = await ttl(`otp::block::${email}`)
    if (isBlocked > 0) throw new Error(`you are blocked,you can resend otp after ${isBlocked}`);
    const ttlOtp = await ttl(`otp::${email}`)
    if (ttlOtp > 0) throw new Error(`you can resend otp after ${ttlOtp}`);
    const max_otp = await getValue(`otp::max::${email}`)
    if (max_otp >= 3) {
        await setValue({
            key: `otp::block::${email}`,
            value: "1",
            ttl: 60 * 5
        })
        await deleteKey(`otp::max::${email}`)
        throw new Error("you have exceeded the maximum number of tries");
    }
    const user = await dbService.findOne({
        model: userModel,
        filter: {
            email: email,
            isConfirmed:isConfirmed
        }
    })
    if (!user) throw new Error("email doesnt exist or user is already confirmed");
    const otp = await generate_otp()
    const hashOtp = await hash(otp, 12)
    await setValue({
        key: `otp::${email}`,
        value: hashOtp,
        ttl: 60 * 2
    })
    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: email,
            subject: "confirm email",
            html: template.otpmail(otp)
        })
    }
    )
    await incr(`otp::max::${email}`)
}