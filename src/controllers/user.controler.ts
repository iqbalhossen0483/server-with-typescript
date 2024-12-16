import { genSalt, hash } from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import User from '../models/user.model';
import { catchAsync } from '../modules/utils';

//add user;
export const postUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const isExist = await User.findOne({ email: req.body.email });
  if (isExist) {
    return next({ message: 'User already exist', status: 400 });
  }

  const salt = await genSalt(10);
  const hashedPassword = await hash(req.body.password, salt);
  req.body.password = hashedPassword;

  const result = await User.create(req.body);
  if (result._id) {
    res.send(result);
  } else {
    next({ message: 'Unable to add user', status: 500 });
  }
});

//get single user
export const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params['id'];

  if (!userId) {
    return next({ message: 'User id is required', status: 400 });
  }

  const user = await User.findById({ _id: userId });
  if (user) {
    res.send(user);
  } else {
    next({ message: 'User not found', status: 404 });
  }
});

// get all users
export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await User.find({ email: { $ne: req.user.email } });
  res.send(users);
});

//update user
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params['id'];

  if (!userId) {
    return next({ message: 'User id is required', status: 400 });
  }

  const user = await User.findById({ _id: userId });
  if (!user) {
    return next({ message: 'User not found', status: 404 });
  }

  if (user?.email !== req.user.email && req.user.role !== 'admin') {
    return next({ message: 'You can not update this account', status: 400 });
  }

  delete req.body.email;
  delete req.body.password;

  await User.findByIdAndUpdate({ _id: userId }, req.body, { new: true });

  res.send({ success: true, message: 'User updated successfully' });
});
