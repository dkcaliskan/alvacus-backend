import { model, Schema } from 'mongoose';

const reportSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    calculatorTitle: {
      type: String,
    },
    calculatorId: {
      type: String,
    },
    commentContent: {
      type: String,
    },
    commentId: {
      type: String,
    },
    commentReportReasons: {
      type: Array,
    },
    isReportSeen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Report = model('Report', reportSchema);

export default Report;
