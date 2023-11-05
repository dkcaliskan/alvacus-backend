import express from 'express';
import { checkAuth } from '../middleware/checkAuth';

import { getUserById, getUsers } from '../controllers/user/get-users';

import {
  deleteUser,
  putChangePassword,
  putChangePrivacy,
  putEditUser,
  sendActivationEmail,
  userActivation,
} from '../controllers/user/edit-users';

const router = express.Router();

// GET
router.get('/', checkAuth, getUsers);
router.get('/:userId', getUserById);

// PUT
router.put('/edit/:userId', checkAuth, putEditUser);
router.put('/change-password/:userId', checkAuth, putChangePassword);
router.put('/change-privacy/:userId', checkAuth, putChangePrivacy);

// POST
router.post('/activation/resend', checkAuth, sendActivationEmail);
router.put('/activation/:t', userActivation);

router.delete('/delete/:userId', checkAuth, deleteUser);

export default router;
