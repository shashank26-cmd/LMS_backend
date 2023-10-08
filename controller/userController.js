import User from "../models/userModel.js";
import AppError from "../utils/error.utils.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';

const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // Fixed a typo here (added an extra '0')
    httpOnly: true,
    secure: true
};

const register = async (req, res, next) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return next(new AppError('All fields are required', 400));
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new AppError('Email already exists', 400));
    }
    
    try {
        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: ''
            }
        });

        // TODO: FILE UPLOAD (if needed)
        
        // Generate and set a JWT token for the user
        const token = await user.generateJWTToken();
        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
        });
    } catch (e) {
        return next(new AppError('User registration failed', 490));
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('All fields are required', 400));
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.comparePassword(password)) {
            return next(new AppError('Email or password does not match', 400));
        }
        const token = await user.generateJWTToken();
        res.cookie('token', token, cookieOptions);
        user.password = undefined;
        res.status(200).json({
            success: true,
            message: 'User login successful',
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

const logout = (req, res) => {
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
        const userId = req.user.id;
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

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Email is required', 400));
    }
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Email not registered', 400));
    }
    const resetToken = await user.generatePasswordResetToken();
    await user.save();
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href="${resetPasswordURL}" target="_blank">Reset your password</a>.\nIf the above link does not work, copy and paste this link in a new tab: ${resetPasswordURL}. If you have not requested this, kindly ignore.`;
    try {
        await sendEmail(email, subject, message);
        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`
        });
    } catch (e) {
        user.forgetPasswordExpiry = undefined;
        user.forgetPasswordToken = undefined;
        await user.save();
        return next(new AppError(e.message, 500));
    }
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
            message: 'Password changed successfully'
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

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword
};
