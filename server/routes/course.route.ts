import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  editCourse,
  getAllCourses,
  getCourseById,
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

export default courseRouter;
