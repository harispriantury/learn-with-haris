import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addQuestion,
  editCourse,
  getAllCourses,
  getCourseById,
  getCourseContentByUser,
  uploadCourse,
} from "../controllers/course.controller";
const courseRouter = express.Router();

courseRouter.post(
  "/courses",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse,
);
courseRouter.put(
  "/courses/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse,
);

courseRouter.get("/courses/:id", getCourseById);
courseRouter.get("/courses", getAllCourses);
courseRouter.get(
  "/courses-content/:id",
  isAuthenticated,
  getCourseContentByUser,
);
courseRouter.post("/questions", isAuthenticated, addQuestion);
courseRouter.post("/answers", isAuthenticated, addAnswer);

export default courseRouter;
