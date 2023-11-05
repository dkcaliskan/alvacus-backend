import mongoose from 'mongoose';
import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { NextFunction, Request, Response } from 'express';

// Models
import Calculator from '../../models/calculator/calculatorModel';
import HttpError from '../../models/http-error';
import User from '../../models/userModel';

const { ObjectId } = mongoose.Types;

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

// @desc     Get Modular calculators
// @route    GET /api/calculators/modular
// @access   Public
const getModularCalcs = asyncHandler(async (req, res, next) => {
  try {
    const calculators = await Calculator.find({ type: 'modular' });
    res.json({
      calculators,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Get all calculators
// @route    GET /api/calculators
// @access   Public
const getCalcs = asyncHandler(async (req, res, next) => {
  try {
    const calculators = await Calculator.find({ isVerified: true });
    res.json({
      calculators,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Get all calculators
// @route    GET /api/calculators/all
// @access   Public
const getAllCalcs = asyncHandler(
  async (req: IReqParams, res: Response, next: NextFunction) => {
    const { page = 1, limit = 3, type = 'recent', search, tag } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    const sortTypes: Record<string, any> = {
      'a-z': { slug: 1 },
      'z-a': { slug: -1 },
      popular: { savedUsers: -1 },
    };

    if ((type as string) in sortTypes) {
      sortType = sortTypes[type as string];
    }

    let filters: any = { isVerified: true };

    if (search) {
      filters.title = { $regex: search, $options: 'i' };
    }

    if (tag) {
      filters.category = { $regex: tag, $options: 'i' };
    }

    try {
      const [calculators, count] = await Promise.all([
        Calculator.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .populate('author', 'username avatar profession company')
          .select(
            'title description category slug createdAt author isVerified type _id savedUsers'
          )
          .exec(),
        Calculator.countDocuments(filters),
      ]);
      res.json({
        calculators,
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

// @desc     Get auth calculators
// @route    GET /api/calculators/:userId/saved
// @access   Public
const getSavedCalcs = asyncHandler(
  async (req: IReqParams, res: Response, next: NextFunction) => {
    const { userId: author } = req.params;

    const { page = 1, limit = 3, type = 'recent', search, tag } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    const sortTypes: Record<string, any> = {
      'a-z': { slug: 1 },
      'z-a': { slug: -1 },
      popular: { savedUsers: -1 },
    };

    if ((type as string) in sortTypes) {
      sortType = sortTypes[type as string];
    }

    let filters: {
      title?: { $regex: string; $options: string };
      category?: { $regex: string; $options: string };
      'savedUsers.userId': mongoose.Types.ObjectId;
    } = {
      'savedUsers.userId': new ObjectId(author),
    };

    if (search) {
      filters.title = { $regex: search as string, $options: 'i' };
    }

    if (tag) {
      filters.category = { $regex: tag as string, $options: 'i' };
    }

    if (!author) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }

    try {
      const [calculators, count] = await Promise.all([
        Calculator.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .populate('author', 'username avatar profession company')
          .select(
            'title description category slug createdAt author isVerified type _id savedUsers'
          )
          .exec(),
        Calculator.countDocuments(filters),
      ]);
      res.json({
        calculators,
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

// @desc     Get auth calculators
// @route    GET /api/calculators/:userId/my-calculators
// @access   Public
const getMyCalcs = asyncHandler(
  async (req: IReqParams, res: Response, next: NextFunction) => {
    const { userId: author } = req.params;

    const { page = 1, limit = 3, type = 'recent', search, tag } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    const sortTypes: Record<string, any> = {
      'a-z': { slug: 1 },
      'z-a': { slug: -1 },
      popular: { savedUsers: -1 },
    };

    if ((type as string) in sortTypes) {
      sortType = sortTypes[type as string];
    }

    let filters: {
      title?: { $regex: string; $options: string };
      category?: { $regex: string; $options: string };
      author: mongoose.Types.ObjectId;
    } = {
      author: new ObjectId(author),
    };

    if (search) {
      filters.title = { $regex: search as string, $options: 'i' };
    }

    if (tag) {
      filters.category = { $regex: tag as string, $options: 'i' };
    }

    if (!author) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }

    try {
      const [calculators, count] = await Promise.all([
        Calculator.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .populate('author', 'username avatar profession company')
          .select(
            'title description category slug createdAt author isVerified type _id savedUsers'
          )
          .exec(),
        Calculator.countDocuments(filters),
      ]);
      res.json({
        calculators,
        totalPages: Math.ceil(count / Number(limit)),
        count,
        currentPage: Number(page),
      });
    } catch (err) {
      console.log(err);
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Get unverified calculators
// @route    GET /api/calculators/unverified
// @access   Private
const getUnverifiedCalcs = asyncHandler(async (req: UserRequest, res, next) => {
  // Check if user is admin
  const author = req.userData.userId;

  if (!author) {
    const error = new HttpError(
      'You are not authorized to view this page8',
      401
    );
    return next(error);
  }

  try {
    const user = await User.findById(author);

    if (!user || user.role !== 'admin') {
      const error = new HttpError(
        'You are not authorized to view this page',
        401
      );
      return next(error);
    }
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }

  // Get unverified calculators
  const { page = 1, limit = 3, type = 'recent', search, tag } = req.query;

  let sortType: any = [['createdAt', 'descending']];

  const sortTypes: Record<string, any> = {
    'a-z': { slug: 1 },
    'z-a': { slug: -1 },
    popular: { savedUsers: -1 },
  };

  if ((type as string) in sortTypes) {
    sortType = sortTypes[type as string];
  }

  let filters: any = { isVerified: false };

  if (search) {
    filters.title = { $regex: search, $options: 'i' };
  }

  if (tag) {
    filters.category = { $regex: tag, $options: 'i' };
  }

  try {
    const [calculators, count] = await Promise.all([
      Calculator.find(filters)
        .sort(sortType)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('author', 'username avatar profession company')
        .select(
          'title description category slug createdAt author isVerified type _id savedUsers'
        )
        .exec(),
      Calculator.countDocuments(filters),
    ]);

    res.json({
      calculators,
      totalPages: Math.ceil(count / Number(limit)),
      count,
      currentPage: Number(page),
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Get calculator by id
// @route    GET /api/calculators/:id
// @access   Public
const getCalculatorById = asyncHandler(async (req, res, next) => {
  try {
    const calculator = await Calculator.findById(req.params.id).populate(
      'author',
      'username avatar profession company'
    );

    res.json(calculator);
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Get calculator by slug
// @route    GET /api/calculators/monolithic/:slug
// @access   Public
const getCalculatorBySlug = asyncHandler(async (req, res, next) => {
  try {
    const calculator = await Calculator.findOne({
      slug: req.params.slug,
    }).populate('author', 'username avatar profession company');
    res.json(calculator);
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

export {
  getModularCalcs,
  getCalcs,
  getAllCalcs,
  getSavedCalcs,
  getMyCalcs,
  getCalculatorById,
  getCalculatorBySlug,
  getUnverifiedCalcs,
};
