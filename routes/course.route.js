import { Router } from "express";

const router = Router();

import {
  addLectureToCourseById,
  createCourse,
  deleteCourseById,
  getAllCourses,
  getLecturesByCourseId,
  removeLectureFromCourse,
  updateCourseById,
} from "../controller/course.controller.js";
import {
  authorizeRoles,
  isLoggedIn,
  authorizeSubscribers,
} from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

router
  .route("/")
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("thumbnail"),

    createCourse
  )

  .delete(isLoggedIn, authorizeRoles("ADMIN"), removeLectureFromCourse);

router
  .route("/:id")
  .get(isLoggedIn, authorizeSubscribers, getLecturesByCourseId) // Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures
  .post(
    isLoggedIn,
    authorizeRoles("ADMIN"),
    upload.single("lecture"),

    addLectureToCourseById
  )

  .put(isLoggedIn, authorizeRoles("ADMIN"), updateCourseById)
  .delete(isLoggedIn, authorizeRoles("ADMIN"), deleteCourseById);

export default router;
