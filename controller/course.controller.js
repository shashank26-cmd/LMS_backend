import Course from "../models/course.model.js";

import AppError from "../utils/error.utils.js";
import fs from "fs/promises";

import cloudinary from "cloudinary";

//Only Courses not lectures
const getAllCourses = async function (req, res, next) {
  const courses = await Course.find({}).select("-lectures");

  res.status(200).json({
    success: true,
    message: "All courses",
    courses,
  });
};
const getLecturesByCourseId = async function (req, res, next) {
  const { id } = req.params;

  const course = await Course.findById(id);

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Course lectures fetched successfully",
    lectures: course.lectures,
  });
};
const createCourse = async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;

  if (!title || !description || !category || !createdBy) {
    return next(new AppError("All fields are required", 400));
  }

  const course = await Course.create({
    title,
    description,
    category,
    createdBy,
    thumbnail: {
      public_id: "Dummy",
      secure_url: "Dummy",
    },
  });

  if (!course) {
    return next(
      new AppError("Course could not be created, please try again", 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        width: 250,
        height: 250,
        gravity: "faces", // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: "fill",
        // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);
    } catch (error) {
      // Send the error message
      return next(new AppError("File not uploaded, please try again", 400));
    }
  }

  // Save the changes
  await course.save();

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};

const updateCourseById = async (req, res, next) => {
  // Extracting the course id from the request params
  const { id } = req.params;

  // Finding the course using the course id
  const course = await Course.findByIdAndUpdate(
    id,
    {
      $set: req.body, // This will only update the fields which are present
    },
    {
      runValidators: true, // This will run the validation checks on the new data
    }
  );

  // If no course found then send the response for the same
  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 400));
  }

  // Sending the response after success
  res.status(200).json({
    success: true,
    message: "Course updated successfully",
  });
};
const removeLectureFromCourse = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.query;
    if (!courseId) {
      return next(new AppError("Course ID is required", 400));
    }
    if (!lectureId) {
      return next(new AppError("Lecture ID is required", 400));
    }
    const course = await Course.findById({ _id: courseId });
    if (!course) {
      return next(new AppError("Invalid ID or Course does not exist.", 404));
    }
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );
    if (lectureIndex === -1) {
      return next(new AppError("Lecture does not exist.", 404));
    }

    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      {
        resource_type: "video",
      }
    );
    course.lectures.splice(lectureIndex, 1);
    course.numbersOfLectures = course.lectures.length;
    await course.save();
    res.status(200).json({
      success: true,
      message: "Course lecture removed successfully",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

const deleteCourseById = async (req, res, next) => {
  // Extracting id from the request parameters
  const { id } = req.params;

  // Finding the course via the course ID
  const course = await Course.findById(id);

  // If course not find send the message as stated below
  if (!course) {
    return next(new AppError("Course with given id does not exist.", 404));
  }

  // Remove course
  //    await course.remove();

  await Course.findByIdAndDelete(id);
  // Send the message as response
  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
};

const addLectureToCourseById = async (req, res, next) => {
  const { title, description } = req.body;
  const { id } = req.params;

  if (!title || !description) {
    return next(new AppError("Title and Description are required", 400));
  }

  try {
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Invalid course id or course not found.", 400));
    }

    const lectureData = {
      title,
      description,
      lecture: {}, // Initialize the lecture object
    };

    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
        chunk_size: 5000000000,
        resource_type: "video",
      });

      if (result) {
        lectureData.lecture.public_id = result.public_id;
        lectureData.lecture.secure_url = result.secure_url;
      }

      // Remove the file from local storage after successful upload
      fs.rm(`uploads/${req.file.filename}`);
    }

    course.lectures.push(lectureData);
    course.numberOfLectures = course.lectures.length;

    // Save the course object
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course lecture added successfully",
      course,
    });
  } catch (error) {
    // Handle any other errors
    return next(new AppError(error.message || "Internal Server Error", 500));
  }
};

export {
  getAllCourses,
  getLecturesByCourseId,
  createCourse,
  updateCourseById,
  removeLectureFromCourse,
  deleteCourseById,
  addLectureToCourseById,
};
