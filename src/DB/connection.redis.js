
import { createClient } from "redis"
import { REDIS_URL } from "../../config/config.service.js";

export const redis_client = createClient({
    url: REDIS_URL
});
export const redisConnection = async () => {
    try {

        await redis_client.connect();
        console.log("redis connected successfuly");

    } catch (error) {
        console.log("redis failed to connect");
    }
}





