import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import morgan from 'morgan'; // gives info of what user have search or track user info
import userRoutes from './routes/userRoute.js'
import courseRoutes from './routes/course.route.js'
import paymentRoutes from './routes/payment.route.js'
import miscRoutes from './routes/miscellaneous.js';

import errorMiddleware from './middleware/error.middleware.js';
config();
const app=express();
app.use(express.json()); // joh bhi req mai body ati hai woh parse hoke agee jaye taki dubara parsing related work na krna pade


//express.urlencoded() is used for parsing data in the body of HTTP requests where the data is in the URL-encoded format, which is a common way to send form data in web applications.

//The { extended: true } option indicates that the URL-encoded data should be parsed as an object (with nested objects and arrays) rather than a flat key-value structure. This is useful when working with complex forms.
app.use(express.urlencoded({extended:true}));

// app.options('*', cors()); // Enable pre-flight across-the-board

app.use(cors({
    origin: "https://lms-frontend-4cin0fc91-shashanks-projects-3027ed5d.vercel.app",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(cookieParser()); // to ensure setup  of token in cookie so that we can pass cookie
app.use(morgan('dev'));

app.use('/ping',function(req,res){ //testing 
    res.send("Pong");
});

// routes of 3 module ex user etc
app.use('/api/v1/user',userRoutes); // if something wrong and not return from here and u move to errorMiddleware that means u have really done a mistake
app.use('/api/v1/courses',courseRoutes);
app.use('/api/v1/payments',paymentRoutes);
app.use('/api/v1',miscRoutes)



// koi aur route that does not exist
app.all('*',(req,res)=>{
    res.status(404).send('OOPS !! page not found');
});

//app yaha tak pahuche ho mtlb koi toh error kardi hai 
app.use(errorMiddleware); // first go into app.use('/api/v1/user) and there error comes toh waha pe wapis ajyga and then goes down to  * sees there nthing then move to errorMiddleware

export default app;