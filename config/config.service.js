import { config } from "dotenv"
import {resolve} from "node:path"
const NODE_ENV=process.env.NODE_ENV
config({path:resolve(`config/.env.${NODE_ENV}`)})


export const PORT = +process.env.PORT
export const DB_URI = process.env.DB_URI
export const REDIS_URL = process.env.REDIS_URL
export const USER_EMAIL = process.env.USER_EMAIL
export const USER_PASSWORD= process.env.USER_PASSWORD
export const ALLOW_ORIGINS=process.env.ALLOW_ORIGINS.split(",") || []
export const ENCRYPTION_KEYS=process.env.ENCRYPTION_KEYS
export const ACCESS_TOKEN_SEGNATURE=process.env.ACCESS_TOKEN_SEGNATURE
export const REFRESH_TOKEN_SEGNATURE=process.env.REFRESH_TOKEN_SEGNATURE
export const AUDIANCE_EMAIL =process.env.AUDIANCE_EMAIL 
export const  SALT_ROUNDS=+process.env.SALT_ROUNDS








