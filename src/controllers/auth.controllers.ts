import { compare, genSalt, hash } from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { generate } from 'otp-generator';
import config from '../config/config';
import OtpModel, { Otp } from '../models/opt.model';
import UserModel, { User } from '../models/user.model';
import catchAsyncError from '../modules/utils/catchAsync';
import sendEmail from '../modules/utils/sendEmail';
import sendToken from '../modules/utils/sendToken';

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export const isAuthenticated = catchAsyncError(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (typeof authHeader === 'undefined') {
    return next({ message: 'un-authorized', status: 401 });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next({ message: 'Please Login to access this resource', status: 401 });
  }
  const secret = config.jwt.secret;
  const decodedData = jwt.verify(token, secret) as any;
  req.user = decodedData;
  next();
});

// admin route
export const isAdmin = catchAsyncError(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.user.role !== 'admin') {
    return next({ message: 'You are not authorized to access this resource', status: 403 });
  }
  next();
});

// Register a User
export const registerUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const socialLogin = req.query['social'];
  const { name, email, password, role } = req.body;

  if (!name) {
    throw { message: 'Please provide a name', status: 400 };
  }
  if (!email) {
    throw { message: 'Please provide a email', status: 400 };
  }

  if (!password && !socialLogin) {
    throw { message: 'Please provide a password', status: 400 };
  }

  const existingUser = await UserModel.findOne({ email });

  if (existingUser && socialLogin) {
    return loginUser(req, res, next);
  }

  if (existingUser) {
    throw { message: `${email} is already registered`, status: 401 };
  }

  // Hash password
  const salt = await genSalt(10);
  const hashedPassword = await hash(password, salt);

  // Create new user
  const createdUser = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  //send otp to varify email address;
  if (!socialLogin) {
    await sendOtp(createdUser, 'verify');
  }

  // Prepare response payload
  const user = createdUser.toObject();

  // Send token in response
  sendToken(user, 201, res);
});

// Login User
export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw { message: 'Please Enter Email & Password', status: 400 };
    }

    const user = await UserModel.findOne({ email }).select('+password');

    if (!user) {
      throw { message: 'Invalid Email or Password', status: 401 };
    }
    const userPassword = user.password;
    const comparePassword = await compare(password, userPassword);

    if (!comparePassword) {
      throw { message: 'Invalid Email or Password', status: 401 };
    }

    const userData = user.toObject();
    sendToken(userData, 200, res);
  } catch (error) {
    console.log({ error });
    next(error);
  }
});

//send otp to varify email address;
export const sendVefifyEmail = catchAsyncError(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw { message: 'User not found', status: 404 };
  }
  await sendOtp(user, 'reset');
  res.send({ success: true, message: 'OTP sent to your email' });
});

// Forgot password
export const sendOtp = async (user: User, type: 'verify' | 'reset') => {
  // sent otp and save it to db
  const otp = generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  const getOtp = otp;
  await sendEmail({
    name: user.name,
    email: user.email,
    otp: parseInt(getOtp),
    subject: type === 'verify' ? 'Verify your email' : 'Reset your password',
    type,
  });

  // Save OTP to database
  await OtpModel.deleteOne({ email: user.email });
  await OtpModel.create({
    user: user._id,
    email: user.email,
    otp,
    getOtp,
    otpVerified: false,
  });
};

//varify otp;
export const varifyOtp = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp, email } = req.body;
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      throw { message: 'User not found', status: 404 };
    }

    const findOTP: Otp | null = await OtpModel.findOne({ email }).exec();

    if (!findOTP) {
      throw { message: 'OTP not found', status: 404 };
    }

    if (!(await findOTP.compareOtp(otp))) {
      throw { message: 'Invalid OTP', status: 401 };
    }

    if (findOTP.otpVerified) {
      throw { message: 'OTP already verified', status: 401 };
    }
    // Verify OTP
    const newOtpVerified = {
      otpVerified: true,
    };
    await OtpModel.findByIdAndUpdate(findOTP._id, newOtpVerified, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    const userData = user.toObject();
    sendToken(userData, 200, res);
  } catch (error) {
    next(error);
  }
});

// Reset password
export const resetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      throw { message: 'User not found', status: 404 };
    }

    const salt = await genSalt(10);
    const newPassword = await hash(password, salt);
    user.password = newPassword;
    await user.save();
    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

//verify email address
export const verifyEmail = catchAsyncError(async (req: Request, res: Response, _next: NextFunction) => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw { message: 'User not found', status: 404 };
  }
  if (user.isVerified) {
    throw { message: 'Email already verified', status: 400 };
  }

  user.isVerified = true;
  await user.save();
  res.send({ success: true, message: 'Email verified successfully' });
});

// Get My Info
export const myInfo = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findById(req.user._id).select('-password');
    if (!user) {
      throw { message: 'User not found', status: 404 };
    }
    const userData = user.toObject();
    sendToken(userData, 200, res);
  } catch (error) {
    next(error);
  }
});
