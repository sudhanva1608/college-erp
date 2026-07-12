import { Router } from 'express';
import {
  getStudentTimetable,
  getTeacherTimetable,
  getTeacherSubjects,
} from '../controllers/timetable.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/student', authenticate, authorize(['student']), getStudentTimetable);
router.get('/teacher', authenticate, authorize(['teacher']), getTeacherTimetable);
router.get('/teacher-subjects', authenticate, authorize(['teacher']), getTeacherSubjects);

export default router;
