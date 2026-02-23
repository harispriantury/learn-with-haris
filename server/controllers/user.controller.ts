import { NextFunction, Request, Response } from "express";
import {} from "../";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../base/errorHandler";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
require("dotenv").config();

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IRegistrationBody;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email is already exist", 400));
      }

      const user: IRegistrationBody = { name, password, email };

      const activationToken = generateActivationCode(user);
      const activationCode = activationToken.activationCode;

      const data = { user: user.name, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data,
      );
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const generateActivationCode = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user: user,
      activationCode: activationCode,
    },
    process.env.ACTIVATION_SCREET as Secret,
    {
      expiresIn: "5m",
    },
  );
  return {
    token,
    activationCode,
  };
};
