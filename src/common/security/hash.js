import { compareSync, hashSync } from "bcrypt"
import { SALT_ROUNDS } from "../../../config/config.service.js"



export const hash =async(plainText,saltRounds=SALT_ROUNDS)=>{
    return hashSync(plainText,saltRounds)
}

export const compare =async(plainText,hashedText)=>{
    return compareSync(plainText,hashedText)
}