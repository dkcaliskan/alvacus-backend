import express from 'express';
import { check } from 'express-validator';
import { checkAuth } from '../middleware/checkAuth';
import {
  createCalc,
  deleteCalculator,
  editCalculator,
  verifyCalculator,
} from '../controllers/calculator/create-edit';

import {
  getAllCalcs,
  getCalcs,
  getCalculatorById,
  getCalculatorBySlug,
  getModularCalcs,
  getMyCalcs,
  getSavedCalcs,
  getUnverifiedCalcs,
} from '../controllers/calculator/get-calculators';

import {
  createComment,
  deleteComment,
  deleteReply,
  getComments,
  likeComment,
  replyComment,
  unlikeComment,
} from '../controllers/calculator/comment';

import {
  saveUserList,
  unSaveUserList,
} from '../controllers/calculator/save-unsave';

const router = express.Router();

// Get calculators
router.get('/', getCalcs);
router.get('/all', getAllCalcs);
router.get('/modular', getModularCalcs);
router.get('/unverified', checkAuth, getUnverifiedCalcs);
router.get('/:userId/saved', getSavedCalcs);
router.get('/:userId/my-calculators', getMyCalcs);
router.get('/:id', getCalculatorById);
router.get('/monolithic/:slug', getCalculatorBySlug);

// Create and edit calculators
router.post('/create', checkAuth, createCalc);
router.patch('/edit/:calcId', checkAuth, editCalculator);
router.delete('/delete/:calcId', checkAuth, deleteCalculator);
router.patch('/verify/:calcId', checkAuth, verifyCalculator);

// Other functions
// Comments
router.post('/:calcId/comments', checkAuth, createComment);
router.get('/:calcId/comments', getComments);
router.post('/comments/:commentId/reply', checkAuth, replyComment);
router.delete('/comments/:commentId/delete', checkAuth, deleteComment);
router.delete(
  '/comments/:commentId/replies/:replyId/delete',
  checkAuth,
  deleteReply
);

// Comment likes
router.post('/comments/:commentId/like', checkAuth, likeComment);
router.post('/comments/:commentId/unlike', checkAuth, unlikeComment);

// Save and unSave
router.post('/:calcId/:userId/save', checkAuth, saveUserList);
router.post('/:calcId/:userId/unSave', checkAuth, unSaveUserList);

export default router;
