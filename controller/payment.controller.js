import { config } from "dotenv";
import { razorpay } from '../server.js'
import AppError from "../utils/error.utils.js";
import User from '../models/userModel.js'
import Payment from "../models/payment.model.js";
import crypto from 'crypto';
config();
const getRazorpayApiKey = async (req, res, next) => {
  try {
      res.status(200).json({
          success: true,
          message: 'Razarpay API key',
          key: process.env.RAZORPAY_KEY_ID,
      });
  } catch (e) { 
      return next(new AppError(e.message, 500));
  }
}


const buyScription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById({ _id: id });
        if (!user) {
            return next(new AppError('User is not exist...Please login', 402));
        }
        if (user.role === 'ADMIN') {
            return next(new AppError('Admin cannot purchase a subscription', 403));
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            custom_notify: 1,
        });

        if (subscription) {
            user.subscription.id = subscription.id;
            user.subscription.status = subscription.status;
        }

        await user.save();
        res.status(200).json({
            success: true,
            message: 'Subscribed Successfully...',
            subscription_id: subscription.id,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const verifySubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
        const user = await User.findById({ _id: id });
        if (!user) {
            return next(new AppError('User is not exist...Please login', 402));
        }
        const subscriptionID = user.subscription.id;
        if (!subscriptionID) {
            return next(new AppError('User Subscription ID not found...', 402));
        }
        const generatedSignature = crypto
            .createHash('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${subscriptionID}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return next(new AppError('Payment not verifyed, Please try again', 403));
        }
        await Payment.create({
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
        });
        user.subscription.status = 'active';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Payment Verified successfully...',
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user;
        const user = await User.findById({ _id: id });

        if (!user) {
            return next(new AppError('User is not exist...Please login', 402));
        }

        if(user.role === 'ADMIN'){
            return next(new AppError('Admin cannot purchase a subscription', 403));
        }

        const subscriptionID = user.subscription.id;
        const subscription = razorpay.subscriptions.cancel(subscriptionID);

        user.subscription.status = subscription.status;

        await user.save();
        res.status(200).json({
            success: true,
            message:'Remove subscription successfully...',
        });

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const allPayments = async (req, res, next) => {
    try {
        const {count} = req.query;

        const subscriptions = await razorpay.subscriptions.all({
            count:count || 10,
        });

        // const payments = await 
        res.status(200).json({
            success: true,
            message: 'All Payments...',
            subscriptions,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

export {
    getRazorpayApiKey,
    buyScription,
    verifySubscription,
    cancelSubscription,
    allPayments
}