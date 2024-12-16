import express from 'express';
import {
  isAuthenticated,
  loginUser,
  myInfo,
  registerUser,
  resetPassword,
  sendVefifyEmail,
  varifyOtp,
  verifyEmail,
} from '../controllers/auth.controllers';

const router = express.Router();

// register/login
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
// reset pass
router.route('/sent-otp').post(sendVefifyEmail);
router.route('/verify-otp').post(varifyOtp);
router.route('/reset-password').post(isAuthenticated, resetPassword);
router.route('/verify-email').post(isAuthenticated, verifyEmail);
// my info
router.route('/me').get(isAuthenticated, myInfo);

export default router;
