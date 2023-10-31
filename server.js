import cloudinary  from 'cloudinary';
import Razorpay from 'razorpay';
import app from './app.js';
import connectionToDB from './config/db.js';


// Cloudinary configuration
<<<<<<< HEAD
cloudinary.v2.config({
  cloud_name: process.env.Cloud_Name, 
  api_key: process.env.Cloud_Key, 
  api_secret:process.env.Cloud_Secret
=======
>>>>>>> 3d113d6eed8ffeef41e2c41d305066ca1e3dbf88



export const razorpay = new Razorpay({

key_id: process.env.RAZORPAY_KEY_ID,
key_secret:process.env.RAZORPAY_SECRET


})



const PORT = process.env.PORT || 5002;

// Cloudinary configuration

app.listen(PORT, async () => {
  // Ensure the database is connected before starting the server
  try {
    await connectionToDB();
    console.log(`App is running at http://localhost:${PORT}`);
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
});
