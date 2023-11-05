import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';

// Models
import HttpError from '../../models/http-error';
import Contact from '../../models/community/contactModel';
import User from '../../models/userModel';

import sendNodemail from '../../utils/sendNodemail';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}

// @desc     Send report to admin
// @route    POST /api/contact
// @access   Public
const sendContact = asyncHandler(async (req: Request, res: Response, next) => {
  const { username, email, message, subject } = req.body;

  console.log(username, email, message, subject);

  if (!username || !email || !subject || !message) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }

  try {
    const createReport = new Contact({
      username: username ? username : 'Anonymous',
      email: email ? email : 'Anonymous',
      subject,
      message,
    });
    await createReport.save();
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
  /* 
  try {
    const replacements = {
      receiver: 'Admin',
      username,
      email,
      subject,
      message,
    };
    await sendNodemail({
      filepath: '../emails/contact.html',
      subject: 'Alvacus contact',
      email: 'dogukaan.caliskan@gmail.com',
      replacements,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  } */
  res.send({ message: 'success' });
});

// @desc     Get all reports
// @route    GET /api/contact
// @access   Private/Admin
const getContacts = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const author = req.userData.userId;
    const { page = 1, limit = 3, search } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    let filters: any = { isContactSeen: true };

    if (search) {
      filters.message = { $regex: search, $options: 'i' };
    }

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const [contacts, count] = await Promise.all([
        Contact.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .exec(),
        Contact.countDocuments(filters),
      ]);

      res.json({
        contacts,
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

// @desc     Get unseen contacts
// @route    GET /api/contact/unseen
// @access   Private/Admin
const getUnseenContacts = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const author = req.userData.userId;
    const { page = 1, limit = 3, search } = req.query;

    let sortType: any = [['createdAt', 'descending']];

    let filters: any = { isContactSeen: false };

    if (search) {
      filters.message = { $regex: search, $options: 'i' };
    }

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const [contacts, count] = await Promise.all([
        Contact.find(filters)
          .sort(sortType)
          .limit(Number(limit))
          .skip((Number(page) - 1) * Number(limit))
          .exec(),
        Contact.countDocuments(filters),
      ]);

      res.json({
        contacts,
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

// @desc     Update contact status
// @route    PATCH /api/contact/update/:id
// @access   Private/Admin
const updateContactStatus = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { contactId } = req.params;
    const { isContactSeen } = req.body;

    const author = req.userData.userId;

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundContact = await Contact.findById(contactId);

      if (!foundContact) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      foundContact.isContactSeen = isContactSeen;
      await foundContact.save();

      res.json({ message: 'Contact updated' });
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
// @route    DELETE /api/contact/:id
// @access   Private/Admin
const deleteContact = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { id } = req.params;

    const author = req.userData.userId;

    try {
      const foundUser = await User.findById(author).exec();

      if (!foundUser || foundUser.role !== 'admin') {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundReport = await Contact.findById(id);

      if (!foundReport) {
        const error = new HttpError(
          'Something went wrong, please try again',
          401
        );
        return next(error);
      }

      await foundReport.deleteOne();

      res.json({ message: 'Report deleted' });
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
  sendContact,
  getContacts,
  getUnseenContacts,
  updateContactStatus,
  deleteContact,
};
