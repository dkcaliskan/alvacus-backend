import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import HttpError from '../models/http-error';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}

const checkAuth = asyncHandler(
  (req: UserRequest, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    const token = req.cookies.jwt;
    // Check if no auth cookie
    if (!token) {
      const error = new HttpError(
        'No authentication token found, authentication denied',
        401
      );
      return next(error);
    }
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
      req.userData = decoded;

      next();
    } catch (err) {
      const error = new HttpError('Authentication failed', 401);
      return next(error);
    }
  }
);

export { checkAuth };
