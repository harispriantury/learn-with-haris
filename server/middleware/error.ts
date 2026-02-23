import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../base/errorHandler";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Sever Error";

  //handle error connection mongoose
  if (err.name === "CastError") {
    const message = `Recources not found, Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //handle error duplicate
  if (err.code === 11000) {
    const message = `Duplicate ${[Object.keys(err.keyValue)]} entered`;
    err = new ErrorHandler(message, 400);
  }

  //handle error jwt
  if (err.name === "JsonWebTokenError") {
    const message = `Json web token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  //handle error jwt expired
  if (err.name === "TokenExpiredError") {
    const message = `Json web token is expired, try again`;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    code: err.statusCode,
  });
};
