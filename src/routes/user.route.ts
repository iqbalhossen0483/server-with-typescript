import express, { Router } from 'express';
import { isAdmin, isAuthenticated } from '../controllers/auth.controllers';
import { getSingleUser, getUsers, postUser, updateUser } from '../controllers/user.controler';
import { postUser as postUserValidation } from '../validators/user.vilidation';

const router: Router = express.Router();

router.post('/', isAuthenticated, isAdmin, postUserValidation, postUser);
router.get('/', isAuthenticated, isAdmin, getUsers);
router.get('/:id', isAuthenticated, isAdmin, getSingleUser);
router.put('/:id', isAuthenticated, updateUser);

export default router;
