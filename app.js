import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import morgan from "morgan"; 
import userRoutes from "./routes/userRoute.js";
import courseRoutes from "./routes/course.route.js";
import paymentRoutes from "./routes/payment.route.js";
import miscRoutes from "./routes/miscellaneous.js";

import errorMiddleware from "./middleware/error.middleware.js";
config();  //To consider env file data.
const app = express();
app.use(express.json()); // handling JSON data in Express.js

//express.urlencoded() is used for parsing data in the body of HTTP requests where the data is in the URL-encoded format, which is a common way to send form data in web applications.
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    // origin: "https://lms-frontend-kappa.vercel.app",
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// origin:"https://lms-frontend-kappa.vercel.app",
// origin: "http://localhost:5173",

app.use(cookieParser()); //For parsing of Cookies,token.
app.use(morgan("dev")); //log management in dev mode..there are other modes such as common , short etc, 
 

app.use("/ping", function (req, res) {
  //testing
  res.send("Pong");
});

app.use("/api/v1/user", userRoutes); // if something wrong and not return from here and u move to errorMiddleware that means u have really done a mistake
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1", miscRoutes);

//route that does not exist
app.all("*", (req, res) => {
  res.status(404).send("OOPS !! page not found");
});

//first  goes to app.use(routers) if there err then move to * and then comes here to send err to user.
app.use(errorMiddleware);

export default app;
