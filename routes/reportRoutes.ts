import express from 'express';
import { check } from 'express-validator';
import { checkAuth } from '../middleware/checkAuth';
import {
  deleteReport,
  getReports,
  sendCommentReport,
  submitReport,
  updateReportStatus,
  getUnseenReports,
} from '../controllers/community/report';
import { loginLimiter } from '../middleware/loginLimiter';

const router = express.Router();

router.get('/', checkAuth, getReports);
router.get('/unseen', checkAuth, getUnseenReports);

router.post('/submit', loginLimiter, submitReport);
router.post('/comment-report', loginLimiter, sendCommentReport);

router.patch('/update/:reportId', checkAuth, updateReportStatus);
router.delete('/:reportId', checkAuth, deleteReport);

export default router;
