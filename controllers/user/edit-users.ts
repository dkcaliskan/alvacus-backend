// Api & Core imports

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

// Models
import HttpError from '../../models/http-error';
import User from '../../models/userModel';
import Calculator from '../../models/calculator/calculatorModel';
import Comment from '../../models/calculator/comment-model';

// Utils
import sendNodemail from '../../utils/sendNodemail';

// Constants
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  REFRESH_TOKEN_EXPIRE_TIME,
  COOKIE_EXPIRE_TIME,
} from '../../constants/token-dates';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}
interface JwtPayload {
  userId: string;
  username: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture: string;
  UserInfo: {
    username: string;
    email: string;
    userId: string;
    role: string;
    avatar: string;
    profession: string;
    company: string;
    isActivated?: boolean;
    privacySettings?: {
      showSavedCalculators: boolean;
      showComments: boolean;
    };
  };
}

// @desc     Send user activation email
// @route    POST /api/user/activation/resend
// @access   Private
const sendActivationEmail = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userId, username, email } = req.body;

    if (!userId) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      const activationToken = jwt.sign(
        {
          UserInfo: {
            userId: userId,
            isActivated: true,
          },
        },
        process.env.JWT_SECRET!,
        { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
      );
      const replacements = {
        username: username,
        activationLink: `${process.env.CLIENT_URL}/auth/activation?t=${activationToken}&uuid=${userId}`,
      };
      await sendNodemail({
        filepath: '../emails/verification.html',
        subject: 'Alvacus account verification',
        replacements,
        email: email,
      });

      res.send({ message: 'Email sent' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Registered user Activation
// @route    PUT /api/user/activation?:t:
// @access   Private
const userActivation = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { t } = req.params;

    if (!t) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }
    const token = t.split('=')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      let foundUser = await User.findById(decoded.UserInfo.userId).exec();

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      foundUser.isActivated = decoded.UserInfo.isActivated || false;

      await foundUser.save();
      res.send({ message: 'success' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Change user password
// @route    PUT /user/change-password/:userId
// @access   Private
const putChangePassword = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userId } = req.params;
    const { oldPassword, password } = req.body;
    const author = req.userData.userId;

    if (!userId || !oldPassword || !password) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      let foundUser = await User.findById(userId);

      if (!foundUser || author !== foundUser._id.toString()) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      if (foundUser) {
        const match = await bcrypt.compare(oldPassword, foundUser.password!);
        if (!match) {
          const error = new HttpError('Your old password is incorrect', 401);
          return next(error);
        }

        let hashedPassword;
        try {
          hashedPassword = await bcrypt.hash(password, 12);
        } catch (err) {
          const error = new HttpError(
            'Could not create user, please try again.',
            500
          );
          return next(error);
        }
        foundUser.password = hashedPassword;

        try {
          await foundUser.save();
        } catch (err) {
          const error = new HttpError(
            'Update user is failed, please try again',
            500
          );
          return next(error);
        }

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              email: foundUser.email,
              userId: foundUser._id,
              role: foundUser.role,
              avatar: foundUser.avatar,
              profession: foundUser.profession,
              company: foundUser.company,
              privacySettings: foundUser.privacySettings,
            },
          },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
        );

        const refreshToken = jwt.sign(
          { username: foundUser.username },
          process.env.REFRESH_TOKEN_SECRET!,
          { expiresIn: REFRESH_TOKEN_EXPIRE_TIME }
        );

        // Create cookie with refresh token
        res.cookie('jwt', refreshToken, {
          httpOnly: true, // Accessible only by web server
          sameSite: 'strict', // Cross-site cookie
          maxAge: COOKIE_EXPIRE_TIME, // cookie expiry: set to match refreshToken
        });

        // Send accessToken containing username and roles
        res.json({
          accessToken,
          maxAge: new Date().getTime() + COOKIE_EXPIRE_TIME,
        });
      }
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Update user profile
// @route    PUT /user/edit/:userId
// @access   Private
const putEditUser = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userId } = req.params;
    const { username, email, password, avatar, profession, company } = req.body;
    const author = req.userData.userId;

    if (!userId) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      let foundUser = await User.findById(userId);
      if (!foundUser || author !== foundUser._id.toString()) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }
      if (foundUser) {
        foundUser.avatar = avatar || foundUser.avatar;
        foundUser.profession = profession || foundUser.profession;
        foundUser.company = company || foundUser.company;

        if (username && username !== foundUser.username) {
          const usernameExists = await User.findOne({ username }).exec();

          if (usernameExists) {
            const error = new HttpError('Username already exist', 422);
            return next(error);
          }
          foundUser.username = username;
        }
        if (email && email !== foundUser.email) {
          const emailExists = await User.findOne({ email }).exec();

          if (emailExists) {
            const error = new HttpError('Email already exist', 422);
            return next(error);
          }
          foundUser.email = email || foundUser.email;
        }

        try {
          await foundUser.save();
        } catch (err) {
          const error = new HttpError(
            'Update user is failed, please try again',
            500
          );
          return next(error);
        }

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: foundUser.username,
              email: foundUser.email,
              userId: foundUser._id,
              role: foundUser.role,
              avatar: foundUser.avatar,
              profession: foundUser.profession,
              company: foundUser.company,
              privacySettings: foundUser.privacySettings,
            },
          },
          process.env.ACCESS_TOKEN_SECRET!,
          { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
        );

        const refreshToken = jwt.sign(
          { username: foundUser.username },
          process.env.REFRESH_TOKEN_SECRET!,
          { expiresIn: REFRESH_TOKEN_EXPIRE_TIME }
        );

        // Create cookie with refresh token
        res.cookie('jwt', refreshToken, {
          httpOnly: true, // Accessible only by web server
          sameSite: 'strict', // Cross-site cookie
          maxAge: COOKIE_EXPIRE_TIME, // cookie expiry: set to match refreshToken
        });

        // Send accessToken containing username and roles
        res.json({
          accessToken,
          maxAge: new Date().getTime() + COOKIE_EXPIRE_TIME,
        });
      }
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Change privacy settings
// @route    PUT /user/change-privacy/:userId
// @access   Private
const putChangePrivacy = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userId } = req.params;
    const { privacySetting } = req.body;
    const { showSavedCalculators, showComments } = privacySetting;
    const author = req.userData.userId;

    if (!userId && (!showSavedCalculators || !showComments)) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      let foundUser = await User.findById(userId);

      if (!foundUser || author !== foundUser._id.toString()) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      foundUser.privacySettings!.showSavedCalculators = showSavedCalculators
        ? showSavedCalculators
        : false;
      foundUser.privacySettings!.showComments = showComments
        ? showComments
        : false;

      await foundUser.save();

      res.json({
        message: 'Privacy settings updated',
        showComments: foundUser.privacySettings!.showComments,
        showSavedCalculators: foundUser.privacySettings!.showSavedCalculators,
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Delete user
// @route    DELETE /user/delete/:userId?deleteCalculators&deleteComments
// @access   Private
const deleteUser = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userId } = req.params;
    const author = req.userData.userId;
    const { deleteCalculators, deleteComments } = req.query;

    try {
      const foundUser = await User.findById(userId).exec();
      const foundAuthor = await User.findById(author).exec();
      if (!foundUser || !foundAuthor) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      if (author !== foundUser._id.toString() && foundAuthor.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const deleteCalculatorBoolean =
        deleteCalculators === 'true' ? true : false;
      const deleteCommentsBoolean = deleteComments === 'true' ? true : false;

      if (deleteCalculatorBoolean) {
        await Calculator.deleteMany({
          author: foundUser._id,
        }).exec();
      }

      if (deleteCommentsBoolean) {
        await Comment.deleteMany({
          author: foundUser._id,
        }).exec();
      }

      await foundUser.deleteOne();

      res.json({ message: 'User removed' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

export {
  sendActivationEmail,
  userActivation,
  putEditUser,
  deleteUser,
  putChangePassword,
  putChangePrivacy,
};
