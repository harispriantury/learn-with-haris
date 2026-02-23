import {} from "ioredis";
require("dotenv").config();

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis Connected");
    return process.env.REDIS_URL;
  } else {
    throw new Error("Redis not connected");
  }
};

export default redisClient;
