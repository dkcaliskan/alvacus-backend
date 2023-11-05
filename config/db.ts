import mongoose, { ConnectOptions } from 'mongoose';

const connectDB = () => {
  try {
    mongoose.set('strictQuery', false);
    mongoose.connect(process.env.MONGO_URI!);
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`Error`);
    process.exit(1);
  }
};

export default connectDB;
