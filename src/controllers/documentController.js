import Document from '../models/Document.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, text, and image files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

export const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = [];

    for (const file of req.files) {
      const document = new Document({
        title: req.body.title || file.originalname,
        description: req.body.description,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: req.body.category || 'other',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        organization: req.user.organization._id,
        assessment: req.body.assessmentId,
        uploadedBy: req.user._id
      });

      await document.save();
      documents.push(document);
    }

    res.status(201).json({
      message: 'Documents uploaded successfully',
      files: documents
    });
  } catch (error) {
    console.error('Document upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { category, tags, search, page = 1, limit = 10 } = req.query;
    const query = { 
      organization: req.user.organization._id,
      isActive: true 
    };

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      organization: req.user.organization._id,
      isActive: true
    }).populate(['uploadedBy', 'approvedBy']);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      organization: req.user.organization._id,
      isActive: true
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.resolve(document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimeType);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    
    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization._id,
        isActive: true
      },
      {
        title,
        description,
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['uploadedBy', 'approvedBy']);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: 'Document updated successfully',
      document
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization._id,
        isActive: true
      },
      {
        approvedBy: req.user._id,
        approvalDate: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate(['uploadedBy', 'approvedBy']);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: 'Document approved successfully',
      document
    });
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};