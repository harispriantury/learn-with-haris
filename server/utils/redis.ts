import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let client: Redis;

const NewRedisClient = (): Redis => {
  if (!client) {
    if (!process.env.REDIS_URL) {
      throw new Error("Redis URL Not Found");
    }

    client = new Redis(process.env.REDIS_URL || "", {
      retryStrategy(times) {
        if (times > 3) {
          console.error("Redis retry stopped");
          return null;
        }
      },
    });

    client.on("connect", () => {
      console.log("Redis Connected");
    });

    client.on("error", (err) => {
      console.log("Redis Error ", err);
    });
  }
  return client;
};

export default NewRedisClient;
