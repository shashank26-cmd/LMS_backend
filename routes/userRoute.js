import { Router } from "express";
import { register,login,logout,getProfile,forgotPassword,resetPassword,changePassword,updateUser } from "../controller/userController.js";
import { isLoggedIn } from "../middlewars/auth.middleware.js";
import upload from "../middlewars/multer.middleware.js";
const router=Router();

router.post('/register',upload.single("avatar"),register); //remove data from avatar convert it  and put it on temprory folder and give path 
router.post('/login',login);
router.get('/logout',logout);
router.get('/getProfile',isLoggedIn,getProfile);
router.post('/reset',forgotPassword);
router.post('/reset/:resetToken',resetPassword);
router.post('/change-password',isLoggedIn,changePassword)
router.put('/update',isLoggedIn,upload.single("avatar"),updateUser)
export default router;