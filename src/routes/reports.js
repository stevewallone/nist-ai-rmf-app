import express from 'express';
import { 
  generateComplianceReport,
  getDashboardData,
  generateRiskRegister
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles, checkOrganizationAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardData);

router.get('/risk-register', 
  authorizeRoles('admin', 'assessor', 'auditor'),
  generateRiskRegister
);

router.get('/:assessmentId/:format', 
  checkOrganizationAccess,
  generateComplianceReport
);

export default router;