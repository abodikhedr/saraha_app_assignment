import jwt from "jsonwebtoken"
import userModel from "../../DB/models/user.model.js"
import * as dbService from "../../DB/service/db.service.js"
import { ttl } from "../../DB/service/redis.service.js"
import { ACCESS_TOKEN_SEGNATURE } from "../../../config/config.service.js"






export const authentication = async (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        throw new Error("token doesnt exist", { cause: 404 })
    }
    const decoded = jwt.verify(authorization, ACCESS_TOKEN_SEGNATURE)
    if (!decoded?.id) {
        throw new Error("inValid token", { cause: 400 })
    }
    const user = await dbService.findOne({
        model: userModel,
        filter: {
            _id: decoded.id
        }
    })
    if (Math.floor(user.changeCredentialAt?.getTime() / 1000) > decoded?.iat) {
        throw new Error("token expired you must login again");
    }
    if (await ttl(`revoke_token::${user._id}::${decoded.jti}`) > 0) {
        
        throw new Error("inValid token please login again");
    }
        console.log(await ttl(`revoke_token::${user._id}::${decoded.jti}`));

    req.decoded = decoded
    req.user = user
    next()
}