import mongoose from 'mongoose';

export interface User extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  profile: string;
  role: string;
  isVerified: boolean;
}

const UserSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    password: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    profile: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model('User', UserSchema);

export default User;
