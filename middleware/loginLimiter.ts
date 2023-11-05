import { rateLimit } from 'express-rate-limit';
import { logEvents } from './logger';

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 5, // Limit each IP to 5 login requests per `window`per minute
  message: {
    message: 'Too many attempts, please try again later.',
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too Many requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.url}\t${req.headers.origin}`,
      'errLog.log'
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export { loginLimiter };
