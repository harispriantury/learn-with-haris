import { IUser } from "../models/user.model";
import { Response } from "express";
import NewRedisClient from "./redis";
import dotenv from "dotenv";

dotenv.config();
const redis = NewRedisClient();

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

const accessTokenExpired = parseInt(
  process.env.ACCESS_TOKEN_EXPIRED || "300",
  10,
);
const refreshTokenExpired = parseInt(
  process.env.REFRESH_TOKEN_EXPIRED || "1200",
  10,
);

export const accessTokenOption: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpired * 60 * 60 * 1000),
  maxAge: accessTokenExpired * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
};

export const refreshTokenOption: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpired * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpired * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  redis.set(user._id.toString(), JSON.stringify(user) as any);

  if (process.env.NODE_ENV === "production") {
    accessTokenOption.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOption);
  res.cookie("refresh_token", refreshToken, refreshTokenOption);

  return res.status(statusCode).json({
    success: true,
    user: user,
    accessToken: accessToken,
  });
};
