import app from './app.js';
import connectionToDB from './config/db.js';
// import cloudinary from 'cloudinary'; //create cloudinary acc and then yeh cloud name etc chessse milegi taki app upload kar paye
const PORT=process.env.PORT || 5002;

//cloudinary configuration
import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'dx95mberm', 
  api_key: '718353921933476', 
  api_secret: 'Rft7RLr0APrT39KUZQAYEd6-OVw' 
});

app.listen(PORT,async()=>{  //ensure db is connected and after that show app is running on this port.
     await connectionToDB();
    console.log(`app is running at http://localhost:${PORT}`);
});