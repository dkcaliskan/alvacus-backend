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

// @desc     Create a calculator
// @route    POST /api/calculators/create
// @access   Private
const createCalc = asyncHandler(async (req, res, next) => {
  const {
    description,
    userId,
    category,
    title,
    inputLength,
    inputLabels,
    inputSelects,
    formula,
    formulaVariables,
    isInfoMarkdown,
    info,
    slug,
    type,
  } = req.body;
  if (inputLength > 6) {
    const error = new HttpError('More than 6 input is not allowed', 422);
    return next(error);
  }

  if (!title || !description || !category || !info) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }

  const foundCalc = await Calculator.findOne({
    slug: slug || title.replaceAll(' ', '-').toLowerCase(),
  });

  if (foundCalc) {
    const error = new HttpError(
      'There is a calculator with this name please choose different name',
      422
    );
    return next(error);
  }

  let foundUser = await User.findById(userId);

  if (!foundUser) {
    const error = new HttpError('Unauthorized', 404);
    return next(error);
  }

  const createCalc = new Calculator({
    title,
    description,
    author: userId,
    type: type || 'modular',
    category,
    slug: slug || title.replaceAll(' ', '-').toLowerCase(),
    inputLength,
    inputLabels,
    inputSelects,
    formula: formula.replaceAll(' ', '') || '',
    formulaVariables,
    isInfoMarkdown,
    info,
    isPublic: false,
  });

  try {
    await createCalc.save();
  } catch (err) {
    const error = new HttpError(
      'Creating calculator is failed, please try again',
      500
    );
    return next(error);
  }

  res.json({
    title: createCalc.title,
    formula: createCalc.formula,
    link: `/${createCalc.type}/${
      createCalc.type === 'modular' ? createCalc._id : createCalc.slug
    }`,
  });
});

// @desc     Update a calculator
// @route    PATCH /api/calculators/edit/:calcId
// @access   Private
const editCalculator = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { calcId } = req.params;
    const {
      title,
      formula,
      formulaVariables,
      description,
      category,
      info,
      isInfoMarkdown,
      inputLength,
      inputLabels,
      inputSelects,
    } = req.body;

    if (inputLength > 6) {
      const error = new HttpError('More than 6 input is not allowed', 422);
      return next(error);
    }
    if (!title || !description || !category || !info) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      let foundCalc = await Calculator.findById(calcId);

      if (!foundCalc || foundCalc.author?.toString() !== req.userData.userId) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      foundCalc.title = title || foundCalc.title;
      foundCalc.description = description || foundCalc.description;
      foundCalc.category = category || foundCalc.category;
      foundCalc.slug =
        title.replaceAll(' ', '-').toLowerCase() || foundCalc.slug;
      foundCalc.inputLength = inputLength || foundCalc.inputLength;
      foundCalc.inputLabels = inputLabels || foundCalc.inputLabels;
      foundCalc.inputSelects = inputSelects || foundCalc.inputSelects;
      foundCalc.formula = formula
        ? formula.replaceAll(' ', '') || foundCalc.formula
        : '';
      foundCalc.formulaVariables =
        formulaVariables || foundCalc.formulaVariables;
      foundCalc.isInfoMarkdown = isInfoMarkdown;
      foundCalc.info = info || foundCalc.info;

      await foundCalc.save();

      res.json({
        title: foundCalc.title,
        formula: foundCalc.formula,
        link: `/${foundCalc.type}/${
          foundCalc.type === 'modular' ? foundCalc._id : foundCalc.slug
        }`,
      });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }
  }
);

// @desc     Update calculator's verification status
// @route    PATCH /api/calculators/verify/:calcId
// @access   Private
const verifyCalculator = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { calcId } = req.params;
    const { isVerified } = req.body;

    try {
      let foundCalc = await Calculator.findById(calcId);

      if (!foundCalc) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      foundCalc.isVerified = isVerified;

      await foundCalc.save();

      res.json({ message: 'Verification status changed' });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }
  }
);

// @desc     Delete a calculator
// @route    DELETE /api/calculators/delete/:calcId
// @access   Private
const deleteCalculator = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { calcId } = req.params;

    const author = req.userData.userId;

    try {
      const foundCalc = await Calculator.findById(calcId).exec();
      const foundUser = await User.findById(author).exec();

      if (!foundUser || !foundCalc) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }
      if (
        foundUser.role !== 'admin' &&
        foundCalc.author?.toString() !== req.userData.userId
      ) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      await foundCalc.deleteOne();

      res.json({ message: 'Calculator is deleted' });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }
  }
);

export { createCalc, editCalculator, verifyCalculator, deleteCalculator };
