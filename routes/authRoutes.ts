import express from 'express';
import { check, body } from 'express-validator';
import {
  accessLogin,
  googleLogin,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  sendResetPasswordEmail,
} from '../controllers/auth-controller';
import { checkAuth } from '../middleware/checkAuth';
import { loginLimiter } from '../middleware/loginLimiter';

const router = express.Router();

// Login
router.post(
  '/login',
  [
    body('username').isString().trim().notEmpty().toLowerCase(),
    body('password').isString().trim().notEmpty(),
  ],
  loginLimiter,
  login
);
router.post('/access', loginLimiter, accessLogin);
router.post('/googleLogin', loginLimiter, googleLogin);
router.get('/refresh', checkAuth, refresh);
router.post('/logout', checkAuth, logout);

// Register
router.post(
  '/register',
  [
    check('username').not().isEmpty().toLowerCase(),
    check('email').isEmail().toLowerCase(),
    check('password').isLength({ min: 6 }),
  ],
  loginLimiter,
  register
);

// Reset Password
router.post('/forgot-password', sendResetPasswordEmail);
router.put('/reset-password', resetPassword);

export default router;
