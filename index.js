import cloudinary from "cloudinary";
import Razorpay from "razorpay";
import app from "./app.js";
import connectionToDB from "./config/db.js";
import { config } from "dotenv";
config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
  // plan_id:process.env.RAZORPAY_PLAN_ID
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  // Ensure the database is connected before starting the server
  try {
    await connectionToDB();
    console.log(`App is running at http://localhost:${PORT}`);
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
});

export default app;
