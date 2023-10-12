import AppError from "../utils/error.utils.js";
import jwt from "jsonwebtoken";

const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    console.log('No token found');
    return next(new AppError('Unauthenticated, please login again', 400));
  }

  try {
    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
    req.user = userDetails;
    next();
  } catch (error) {
    console.log('JWT verification failed:', error);
    return next(new AppError('Invalid token or session expired', 401));
  }
};


const authorizeRoles = (...roles) => async (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to view this route', 403));
  }

  next();
};

export {
  isLoggedIn,
  authorizeRoles
};
