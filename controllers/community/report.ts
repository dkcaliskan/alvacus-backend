import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

// Models
import HttpError from '../../models/http-error';
import Report from '../../models/community/reportModel';
import User from '../../models/userModel';

import sendNodemail from '../../utils/sendNodemail';

dotenv.config();

interface IReqParams extends Request {
  page?: string;
  limit?: string;
  type?: string;
  search?: string;
  tag?: string;
  userData?: any;
  userId?: string;
}
interface UserRequest extends Request {
  userData?: any;
}

// @desc     Send report to admin
// @route    POST /api/report/submit
// @access   Public
const submitReport = asyncHandler(async (req: Request, res: Response, next) => {
  const { username, email, calculatorId, message, subject, title } = req.body;

  if (!subject || !message || !title) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }

  try {
    const createReport = new Report({
      username: username ? username : 'Anonymous',
      email: email ? email : 'Anonymous',
      calculatorId: calculatorId ? calculatorId : 'Anonymous',
      title,
      subject,
      message,
    });
    await createReport.save();
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }

  try {
    const replacements = {
      receiver: 'Admin',
      calculatorTitle: title,
      calculatorId: calculatorId ? calculatorId : 'Anonymous',
      reporterUsername: username ? username : 'Anonymous',
      reporterEmail: email ? email : 'Anonymous',
      subject,
      message,
    };
    await sendNodemail({
      filepath: '../emails/community/report.html',
      subject: 'Alvacus report',
      email: 'dogukaan.caliskan@gmail.com',
      replacements,
    });
  } catch (err) {
    console.log('Error sending email: ', err);
  }
  res.send({ message: 'success' });
});

// @desc     Send report to admin
// @route    POST /api/report/comment-report
// @access   Public
const sendCommentReport = asyncHandler(
  async (req: Request, res: Response, next) => {
    const {
      username,
      email,
      calculatorId,
      title,
      commentId,
      commentContent,
      reportReasons,
    } = req.body;

    if (!reportReasons || !commentContent || !title) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      const createReport = new Report({
        username: username ? username : 'Anonymous',
        email: email ? email : 'Anonymous',
        calculatorId: calculatorId ? calculatorId : 'Anonymous',
        commentId: commentId ? commentId : 'Anonymous',
        title,
        commentContent,
        commentReportReasons: reportReasons,
      });
      await createReport.save();
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }

    res.send({ message: 'success' });

    /* try {
      const replacements = {
        receiver: 'Admin',
        calculatorTitle: title,
        calculatorId: calculatorId ? calculatorId : 'Anonymous',
        commentId,
        commentContent,
        reporterUsername: username ? username : 'Anonymous',
        reporterEmail: email ? email : 'Anonymous',
        reportReasons,
      };
      await sendNodemail({
        filepath: '../emails/community/comment-report.html',
        subject: 'Alvacus comment report',
        email: 'dogukaan.caliskan@gmail.com',
        replacements,
      });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    } */
  }
);

// @desc     Get all reports
// @route    GET /api/report
// @access   Private/Admin
const getReports = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const author = req.userData.userId;
    const { page = 1, limit = 3, search } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    let filters: any = { isReportSeen: true };

    if (search) {
      filters.username = { $regex: search, $options: 'i' };
    }

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const [reports, count] = await Promise.all([
        Report.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .exec(),
        Report.countDocuments(filters),
      ]);

      res.json({
        reports,
        totalPages: Math.ceil(count / Number(limit)),
        count,
        currentPage: Number(page),
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

// @desc     Get unseen reports
// @route    GET /api/report/unseen
// @access   Private/Admin
const getUnseenReports = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const author = req.userData.userId;
    const { page = 1, limit = 3, search } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    let filters: any = { isReportSeen: false };

    if (search) {
      filters.username = { $regex: search, $options: 'i' };
    }

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const [reports, count] = await Promise.all([
        Report.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .exec(),
        Report.countDocuments(filters),
      ]);

      res.json({
        reports,
        totalPages: Math.ceil(count / Number(limit)),
        count,
        currentPage: Number(page),
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

// @desc     Update report status
// @route    PATCH /api/report/update/:reportId
// @access   Private/Admin
const updateReportStatus = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { reportId } = req.params;
    const { isReportSeen } = req.body;

    const author = req.userData.userId;

    try {
      const foundReport = await Report.findById(reportId).exec();
      const foundUser = await User.findById(author).exec();

      if (!foundUser || !foundReport) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }
      if (foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      foundReport.isReportSeen = isReportSeen;

      await foundReport.save();

      res.json({ message: 'Report is updated' });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }
  }
);

// @desc     Delete report
// @route    DELETE /api/report/delete/:reportId
// @access   Private/Admin
const deleteReport = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { reportId } = req.params;

    const author = req.userData.userId;

    try {
      const foundReport = await Report.findById(reportId).exec();
      const foundUser = await User.findById(author).exec();

      if (!foundUser || !foundReport) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }
      if (foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      await foundReport.deleteOne();

      res.json({ message: 'Report is deleted' });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, please try again',
        401
      );
      return next(error);
    }
  }
);

export {
  submitReport,
  sendCommentReport,
  getReports,
  getUnseenReports,
  updateReportStatus,
  deleteReport,
};
