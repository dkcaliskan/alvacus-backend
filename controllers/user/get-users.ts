// Api & Core imports

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { NextFunction, Request, Response } from 'express';

// Models
import HttpError from '../../models/http-error';
import User from '../../models/userModel';

// Utils

// Constants

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}

interface IReqParams extends Request {
  page?: string;
  limit?: string;
  type?: string;
  search?: string;
  tag?: string;
  userData?: any;
  userId?: string;
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

// @desc     Get all users
// @route    GET /user
// @access   Private
const getUsers = asyncHandler(
  async (req: IReqParams, res: Response, next: NextFunction) => {
    /* const users = await User.find({}).exec();
  res.json(users); */

    const { page = 1, limit = 3, search } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    let filters: any = {};

    if (search) {
      filters.username = { $regex: search, $options: 'i' };
    }

    try {
      const [users, count] = await Promise.all([
        User.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .exec(),
        User.countDocuments(filters),
      ]);
      res.json({
        users,
        totalPages: Math.ceil(count / Number(limit)),
        count,
        currentPage: Number(page),
      });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Get user with id
// @route    GET /user/:userId
// @access   Public
const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }
    const foundUser = await User.findById(userId).exec();
    if (!foundUser) {
      const error = new HttpError('Unauthorized', 401);
      return next(error);
    }

    res.json({
      _id: foundUser._id,
      username: foundUser.username,
      role: foundUser.role,
      avatar: foundUser.avatar,
      profession: foundUser.profession,
      company: foundUser.company,
      followers: foundUser.followers,
      privacySettings: foundUser.privacySettings,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

export { getUsers, getUserById };
