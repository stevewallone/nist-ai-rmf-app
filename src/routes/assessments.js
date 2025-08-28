import express from 'express';
import { 
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  updateFrameworkSection,
  getFrameworkTemplates
} from '../controllers/assessmentController.js';
import { authenticateToken, authorizeRoles, checkOrganizationAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/templates', getFrameworkTemplates);

router.post('/', 
  authorizeRoles('admin', 'assessor'), 
  createAssessment
);

router.get('/', getAssessments);

router.get('/:id', 
  checkOrganizationAccess,
  getAssessment
);

router.put('/:id', 
  authorizeRoles('admin', 'assessor'),
  checkOrganizationAccess,
  updateAssessment
);

router.put('/:id/framework', 
  authorizeRoles('admin', 'assessor'),
  checkOrganizationAccess,
  updateFrameworkSection
);

router.delete('/:id', 
  authorizeRoles('admin'),
  checkOrganizationAccess,
  deleteAssessment
);

export default router;