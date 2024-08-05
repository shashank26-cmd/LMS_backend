import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const userSchema = new Schema(
  {
    //  3 type of validation controller,react.js , while storing at db.
    fullName: {
      type: "String",
      required: [true, "Name is required"],
      minLength: [5, "Name  must be at least of 5 char"],
      lowercase: true,
      trim: true, // start and ending space trim
    },
    email: {
      type: "String",
      required: [true, "email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/],
    },
    password: {
      type: "String",
      required: [true, "password is required"],
      minLength: [8, "pass must be at least 8"],
      select: false,
    },
    avatar: {
      public_id: {
        //we will access through this
        type: "String",
      }, // withh certain credentials u can access this 
      secure_url: {
        type: "String",
      },
    },
    role: {
      type: "String",
      enum: ["USER", "ADMIN"], //possible users
      default: "USER", // if nothing given byDefault user.
    },
    forgetPasswordToken: String,
    forgetPasswordExpiry: Date,
    subscription: {
      //Subscription details verify
      id: String,
      status: String,
    },
  },
  {
    timestamps: true, //gives time  of when  create and update
  }
);
userSchema.pre("save", async function (next) {
  // pre hook in db
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  comparePassword: async function (plainTextPassword) {
    return await bcrypt.compare(plainTextPassword, this.password);
  },

  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id,
        email: this.email,
        subscription: this.subscription,
        role: this.role,
      },
      process.env.JWT_SECRET,

      {
        expiresIn: process.env.JWT_EXPIRY,
      }
    );
  },

  generatePasswordResetToken: async function () {
    //these function will try to generate dynamic token and expiry
    const resetToken = crypto.randomBytes(20).toString("hex"); // generate random token

    this.forgetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex"); //token set

    this.forgetPasswordExpiry = Date.now() + 15 * 60 * 1000;

    return resetToken;
  },
};

const User = model("User", userSchema); //(dbCollectionName,instance of schema)
export default User;
