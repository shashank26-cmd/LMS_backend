import { v2 } from 'cloudinary';

import app from './app.js';
import connectionToDB from './config/db.js';


// Cloudinary configuration
v2.config({
  cloud_name: 'shashankm', 
  api_key: '442858572351394', 
  api_secret: 'CC8E_16jLJSBokJYNdWZbmJMhA4'

  
});





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
