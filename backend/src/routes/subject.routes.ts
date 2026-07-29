import { Router } from 'express';
import { getSubjects, createSubject } from '../controllers/subject.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();
const supervisorRoles = [Role.dean, Role.principal] as const;

router.get('/', authenticate, authorize(supervisorRoles), getSubjects);
router.post('/', authenticate, authorize(supervisorRoles), createSubject);

export default router;
