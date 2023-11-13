import User from "../models/userModel.js";
import AppError from "../utils/error.utils.js";
import cloudinary from 'cloudinary';
import path from "path";
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Fixed a typo here (added an extra '0')
    httpOnly: true,
    secure: true
};

 const register = async (req, res, next) => {
    // Destructuring the necessary data from req object
    console.log(req.body)
    const { fullName, email, password } = req.body;
  
    // Check if the data is there or not, if not throw error message
    if (!fullName || !email || !password) {
      return next(new AppError('All fields are required', 400));
    }
  
    // Check if the user exists with the provided email
    const userExists = await User.findOne({ email });
  
    // If user exists send the reponse
    if (userExists) {
      return next(new AppError('Email already exists', 409));
    }
  
    // Create new user with the given necessary data and save to DB
    const user = await User.create({
      fullName,
      email,
      password,
      avatar: {
        public_id: email,
        secure_url:
          'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
      },
    });
  
    // If user not created send message response
    if (!user) {
      return next(
        new AppError('User registration failed, please try again later', 400)
      );
    }
  
    // Run only if user sends a file
    console.log('FILE details >',JSON.stringify(req.file));
    if (req.file) {
      try {
        console.log('starting img upload to cloudinary')
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
          width: 250,
          height: 250,
          gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
          crop: 'fill',
        });
  console.log('image uploaded susccefully')
        // If success
        console.log(result);
        if (result) {
          // Set the public_id and secure_url in DB
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
  
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`)
                  }
      } catch (error) {
        return next(
          new AppError(error || 'File not uploaded, please try again', 400)
        );
      }
    }
  
    // Save the user object
    await user.save();
  
    // Generating a JWT token
    const token = await user.generateJWTToken();
  
    // Setting the password to undefined so it does not get sent in the response
    user.password = undefined;
  
    // Setting the token in the cookie with name token along with cookieOptions
    res.cookie('token', token, cookieOptions);
  
    // If all good send the response to the frontend
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
}
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('All fields are required', 400));
        }
        const user = await User.findOne({ email }).select('+password');
        if (!(user && (await user.comparePassword(password)))) {
            return next(new AppError('Email or password does not match', 400));
        }
        const token = await user.generateJWTToken();

        user.password = undefined;

        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            message: 'User login successful',
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

const logout = (req, res,next) => {
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        message: 'User logout successful'
    });
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id; // this we will  get from auth middleware 
        const user = await User.findById(userId); // Changed from findOne
        res.status(200).json({
            success: true,
            message: 'User details',
            user
        });
    } catch (e) {
        return next(new AppError('Failed to fetch user details', 500));
    }
};

//1
// email  > validate in db > generate  new token > send email with new url containing token + save token with expiry in db
//2
// get token from url query param > verify token in db > update pass in db
 const forgotPassword = async (req, res, next) => {
    // Extracting email from request body
    const { email } = req.body;
  
    // If no email send email required message
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
  
    // Finding the user via email
    const user = await User.findOne({ email });
  
    // If no email found send the message email not found
    if (!user) {
      return next(new AppError('Email not registered', 400));
    }
  
    // Generating the reset token via the method we have in user model
    const resetToken = await user.generatePasswordResetToken();
    console.log(resetToken);
    // Saving the forgotPassword* to DB
    await user.save();
  
    // constructing a url to send the correct data
    /**HERE
     * req.protocol will send if http or https
     * req.get('host') will get the hostname
     * the rest is the route that we will create to verify if token is correct or not
     */
    // const resetPasswordUrl = `${req.protocol}://${req.get( eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MjZiZTQ2OWVjNThkY2Q1ZDI4MGNmMCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNjk3MDM3OTM0LCJleHAiOjE2OTcwNDE1MzR9.9UiJGMZ6KdO8eFQV8MXVrZaEDcI5xVkLbdCbKk6a8nA
    //   "host"
    // )}/api/v1/user/reset/${resetToken}`;
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  console.log(resetPasswordUrl);
  // navigator.clipboard.write(resetPasswordUrl);
    // We here need to send an email to the user with the token
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
  
    try {
      await sendEmail(email, subject, message);
  
      // If email sent successfully send the success response
      res.status(200).json({
        success: true,
        message: `Reset password token has been sent to ${email} successfully`,
      });
    } catch (error) {
      // If some error happened we need to clear the forgotPassword* fields in our DB
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;
  
      await user.save();
  
      return next(new AppError(error.message || 'Something went wrong, please try again.',400))}
 
    };

const resetPassword = async (req, res, next) => {
    const { resetToken } = req.params;
    const { password } = req.body;
    const forgetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    try {
        const user = await User.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry: { $gt: Date.now() }
        });
        if (!user) {
            return next(new AppError('Token is invalid or expired, please try again', 400));
        }
        user.password = password;
        user.forgetPasswordToken = undefined;
        user.forgetPasswordExpiry = undefined;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password Reset successfully'
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user;
    if (!oldPassword || !newPassword) {
        return next(new AppError('All fields are mandatory', 400));
    }
    const user = await User.findById(id).select('+password');
    if (!user) {
        return next(new AppError('User does not exist', 400));
    }
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
        return next(new AppError('Invalid old password', 400));
    }
    user.password = newPassword;
    await user.save();
    
    user.password = undefined;
    res.status(200).json({
        success: true,
        message: 'Password changed successfully!'
    });
};

const updateUser =async(req, res, next)=>{
const { fullName }=req.body;
const { id }=req.params;

const user= await User.findById(id);
if(!user){
  return next(
    new AppError('User does not exist',400)
  )
}

if(fullName){
  user.fullName=fullName;
}
if(req.file){
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  try {
    console.log('starting img upload to cloudinary')
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: 'lms', // Save files in a folder named lms
      width: 250,
      height: 250,
      gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
      crop: 'fill',
    });
console.log('image uploaded susccefully')
    // If success
    console.log(result);
    if (result) {
      // Set the public_id and secure_url in DB
      user.avatar.public_id = result.public_id;
      user.avatar.secure_url = result.secure_url;

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`)
              }
  } catch (error) {
    return next(
      new AppError(error || 'File not uploaded, please try again', 400)
    );
  }
}

// Save the user object
await user.save();

res.status(200).json({
  success:true,
  message:'user details updated successfully'
})
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
};
