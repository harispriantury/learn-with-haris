import app from "./app";
import connectDb from "./utils/db";
import redisClient from "./utils/redis";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const startServer = async () => {
  try {
    await connectDb(); // DB
    redisClient(); // Redis

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME || "",
      api_key: process.env.CLOUD_API_KEY || "",
      api_secret: process.env.CLOUD_SECRET_KEY || "",
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
