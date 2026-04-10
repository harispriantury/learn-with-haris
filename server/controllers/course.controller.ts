import { json, NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../base/errorHandler";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import NewRedisClient from "../utils/redis";

const redis = NewRedisClient();

// upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

//update course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.url,
        };
      }
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        {
          new: true,
        },
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get single course
export const getCourseById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(String(courseId));

      let course;

      if (isCacheExist) {
        course = JSON.parse(isCacheExist);
      } else {
        course = await CourseModel.findById(req.params.id).select(
          "-courseData.videUrl -courseData.suggestion -courseData.questions -courseData.links",
        );
        redis.set(String(courseId), JSON.stringify(course));
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let courses;
      const isCacheExist = await redis.get("all-courses");
      if (isCacheExist) {
        courses = JSON.parse(isCacheExist);
      } else {
        courses = await CourseModel.find().select(
          "-courseData.videUrl -courseData.suggestion -courseData.questions -courseData.links",
        );
        redis.set("all-course", JSON.stringify(courses));
      }

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  },
);
