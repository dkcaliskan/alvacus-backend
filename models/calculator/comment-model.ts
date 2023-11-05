import mongoose, { model, Schema } from 'mongoose';

const repliesSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const likedUsersSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
});

const CommentSchema = new Schema(
  {
    calculatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calculator',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    likes: [likedUsersSchema],
    replies: [repliesSchema],
  },
  {
    timestamps: true,
  }
);

const Comment = model('Comment', CommentSchema);

export default Comment;
