import express from 'express';
import { check } from 'express-validator';
import { checkAuth } from '../middleware/checkAuth';
import {
  deleteContact,
  getContacts,
  getUnseenContacts,
  sendContact,
  updateContactStatus,
} from '../controllers/community/contact';
import { loginLimiter } from '../middleware/loginLimiter';

const router = express.Router();

router.get('/', checkAuth, getContacts);
router.get('/unseen', checkAuth, getUnseenContacts);

router.post('/', loginLimiter, sendContact);

router.patch('/update/:contactId', checkAuth, updateContactStatus);
router.delete('/:id', checkAuth, deleteContact);

export default router;
