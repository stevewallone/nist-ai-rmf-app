import express from 'express';
import { 
  uploadDocuments,
  getDocuments,
  getDocument,
  downloadDocument,
  updateDocument,
  deleteDocument,
  approveDocument,
  upload
} from '../controllers/documentController.js';
import { authenticateToken, authorizeRoles, checkOrganizationAccess } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/upload', 
  upload.array('files', 10), 
  uploadDocuments
);

router.get('/', getDocuments);

router.get('/:id', 
  checkOrganizationAccess,
  getDocument
);

router.get('/:id/download', 
  checkOrganizationAccess,
  downloadDocument
);

router.put('/:id', 
  authorizeRoles('admin', 'assessor'),
  checkOrganizationAccess,
  updateDocument
);

router.delete('/:id', 
  authorizeRoles('admin'),
  checkOrganizationAccess,
  deleteDocument
);

router.post('/:id/approve', 
  authorizeRoles('admin', 'auditor'),
  checkOrganizationAccess,
  approveDocument
);

export default router;