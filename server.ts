import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import requestIp from 'request-ip';

// DB and Configs
import connectDB from './config/db';
import corsOptions from './config/corsOptions';

// Middleware
import { logEvents } from './middleware/logger';
import HttpError from './models/http-error';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import calculatorRoutes from './routes/calculatorRoutes';
import reportRoutes from './routes/reportRoutes';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

// Connect to MongoDB database
connectDB();

// Initialize express app
const app: Express = express();

// Cors
app.use(cors(corsOptions));

// Request ip
app.use(requestIp.mw());

// Use body-parser to parse incoming request bodies
app.use(bodyParser.json());

// Use the cookie-parser middleware
app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Alvacus' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/contact', contactRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error: any, req: Request, res: Response, next: Function) => {
  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
