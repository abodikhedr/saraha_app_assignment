
import express from "express"
import connectionDB from "./DB/connectionDB.js"
import userRouter from "./modules/users/user.controller.js"
import cors from "cors"
import { redisConnection } from "./DB/connection.redis.js"
import messageRouter from "./modules/messages/message.controller.js"
import { ALLOW_ORIGINS, PORT } from "../config/config.service.js"
import rateLimit from "express-rate-limit"
import helmet from "helmet"
const app = express()
const port = PORT

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    skipSuccessfulRequests:true

})
console.log(ALLOW_ORIGINS);

const bootstrap = async () => {
    app.use(limiter)

    
    app.use(cors({
        origin: function (origin, callback) {
            if ([...ALLOW_ORIGINS,undefined].includes(origin)) {
                callback(null,true)
            }
            else{
                callback(new Error("origin not allowed"))
            }
        }
    }))




    app.use(helmet())
    app.use(express.json())
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "welcome to my app" })
    })

    connectionDB()
    redisConnection()
    app.use("/users", userRouter)
    app.use("/messages", messageRouter)




    app.use("{/*demo}", (req, res, next) => {
        throw new Error(`url:${req.originalUrl} with method:${req.method} not found`, { cause: 404 })
    })



    app.use((err, req, res, next) => {
        console.log(err);
        if (err.code == 11000) {
            const field = Object.keys(err.keyValue)[0]
            res.status(409).json({
                message: `${field} already found`,
                code: err.code
            })
        }

        res.status(err.cause || 500).json({
            message: err.message,
            code: err.code,
            stack: err.stack,
        })
    });


    app.listen(port, () => {
        console.log(`server running on port ${port}`);
    })
}

export default bootstrap