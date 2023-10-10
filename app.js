import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import morgan from 'morgan'; // gives info of what user have search or track user info
import userRoutes from './routes/userRoute.js'
import errorMiddleware from './middlewars/error.middleware.js';
config();
const app=express();
app.use(express.json()); // joh bhi req mai body ati hai woh parse hoke agee jaye taki dubara parsing related work na krna pade
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}));

app.use(cookieParser()); // to ensure setup  of token in cookie so that we can pass cookie
app.use(morgan('dev'));

app.use('/ping',function(req,res){ //testing 
    res.send("Pong");
});

// routes of 3 module ex user etc
app.use('/api/v1/user',userRoutes); // if something wrong and not return from here and u move to errorMiddleware that means u have really done a mistake


// koi aur route that does not exist
app.all('*',(req,res)=>{
    res.status(404).send('OOPS !! page not found');
});

//app yaha tak pahuche ho mtlb koi toh error kardi hai 
app.use(errorMiddleware); // first go into app.use('/api/v1/user) and there error comes toh waha pe wapis ajyga and then goes down to  * sees there nthing then move to errorMiddleware

export default app;