import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { roleEnum } from "../../common/enum/user.enum.js";
import { validation } from "../../common/middleware/validation.js";
import { confirm2SVSchema, confirmOtpSchema, confirmPasswordOtpSchema, forgetPasswordSchema, refreshTokenSchema, resendOtpSchema, shareProfileSchema, signInSchema, signUpSchema, updatePasswordSchema, updateProfileSchema } from "./user.validation.js";
import { multerLocal } from "../../common/middleware/multer.js";

const userRouter = Router({})

userRouter.post("/signup/gmail", US.signupWithGmail)
userRouter.post("/",
    multerLocal({ customPath: "users", customTypes: ["image/jpeg"] }).fields([
        { name: "attachments", maxCount: 2 },
        { name: "attachment", maxCount: 1 }
    ]),
    validation(signUpSchema),
    US.signup)
userRouter.post("/signin", validation(signInSchema), US.signin)
userRouter.post("/confirm_otp", validation(confirmOtpSchema), US.confirmOtp)

userRouter.get("/profile", authentication, authorization("user"), US.getProfile)

userRouter.post("/refresh_token", validation(refreshTokenSchema), US.refreshToken)
userRouter.get("/share_profile/:id",validation(shareProfileSchema), US.shareProfile)
userRouter.patch("/update_profile",validation(updateProfileSchema),authentication, US.updateProfile)
userRouter.patch("/update_password",validation(updatePasswordSchema),authentication, US.updatePassword)
userRouter.post("/resend_otp",validation(resendOtpSchema), US.resendOtp)
userRouter.post("/forget_password",validation(forgetPasswordSchema), US.forgetPassword)
userRouter.post("/confirm_password",validation(confirmPasswordOtpSchema), US.confirmPasswordOtp)
userRouter.post("/enable_2SV",authentication, US.enable2SV)
userRouter.post("/confirm_2SV",validation(confirm2SVSchema), US.confirm2SV)
userRouter.patch("/logOut",authentication, US.logOut)


export default userRouter