import { NextFunction, Request } from 'express';
import Joi from 'joi';

const schema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  profile: Joi.string().optional(),
  password: Joi.string()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 1 letter and 1 number',
    }),
});

export const userValidation = (req: Request, res: any, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0]?.message);
  }
  next();
};
