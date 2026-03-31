import mongoose, { Document, Model, Schema } from "mongoose";
import bycrypt from "bcryptjs";
import jwt from "jsonwebtoken";
require("dotenv").config();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: IAvatar;
  role: string;
  isVerivied: boolean;
  courses: {
    courseId: string;
  }[];
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

export interface IAvatar {
  public_id: string;
  url: string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegex.test(value);
        },
        message: "Email is not valid",
      },
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [5, "Password must be at least 5 character"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerivied: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// hanlde hash before saving
userSchema.pre<IUser>("save", async function () {
  if (this.isModified("password")) {
    this.password = await bycrypt.hash(this.password, 10);
  }
});

// handle compare password
userSchema.methods.comparePassword = async function (inputPassword: string) {
  return await bycrypt.compare(inputPassword, this.password);
};

userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
};

userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
