// Api & core imports
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { jwtDecode } from 'jwt-decode';

// Models
import HttpError from '../models/http-error';
import User from '../models/userModel';

// Constants
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  REFRESH_TOKEN_EXPIRE_TIME,
  COOKIE_EXPIRE_TIME,
} from '../constants/token-dates';
import sendNodemail from '../utils/sendNodemail';

dotenv.config();

interface UserRequest extends Request {
  userData?: any;
}
interface JwtPayload {
  userId: string;
  username: string;
  name: string;
  sub: any;
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
    privacySettings: {
      showSavedCalculators: boolean;
      showComments: boolean;
    };
  };
}

// @desc     Auth user & get token
// @route    POST /api/auth/login
// @access   Public
const login = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  const ipAddress = req.clientIp;

  if (!password) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }

  let foundUser = await User.findOne({ username }).exec();
  let foundEmail = await User.findOne({ email }).exec();

  const user = foundUser || foundEmail;
  if (!user) {
    const error = new HttpError('Unauthorized', 401);
    return next(error);
  }

  const match = await bcrypt.compare(password, user.password!);
  if (!match) {
    const error = new HttpError('Unauthorized', 401);
    return next(error);
  }

  user.userIp = ipAddress;

  try {
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: user.username,
          email: user.email,
          userId: user._id,
          role: user.role,
          avatar: user.avatar,
          profession: user.profession,
          company: user.company,
          isActivated: user.isActivated,
          privacySettings: user.privacySettings,
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: String(ACCESS_TOKEN_EXPIRE_TIME) }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: String(REFRESH_TOKEN_EXPIRE_TIME) }
    );

    // Create cookie with refresh token

    res.cookie('jwt', refreshToken, {
      httpOnly: true, // Accessible only by web server
      sameSite: 'strict', // Cross-site cookie
      maxAge: COOKIE_EXPIRE_TIME,
    });

    // Send accessToken containing username and roles
    res.json({
      accessToken,
      maxAge: new Date().getTime() + COOKIE_EXPIRE_TIME,
    });

    await user.save();
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Auth user with token & get token
// @route    POST /api/auth/access
// @access   Public
const accessLogin = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { userToken } = req.body;
    const ipAddress = req.clientIp;

    console.log(userToken);

    if (!userToken) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      let decodedUser;
      try {
        decodedUser = jwt.verify(
          userToken,
          process.env.ACCESS_TOKEN_SECRET!
        ) as JwtPayload;
      } catch (err) {
        const error = new HttpError('Authentication failed', 401);
        return next(error);
      }
      if (!decodedUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }
      const foundUser = await User.findById(decodedUser.UserInfo.userId);

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      foundUser.userIp = ipAddress;

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
            isActivated: foundUser.isActivated,
            privacySettings: foundUser.privacySettings,
          },
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: String(ACCESS_TOKEN_EXPIRE_TIME) }
      );

      const refreshToken = jwt.sign(
        { userId: foundUser._id },
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: String(REFRESH_TOKEN_EXPIRE_TIME) }
      );

      // Create cookie with refresh token

      res.cookie('jwt', refreshToken, {
        httpOnly: true, // Accessible only by web server
        sameSite: 'strict', // Cross-site cookie
        maxAge: COOKIE_EXPIRE_TIME,
      });

      // Send accessToken containing username and roles
      res.json({
        accessToken,
        maxAge: new Date().getTime() + COOKIE_EXPIRE_TIME,
      });

      await foundUser.save();
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Auth user with google & get token
// @route    POST /api/auth/google
// @access   Public
const googleLogin = asyncHandler(async (req, res, next) => {
  const { google_id_token } = req.body;
  const ipAddress = req.clientIp;

  if (!google_id_token) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }
  try {
    const googleId = google_id_token;
    const googleProfile = jwtDecode(googleId) as JwtPayload;

    let foundUser = await User.findOne({ googleId: googleProfile.sub }).exec();
    let foundEmail = await User.findOne({ email: googleProfile.email }).exec();

    let user = foundUser || foundEmail;
    if (!user) {
      user = new User({
        googleId: googleProfile.sub,
        username: googleProfile.name.toLowerCase(),
        email: googleProfile.email.toLowerCase(),
        isActivated: googleProfile.email_verified,
        avatar: googleProfile.picture,
        userIp: ipAddress,
        privacySettings: {
          showSavedCalculators: false,
          showComments: false,
        },
      });

      await user.save();
    } else if (foundEmail) {
      foundEmail.googleId = googleProfile.sub;
      foundEmail.avatar = googleProfile.picture;
      foundEmail.isActivated = googleProfile.email_verified;
      foundEmail.userIp = ipAddress;

      user = await foundEmail.save();
    }
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: user.username,
          email: user.email,
          userId: user._id,
          role: user.role,
          avatar: user.avatar,
          profession: user.profession,
          company: user.company,
          isActivated: user.isActivated,
          privacySettings: user.privacySettings,
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: String(ACCESS_TOKEN_EXPIRE_TIME) }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: String(REFRESH_TOKEN_EXPIRE_TIME) }
    );

    // Create cookie with refresh token

    res.cookie('jwt', refreshToken, {
      httpOnly: true, // Accessible only by web server
      sameSite: 'strict', // Cross-site cookie
      maxAge: COOKIE_EXPIRE_TIME,
    });

    // Send accessToken containing username and roles
    res.json({
      accessToken,
      maxAge: new Date().getTime() + COOKIE_EXPIRE_TIME,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  }
});

// @desc     Refresh token
// @route    GET /api/auth/refresh
// @access   Private
const refresh = async (req: Request, res: Response) => {
  const cookies = req.cookies;
  const ipAddress = req.clientIp;
  if (!req.cookies.jwt) {
    return res.status(401).send({ message: 'Unauthorized' });
  }
  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as JwtPayload;
    if (!decoded) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const foundUser = await User.findById({ _id: decoded.userId });
    if (!foundUser) return res.status(401).json({ message: 'Unauthorized' });

    foundUser.userIp = ipAddress;

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
          isActivated: foundUser.isActivated,
          privacySettings: foundUser.privacySettings,
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
    );

    res.json({
      accessToken,
    });

    await foundUser.save();
  } catch (err) {
    return res
      .status(404)
      .send({ message: 'Something went wrong, try again!' });
  }
};

// @desc     Logout
// @route    POST /api/auth/logout
// @access   Private
const logout = (req: Request, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }
  res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Cookie cleared' });
};

// @desc     Register a new user
// @route    POST /api/auth/register
// @access   Public
const register = asyncHandler(async (req, res, next) => {
  /* const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed.', 422));
  } */

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    const error = new HttpError('All fields are required', 400);
    return next(error);
  }

  if (!username.match(/^[a-zA-Z0-9_]+$/)) {
    const error = new HttpError(
      'Special characters is not allowed in username',
      423
    );
    return next(error);
  }

  const foundUser = await User.findOne({ username }).exec();

  if (foundUser) {
    const error = new HttpError('User already exist', 422);
    return next(error);
  }

  const foundEmail = await User.findOne({ email }).exec();

  if (foundEmail) {
    const error = new HttpError('User already exist', 422);
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
  const createUser = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashedPassword,
    slug: username.toLowerCase(),
    privacySettings: {
      showSavedCalculators: false,
      showComments: false,
    },
  });

  try {
    await createUser.save();
  } catch (err) {
    const error = new HttpError('Register is failed, please try again', 500);
    return next(error);
  }

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: createUser.username,
        email: createUser.email,
        userId: createUser._id,
        role: createUser.role,
        avatar: createUser.avatar,
        profession: createUser.profession,
        company: createUser.company,
        isActivated: createUser.isActivated,
        privacySettings: createUser.privacySettings,
      },
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
  );

  const refreshToken = jwt.sign(
    { userId: createUser._id },
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

  // Send verification via email
  /* try {
    const activationToken = jwt.sign(
      {
        UserInfo: {
          userId: createUser._id,
          isActivated: true,
        },
      },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_TOKEN_EXPIRE_TIME }
    );
    const replacements = {
      username: createUser.username,
      activationLink: `${process.env.CLIENT_URL}/auth/activation?t=${activationToken}&uuid=${createUser._id}`,
    };
    await sendNodemail({
      filepath: '../emails/verification.html',
      subject: 'Alvacus account verification',
      replacements,
      email: createUser.email,
    });
  } catch (err) {
    const error = new HttpError('Something went wrong, try again!', 404);
    return next(error);
  } */
});

// @desc     Send user reset password email
// @route    POST /api/auth/forgot-password
// @access   Public
const sendResetPasswordEmail = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { email } = req.body;

    if (!email) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      const foundUser = await User.findOne({
        email: email.toLowerCase(),
      }).exec();

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const payload = {
        UserInfo: {
          email: foundUser.email,
          userId: foundUser._id,
        },
      };
      const resetToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '1h',
      });

      const replacements = {
        username: foundUser.username,
        email: foundUser.email,
        resetLink: `${process.env.CLIENT_URL}/reset-password?t=${resetToken}`,
      };

      await sendNodemail({
        filepath: '../emails/reset-password.html',
        subject: 'Alvacus password reset',
        replacements,
        email: email,
      });

      res.send({ message: 'success' });
    } catch (err) {
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

// @desc     Reset user password
// @route    PUT /api/auth/reset-password
// @access   Public
const resetPassword = asyncHandler(
  async (req: UserRequest, res: Response, next) => {
    const { password, t } = req.body;

    console.log(`first`);
    if (!password || !t) {
      const error = new HttpError('All fields are required', 400);
      return next(error);
    }

    try {
      const payload = jwt.verify(t, process.env.JWT_SECRET!) as JwtPayload;
      const { email, userId } = payload.UserInfo;

      if (!email || !userId) {
        const error = new HttpError('Unauthorized', 401);
        return next(error);
      }

      const foundUser = await User.findById(userId).exec();

      if (!foundUser) {
        const error = new HttpError('Unauthorized', 401);
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
    } catch (err) {
      console.log(err);
      const error = new HttpError('Something went wrong, try again!', 404);
      return next(error);
    }
  }
);

export {
  login,
  accessLogin,
  googleLogin,
  refresh,
  logout,
  register,
  sendResetPasswordEmail,
  resetPassword,
};
