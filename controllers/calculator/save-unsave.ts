import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

// Models
import Calculator from '../../models/calculator/calculatorModel';
import HttpError from '../../models/http-error';
import User from '../../models/userModel';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}

// @desc     Update a saved user list
// @route    POST /calculators/:calcId/:userId/save
// @access   Private
const saveUserList = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { calcId, userId } = req.params;
    const author = req.userData.userId;
    try {
      if (!calcId || !userId) {
        const error = new HttpError('All fields are required', 400);
        return next(error);
      }
      if (userId !== author) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundCalc = await Calculator.findById(calcId);
      if (!foundCalc) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      const foundUser = await User.findById(userId);
      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const owner = await User.findById(foundCalc.author);

      if (!owner) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      // check if user already exists in savedUsers array
      const index = foundCalc.savedUsers.findIndex(
        (user) => user.userId === foundUser._id
      );

      if (index === -1) {
        foundCalc.savedUsers.push({
          userId: foundUser._id,
        });
      } else {
        const error = new HttpError(
          'User already exists in saved users list',
          401
        );
        return next(error);
      }

      if (owner._id !== foundUser._id) {
        owner.savedCalculators.push({
          calculatorId: foundCalc._id,
          userId: foundUser._id,
        });
        await owner.save();
      }
      await foundCalc.save();

      res.json({ message: 'Calculator saved', calculators: foundCalc });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Update a saved user list
// @route    POST /calculators/:calcId/:userId/unSave
// @access   Private
const unSaveUserList = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { calcId, userId } = req.params;
    const author = req.userData.userId;
    try {
      if (!calcId || !userId) {
        const error = new HttpError('All fields are required', 400);
        return next(error);
      }

      if (userId !== author) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundCalc = await Calculator.findById(calcId);
      if (!foundCalc) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      const foundUser = await User.findById(userId);
      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      // remove user from savedUsers array
      foundCalc.savedUsers.pull({ userId: foundUser._id });

      await foundCalc.save();

      res.json({ message: 'User unsaved', calculators: foundCalc });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

export { saveUserList, unSaveUserList };
