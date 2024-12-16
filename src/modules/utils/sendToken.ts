import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from 'src/models/user.model';
import config from '../../config/config';

const sendToken = (user: User, statusCode: number, res: Response) => {
  const { password: _, ...userWithoutPassword } = user;

  const token = jwt.sign(userWithoutPassword, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpirationDays,
  });

  res.status(statusCode).json({ success: true, user: userWithoutPassword, token });
};

export default sendToken;
