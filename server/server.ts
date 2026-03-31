import app from "./app";
import connectDb from "./utils/db";
import redisClient from "./utils/redis";
import dotenv from "dotenv";

dotenv.config();

const startServer = async () => {
  try {
    await connectDb(); // DB dulu
    redisClient(); // Redis

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
