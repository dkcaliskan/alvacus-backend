import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

// Models
import HttpError from '../../models/http-error';
import Comment from '../../models/calculator/comment-model';
import User from '../../models/userModel';
import Calculator from '../../models/calculator/calculatorModel';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}

// @desc     Create a comment to calculator
// @route    POST /api/calculators/:calcId/comments
// @access   Private
const createComment = asyncHandler(async (req, res, next) => {
  try {
    const { calcId: calculatorId } = req.params;
    const { author, text, answer } = req.body;
    if (!calculatorId || (!author && (!text || !answer))) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    const foundUser = await User.findById(author);

    if (!foundUser) {
      const error = new HttpError('User not found', 404);
      return next(error);
    }

    const foundCalc = await Calculator.findById(calculatorId);

    if (!foundCalc) {
      const error = new HttpError('Calculator not found', 404);
      return next(error);
    }

    const newComment = new Comment({
      calculatorId,
      author,
      text,
      answer,
    });

    const createdComment = await newComment.save();

    const owner = await User.findById(foundCalc.author);

    if (!owner) {
      const error = new HttpError('Unauthorized', 401);
      return next(error);
    }

    if (createdComment.author !== owner._id) {
      owner.notifications.push({
        type: 'comment',
        text: `You have a new comment on ${foundCalc.title}`,
        link: `/${foundCalc.type}/${foundCalc._id}}`,
      });

      await foundUser.save();
    }

    foundUser.commentedCalculators.push({
      calculatorId: calculatorId,
      text: text,
    });

    res.json(createdComment);
  } catch (err) {
    const error = new HttpError('Something went wrong, please try again', 401);
    return next(error);
  }
});

// @desc     Get all comments for a post
// @route    GET /api/calculators/:calcId/comments/:page/:limit/:sort
// @access   Public
const getComments = asyncHandler(async (req, res, next) => {
  try {
    const { calcId } = req.params;
    const { page = 1, limit = 3, type = 'recent' } = req.query;
    let sortType;
    if (type === 'a-z') {
      sortType = { slug: 1 };
    } else if (type === 'popular') {
      // prettier-ignore
      sortType = { "likes": -1 };
    } else {
      sortType = [['createdAt', 'descending']];
    }

    const comments = await Comment.find({ calculatorId: calcId })
      .sort(sortType as any)
      .limit((limit as number) * 1)
      .skip(((page as number) - 1) * (limit as number))
      .populate('author', 'username avatar profession company')
      .populate('replies.author', 'username avatar profession company')
      .exec();

    const count = await Comment.countDocuments({ calculatorId: calcId });

    res.json(comments);
  } catch (err) {
    const error = new HttpError('Something went wrong, please try again', 401);
    return next(error);
  }
});

// @desc     Reply to a comment
// @route    POST /api/calculators/comments/:commentId/reply
// @access   Private
const replyComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { author, text, calculatorId } = req.body;

  try {
    if (!commentId || !author || !text) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    const foundComment = await Comment.findById(commentId);

    if (!foundComment) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }

    const foundUser = await User.findById(author);

    if (!foundUser) {
      const error = new HttpError('Unauthorized', 401);
      return next(error);
    }

    const owner = await User.findById(foundComment.author);

    if (!owner) {
      const error = new HttpError('Unauthorized', 401);
      return next(error);
    }

    const foundCalc = await Calculator.findById(calculatorId);

    if (!foundCalc) {
      const error = new HttpError('Calculator not found', 404);
      return next(error);
    }

    foundComment.replies.push({
      author: foundUser._id,
      text,
    });

    foundUser.repliedComments.push({
      calculatorId,
      commentId: foundComment._id,
      text: text,
    });

    if (foundComment.author !== owner._id) {
      owner.notifications.push({
        type: 'reply',
        text: `You have a new reply on ${foundComment.text}`,
        link: `/${foundCalc.type}/${foundCalc._id}}`,
      });
    }

    await foundUser.save();

    const savedComment = await foundComment.save();

    res.json(savedComment);
  } catch (err) {
    const error = new HttpError('Something went wrong, please try again', 401);
    return next(error);
  }
});

// @desc     Like a comment
// @route    POST /api/calculators/comments/:commentId/unlike
// @access   Private
const likeComment = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { commentId } = req.params;
    const author = req.userData.userId;

    try {
      if (!commentId || !author) {
        const error = new HttpError('All fields are required', 400);
        return next(error);
      }

      const foundComment = await Comment.findById(commentId);
      if (!foundComment) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }
      const foundUser = await User.findById(author);
      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundCalc = await Calculator.findById(foundComment.calculatorId);

      if (!foundCalc) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const owner = await User.findById(foundComment.author);

      if (!owner) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      if (owner._id !== foundUser._id) {
        owner.likedComments.push({
          commentId: foundComment._id,
          text: foundComment.text,
          userId: foundUser._id,
        });

        owner.notifications.push({
          type: 'like',
          text: `You have a new like on your comment`,
          link: `/${foundCalc.type}/${foundCalc._id}}`,
        });

        await owner.save();
      }

      // check if user already exists in liked users array
      const index = foundComment.likes.findIndex(
        (user) => user.userId === String(foundUser._id)
      );
      if (index === -1) {
        foundComment.likes.push({
          userId: foundUser._id,
        });
      } else {
        const error = new HttpError(
          'User already exists in saved users list',
          401
        );
        return next(error);
      }

      const savedComment = await foundComment.save();

      res.json(savedComment);
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Unlike a comment
// @route    POST /api/calculators/comments/:commentId/unlike
// @access   Private
const unlikeComment = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { commentId } = req.params;
    const author = req.userData.userId;
    try {
      if (!commentId || !author) {
        const error = new HttpError('All fields are required', 400);
        return next(error);
      }

      const foundComment = await Comment.findById(commentId);

      if (!foundComment) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      const foundUser = await User.findById(author);
      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const owner = await User.findById(foundComment.author);

      if (!owner) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      // remove user from liked users array
      foundComment.likes.pull({ userId: foundUser._id });

      const savedComment = await foundComment.save();

      if (foundComment.author !== foundUser._id) {
        owner.likedComments.pull({
          commentId: foundComment._id,
          userId: foundUser._id,
        });
        await owner.save();
      }

      res.json(savedComment);
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Delete a comment
// @route    DELETE /api/calculators/comments/:commentId
// @access   Private
const deleteComment = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { commentId } = req.params;
    const author = req.userData.userId;

    try {
      const foundComment = await Comment.findById(commentId);

      if (!foundComment) {
        const error = new HttpError('Comment not found', 404);
        return next(error);
      }

      const foundUser = await User.findById(author);

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      if (foundComment.author.toString() !== foundUser._id.toString()) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      await foundComment.deleteOne();
      res.json({ message: 'Comment removed' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Delete a reply
// @route    DELETE /api/calculators/comments/:commentId/replies/:replyId/delete
// @access   Private
const deleteReply = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { commentId, replyId } = req.params;
    const author = req.userData.userId;

    try {
      const foundComment = await Comment.findById(commentId);

      if (!foundComment) {
        const error = new HttpError('Comment not found', 404);
        return next(error);
      }

      const foundUser = await User.findById(author);

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      if (foundComment.author.toString() !== foundUser._id.toString()) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      foundComment.replies.pull({ _id: replyId });

      await foundComment.save();

      res.json({ message: 'Reply removed' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

export {
  createComment,
  getComments,
  replyComment,
  likeComment,
  unlikeComment,
  deleteComment,
  deleteReply,
};
