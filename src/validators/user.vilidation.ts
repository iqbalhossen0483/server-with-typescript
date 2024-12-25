import { NextFunction, Request } from 'express';
import Joi from 'joi';

const postUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  profile: Joi.string().optional(),
  role: Joi.string().optional(),
  password: Joi.string().optional(),
});

export const postUser = (req: Request, res: any, next: NextFunction) => {
  const { error } = postUserSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0]?.message);
  }
  next();
};
