import { config } from "dotenv";
import { razorpay } from "../index.js";
import AppError from "../utils/error.utils.js";
import User from "../models/userModel.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
config();
const getRazorpayApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razarpay API key",
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// ... (Other imports and configurations)

const buyScription = async (req, res, next) => {
  try {
    const { id } = req.user;

    // Validate user ID
    if (!id) {
      return next(new AppError("User ID is missing", 400));
    }

    // Find the user
    const user = await User.findById(id);

    // Check if the user exists
    if (!user) {
      return next(new AppError("User does not exist. Please log in.", 402));
    }

    // Check if the user is an admin (optional)
    if (user.role === "ADMIN") {
      return next(new AppError("Admin cannot purchase a subscription", 403));
    }

    // Check if Razorpay Plan ID is configured
    if (!process.env.RAZORPAY_PLAN_ID) {
      return next(new AppError("Razorpay Plan ID is not configured", 500));
    }

    // Define subscription options
    const subscriptionOptions = {
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: 12,
    };

    // Create a subscription using Razorpay
    const subscription = await razorpay.subscriptions.create(
      subscriptionOptions
    );

    // Update user's subscription details
    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();

    // Send the response
    res.status(200).json({
      success: true,
      message: "Subscribed Successfully",
      subscription_id: subscription.id,
    });
  } catch (error) {
    console.error(error);
    return next(new AppError(error.message, 500));
  }
};

const verifySubscription = async (req, res, next) => {
  try {
      const { id } = req.user;
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
      console.log("this  is verify console",razorpay_payment_id,razorpay_signature,razorpay_subscription_id);
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
const allPayments = async (req, res, _next) => {
  const { count, skip } = req.query;

  // Find all subscriptions from razorpay
  const allPayments = await razorpay.subscriptions.all({
    count: count ? count : 10, // If count is sent then use that else default to 10
    skip: skip ? skip : 0, // // If skip is sent then use that else default to 0
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayments.items.map((payment) => {
    // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
    const monthsInNumbers = new Date(payment.start_at * 1000);

    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });

  res.status(200).json({
    success: true,
    message: "All payments",
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
};
export {
  getRazorpayApiKey,
  buyScription,
  verifySubscription,
  cancelSubscription,
  allPayments,
};
