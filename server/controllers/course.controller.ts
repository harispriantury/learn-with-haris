import { json, NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../base/errorHandler";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/course.model";
import NewRedisClient from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMails";

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

// get course content
export const getCourseContentByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      const courseExist = userCourseList?.find(
        (course: any) => course._id.toString() === courseId,
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 400),
        );
      }

      const course = await CourseModel.findById(courseId);

      const content = course?.courseData;

      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error) {}
  },
);

// add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, question, contentId }: IAddQuestionData = req.body;
      if (!question) {
        return next(new ErrorHandler("Invalid quesion value", 400));
      }

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      //create a question object
      const newQuestion: any = {
        user: req.user,
        question: question,
        questionReplies: [],
      };

      courseContent.questions.push(newQuestion);

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error) {}
  },
);

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, contentId, courseId, questionId }: IAddAnswerData =
        req.body;

      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid course id", 400));
      }

      const courseContent = course?.courseData.find((item: any) =>
        item._id.equals(contentId),
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent?.questions?.find((item: any) => {
        return item._id.equals(questionId);
      });

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      //create new awser
      const newAnswer: any = {
        user: req.user,
        answer,
      };

      question.questionReplies?.push(newAnswer);

      if (req.user?._id === question?.user?._id) {
        // create notification comment soon
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };

        const html = await ejs.render(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data,
        );

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            data: data,
            template: "question-reply.ejs",
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
      await course?.save();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);
