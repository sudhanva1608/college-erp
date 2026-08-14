import { Router } from 'express';
import { login, register, getMe, getUsersByRole, updateUser, deleteUser, uploadStudents } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { authenticate, authorize } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { upload } from '../config/multer';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/register', authenticate, authorize(['dean', 'principal']), authLimiter, validate(registerSchema), register);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorize(['dean', 'principal']), getUsersByRole);
router.patch('/users/:id', authenticate, authorize(['dean', 'principal']), updateUser);
router.delete('/users/:id', authenticate, authorize(['dean', 'principal']), deleteUser);

// Student bulk upload from file (Excel, Word, PDF)
router.post('/students/upload', authenticate, authorize(['dean', 'principal']), upload.single('file'), uploadStudents);

export default router;
