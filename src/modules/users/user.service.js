import { decrypt, Encrypt } from "../../common/security/encrypit.js"
import { compare, hash } from "../../common/security/hash.js"
import * as dbService from "../../DB/service/db.service.js"
import userModel from "../../DB/models/user.model.js"
import jwt from "jsonwebtoken"
import { OAuth2Client } from 'google-auth-library'
import { providerEnum } from "../../common/enum/user.enum.js"
import { randomUUID } from "crypto"
import { deleteKey, exists, getValue, incr, keys, setValue, ttl } from "../../DB/service/redis.service.js"
import { generate_otp, sendEmail } from "../../common/services/sendEmail.js"
import { eventEmitter } from "../../common/utils/events.js"
import { sendEmailOtp } from "./user.helper.js"
import { template } from "../../common/utils/html.templates.js"
import { ACCESS_TOKEN_SEGNATURE, AUDIANCE_EMAIL, REFRESH_TOKEN_SEGNATURE } from "../../../config/config.service.js"
import { success_response } from "../../common/utils/success.response.js"
const client = new OAuth2Client();



//================sign up================
export const signup = async (req, res, next) => {

    const { email, password, fName, lName, age, gender, phone } = req.body
    const paths = []
    for (const file of req.files.attachments) {
        paths.push(file.path)
        console.log({ file });
    }
    const otp = await generate_otp()
    const hashOtp = await hash(otp, 12)
    await setValue({
        key: `otp::${email}`,
        value: hashOtp,
        ttl: 60 * 2
    })
    await setValue({
        key: `otp::max::${email}`,
        value: 1,
        ttl: 60 * 5
    })
    const user = await dbService.create({
        model: userModel,
        data: {
            email,
            password: await hash(password),
            fName,
            lName,
            age,
            gender,
            phone: Encrypt(phone),
            profileImage: req.files.attachment[0].path,
            coverImages: paths
        },
    })
    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: email,
            subject: "confirm email",
            html: template.otpmail(otp)
        })
    }
    )
    success_response({ res, statuscode: 201, message: "user created successfully", data: user })
}

//================resendOtp================
export const resendOtp = async (req, res, next) => {
    const { email } = req.body
    await sendEmailOtp({
        email: email,
        isConfirmed: false
    })
    success_response({ res, statuscode: 201, message: "otp resent successfully" })

}

//================sign up with gmail================
export const signupWithGmail = async (req, res, next) => {

    const { idToken } = req.body
    const ticket = await client.verifyIdToken({
        idToken,
        audience: AUDIANCE_EMAIL // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const { family_name, given_name, picture, email, email_verified } = ticket.getPayload();
    // This ID is unique to each Google Account, making it suitable for use as a primary key
    // during account lookup. Email is not a good choice because it can be changed by the user.
    let user = await dbService.findOne({
        model: userModel,
        filter: {
            email: email.toLowerCase()
        }
    })
    if (!user) {
        user = await dbService.create({
            model: userModel,
            data: {
                email,
                fName: given_name,
                lName: family_name,
                profileImage: picture,
                isConfirmed: email_verified,
                provider: providerEnum.google
            }
        })
    }
    if (user.provider == providerEnum.system) {
        throw new Error("please sign in through the system")
    }

    const access_token = jwt.sign({
        id: user._id,
        email: user.email,

    }, ACCESS_TOKEN_SEGNATURE,
        {
            expiresIn: "60s",


        })
    const refresh_token = jwt.sign({
        id: user._id,
        email: user.email,

    }, REFRESH_TOKEN_SEGNATURE)

    success_response({ res, statuscode: 201, message: "successfully signed in", data: { access_token, refresh_token } })



}

//================confirmOtp================
export const confirmOtp = async (req, res, next) => {

    const { email, otp } = req.body
    const otpValue = await getValue(`otp::${email}`)
    if (!otpValue) {
        throw new Error("otp expired");
    }
    if (! await compare(otp, otpValue)) {
        throw new Error("inValid otp");
    }
    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: {
            email,
            isConfirmed: false
        },
        update: {
            isConfirmed: true
        }
    })
    if (!user) {
        throw new Error("user doesnt exist or already confirmed");
    }
    deleteKey(`otp::${email}`)
    success_response({ res, statuscode: 200, message: "email confirmed" })

}

//================sign in================
export const signin = async (req, res, next) => {
    const tokenId = randomUUID()
    const { email, password } = req.body
    const attempts = await getValue(`attempts::${email}`)
    if (! await exists(`attempts::${email}`)) {
        await setValue({
            key: `attempts::${email}`,
            value: 0,
            ttl: 5 * 60
        })
    }
    const isBlocked = await ttl(`attempts::block::${email}`)
    if (isBlocked > 0) {
        throw new Error(`you have been blocked please try again in ${isBlocked} seconds`);
    }
    if (attempts >= 5) {
        await setValue({
            key: `attempts::block::${email}`,
            value: "1",
            ttl: 5 * 60
        })
        throw new Error("reached the maximum number of attempts please try again in 5 minutes");
    }
    const user = await dbService.findOne({
        model: userModel,
        filter: {
            email: email.toLowerCase(),
            provider: providerEnum.system
        }
    })
    if (!user || ! await compare(password, user.password)) {
        await incr(`attempts::${email}`)
        throw new Error("invalid credentials", { cause: 401 })
    }
    if (user.isConfirmed == false) {
        throw new Error("user isnt confirmed", { cause: 400 })
    }
    if (!user.twoStepVerification) {
        const access_token = jwt.sign({
            id: user._id,
            email: user.email,
            phone: decrypt(user.phone),
        }, ACCESS_TOKEN_SEGNATURE,
            {
                expiresIn: "400s",
                audience: "http://localhost:4000",
                issuer: "http://localhost:3000",
                jwtid: tokenId
            })
        const refresh_token = jwt.sign({
            id: user._id,
            email: user.email,
            phone: decrypt(user.phone)
        }, REFRESH_TOKEN_SEGNATURE, {
            expiresIn: "4000s",
            audience: "http://localhost:4000",
            issuer: "http://localhost:3000",
            jwtid: tokenId
        })
        deleteKey(`attempts::${email}`)
        success_response({ res, statuscode: 200, message: "successfully signed in", data: { access_token, refresh_token } })
    }
    const otp = await generate_otp()
    const hashOtp = await hash(otp)
    await setValue({
        key: `otp::2SV::${email}`,
        value: hashOtp,
        ttl: 5 * 60
    })
    eventEmitter.emit("confirm_email", async () => {
        await sendEmail({
            to: email,
            subject: "two step verification otp",
            html: template.otpmail(otp)
        })
    }
    )
    success_response({ res, statuscode: 200, message: "otp sent to your email" })

}

//================get profile================
export const getProfile = async (req, res, next) => {

    const user = req.user

    success_response({ res, statuscode: 200, message: "found profile", data: user })


}

//================share profile================
export const shareProfile = async (req, res, next) => {

    const id = req.params.id
    const user = await dbService.findById({
        model: userModel,
        id,
        options: { password: 0 }
    })
    if (!user) {
        throw new Error("user doesnt exist", { cause: 404 })

    }
    user.phone = decrypt(user.phone)
    success_response({ res, statuscode: 200, message: "found profile", data: user })


}

//================refresh token================
export const refreshToken = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        throw new Error("token doesnt exist", { cause: 404 })
    }
    const decoded = jwt.verify(authorization, "test2")
    if (!decoded?.id) {
        throw new Error("inValid token", { cause: 400 })
    }
    const user = await dbService.findOne({
        model: userModel,
        filter: {
            _id: decoded.id
        }
    })
    const access_token = jwt.sign({
        id: user._id,
        email: user.email,
        phone: decrypt(user.phone)
    }, ACCESS_TOKEN_SEGNATURE,
    )
    return success_response({ res, statuscode: 201, message: "done", data: access_token })


}

//================update profile================
export const updateProfile = async (req, res, next) => {

    const { fName, lName, age, gender, phone } = req.body
    let updateQuery = {}
    if (fName !== undefined) {
        updateQuery.fName = fName
    }
    if (lName !== undefined) {
        updateQuery.lName = lName
    }
    if (age !== undefined) {
        updateQuery.age = age
    }
    if (gender !== undefined) {
        updateQuery.gender = gender
    }
    if (phone !== undefined) {
        updateQuery.phone = Encrypt(phone)
    }

    let user = await dbService.findByIdAndUpdate({
        model: userModel,
        id: req.user._id,
        update: updateQuery
    })

    return success_response({ res, statuscode: 200, message: "done" })

}

//================update password================
export const updatePassword = async (req, res, next) => {

    const { old_password, new_password } = req.body
    if (!await compare(old_password, req.user.password)) {
        throw new Error("inValid old password");
    }
    req.user.password = await hash(new_password)
    await req.user.save()
    return success_response({ res, statuscode: 200, message: "done" })

}

//================log out================
export const logOut = async (req, res, next) => {
    const { flag } = req.query

    if (flag == "all") {
        req.user.changeCredentialAt = new Date()
        await req.user.save()

        await deleteKey(await keys(`revoke_token::${req.user._id}`))
    } else {
        console.log(req.decoded.exp - Math.floor(Date.now() / 1000));

        await setValue({
            key: `revoke_token::${req.user._id}::${req.decoded.jti}`,
            value: `${req.decoded.jti}`,
            ttl: req.decoded.exp - Math.floor(Date.now() / 1000)
        })
    }
    return success_response({ res, statuscode: 200, message: "successfully logged out" })

}

//================forget password================
export const forgetPassword = async (req, res, next) => {
    const { email } = req.body
    await sendEmailOtp({
        email: email,
        isConfirmed: true
    })
    return success_response({ res, statuscode: 200, message: "password otp generated successfully" })

}

//================confirm password================
export const confirmPasswordOtp = async (req, res, next) => {
    const { email, otp, newPass } = req.body
    const hashotp = await getValue(`otp::${email}`)
    if (!hashotp) {
        throw new Error("you should forget password first");

    }
    if (!await compare(otp, hashotp)) {
        throw new Error("inValid otp");
    }
    const user = await dbService.findOneAndUpdate({
        model: userModel,
        filter: {
            email: email,
            isConfirmed: true
        },
        update: {
            password: await hash(newPass)
        }
    })
    if (!user) {
        throw new Error("user not found");

    }
    await deleteKey(`otp::${email}`)
        return success_response({ res, statuscode: 200, message: "successfully changed password" })


}

//================enable 2 step verfication================
export const enable2SV = async (req, res, next) => {
    const user = req.user
    if (user.twoStepVerification == true) {
        throw new Error("two step verification already enabled");
    }
    user.twoStepVerification = true
    await user.save()
        return success_response({ res, statuscode: 200, message: "enabled two step verfication" })

}

//================confirm 2 step verfication================
export const confirm2SV = async (req, res, next) => {
    const { email, otp } = req.body
    const isblocked = await ttl(`attempts::block::${email}`)
    if (isblocked > 0) {
        throw new Error(`you have been blocked please try again in ${isblocked} seconds`);
    }
    const attempts = await getValue(`attempts::${email}`)
    if (! await exists(`attempts::${email}`)) {
        await setValue({
            key: `attempts::${email}`,
            value: 0,
            ttl: 5 * 60
        })
    }
    if (attempts >= 5) {
        await setValue({
            key: `attempts::block::${email}`,
            value: "1",
            ttl: 5 * 60
        })
        throw new Error("reached the maximum number of attempts please try again in 5 minutes");
    }
    const hashOtp = await getValue(`otp::2SV::${email}`)
    if (!hashOtp) {
        throw new Error("please resend the otp");
    }
    if (! await compare(otp, hashOtp)) {
        await incr(`attempts::${email}`)
        throw new Error("inValid otp");
    }
    const user = await dbService.findOne({
        model: userModel,
        filter: {
            email: email.toLowerCase(),
        }
    })
    if (!user) {
        throw new Error("user not found");
    }
    const tokenId = randomUUID()
    const access_token = jwt.sign({
        id: user._id,
        email: user.email,
        phone: decrypt(user.phone),
    }, ACCESS_TOKEN_SEGNATURE,
        {
            expiresIn: "400s",
            audience: "http://localhost:4000",
            issuer: "http://localhost:3000",
            jwtid: tokenId
        })
    const refresh_token = jwt.sign({
        id: user._id,
        email: user.email,
        phone: decrypt(user.phone)
    }, REFRESH_TOKEN_SEGNATURE, {
        expiresIn: "4000s",
        audience: "http://localhost:4000",
        issuer: "http://localhost:3000",
        jwtid: tokenId
    })
    await deleteKey(`otp::2SV::${email}`)
    await deleteKey(`attempts::${email}`)
    return success_response({ res, statuscode: 200, message: "successfully signed in", data: { access_token, refresh_token } })

}