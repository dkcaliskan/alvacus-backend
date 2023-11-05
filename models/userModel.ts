import { model, Schema } from 'mongoose';

const followersSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const commentedCalculatorsSchema = new Schema({
  calculatorId: {
    type: Schema.Types.ObjectId,
    ref: 'Calculator',
    required: true,
  },

  text: {
    type: String,
    required: true,
  },
});

const repliedCommentsSchema = new Schema({
  calculatorId: {
    type: Schema.Types.ObjectId,
    ref: 'Calculator',
    required: true,
  },
  commentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const savedCalculatorsSchema = new Schema({
  calculatorId: {
    type: Schema.Types.ObjectId,
    ref: 'Calculator',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const likedCommentsSchema = new Schema({
  commentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
});

const notificationSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const privacySettingsSchema = new Schema({
  showSavedCalculators: {
    type: Boolean,
    default: false,
  },
  showComments: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    userIp: {
      type: String,
    },
    slug: {
      type: String,
    },
    profession: {
      type: String,
    },
    company: {
      type: String,
    },
    avatar: {
      type: String,
    },
    googleId: {
      type: String,
    },
    isActivated: {
      type: Boolean,
      default: true,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
      required: true,
    },
    notifications: [notificationSchema],
    commentedCalculators: [commentedCalculatorsSchema],
    repliedComments: [repliedCommentsSchema],
    followers: [followersSchema],
    savedCalculators: [savedCalculatorsSchema],
    likedComments: [likedCommentsSchema],
    privacySettings: privacySettingsSchema,
  },
  {
    timestamps: true,
  }
);

const User = model('User', userSchema);

export default User;
