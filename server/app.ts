import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ErrorMiddleware } from "./middleware/error";
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.ORIGIN,
  }),
);

app.get("/test", (_req: Request, res: Response, _: NextFunction) => {
  res.json("ok");
});
//lskdjlfkj

// app.all("/.*/", (req: Request, res: Response, next: NextFunction) => {
//   const error = new Error(
//     `Request with url : ${req.originalUrl} is not found`,
//   ) as any;
//   error.statusCode = 404;
//   next(error);
// });

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(
    `Request with url : ${req.originalUrl} is not found`,
  );
  error.statusCode = 404;
  next(error);
});

app.use(ErrorMiddleware);

export default app;
