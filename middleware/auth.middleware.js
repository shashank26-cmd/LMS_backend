import AppError from "../utils/error.utils.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies; //We have used cookieParser in app.js thats why i can abstract token from cookies.

  if (!token) {
    console.log("No token found");
    return next(new AppError("Unauthenticated, please login again", 400));
  }

  try {
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

    req.user = userDetails;
  } catch (error) {
    console.log("JWT verification failed:", error);
    return next(new AppError("Invalid token or session expired", 401));
  }
  next();
};

const authorizeRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentUserRoles = req.user.role;

    if (!roles.includes(currentUserRoles)) {
      return next(
        new AppError("You do not have permission to view this route", 403)
      );
    }
    console.log(authorizeRoles);
    next();
  };
const authorizeSubscribers = async (req, _res, next) => {
  // If user is not admin or does not have an active subscription then error else pass

  const user = await User.findById(req.user.id);
  if (user.role !== "ADMIN" && user.subscription.status !== "active") {
    return next(new AppError("Please subscribe to access this route.", 403));
  }

  next();
};

export { isLoggedIn, authorizeRoles, authorizeSubscribers };
