import Assessment from '../models/Assessment.js';
import RiskTemplate from '../models/RiskTemplate.js';

export const createAssessment = async (req, res) => {
  try {
    const assessmentData = {
      ...req.body,
      organization: req.user.organization._id,
      assessor: req.user._id
    };

    const assessment = new Assessment(assessmentData);
    await assessment.save();
    
    await assessment.populate(['assessor', 'organization']);

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssessments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { organization: req.user.organization._id };
    
    if (status) {
      query.overallStatus = status;
    }

    const assessments = await Assessment.find(query)
      .populate('assessor', 'firstName lastName email')
      .populate('organization', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assessment.countDocuments(query);

    res.json({
      assessments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      organization: req.user.organization._id
    }).populate(['assessor', 'organization', 'reviewers.user']);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization._id
      },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate(['assessor', 'organization']);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({
      message: 'Assessment updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organization._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFrameworkSection = async (req, res) => {
  try {
    const { section, data } = req.body;
    const updatePath = `framework.${section}`;

    const assessment = await Assessment.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization._id
      },
      { 
        [updatePath]: data,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const overallRiskScore = calculateOverallRiskScore(assessment);
    assessment.overallRiskScore = overallRiskScore;
    
    if (isAssessmentComplete(assessment)) {
      assessment.overallStatus = 'completed';
      assessment.completedAt = new Date();
    }
    
    await assessment.save();

    res.json({
      message: 'Framework section updated successfully',
      assessment
    });
  } catch (error) {
    console.error('Update framework section error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFrameworkTemplates = async (req, res) => {
  try {
    const templates = await RiskTemplate.find({ isActive: true })
      .sort({ frameworkFunction: 1, category: 1, subcategoryId: 1 });

    const groupedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.frameworkFunction]) {
        acc[template.frameworkFunction] = [];
      }
      acc[template.frameworkFunction].push(template);
      return acc;
    }, {});

    res.json({ templates: groupedTemplates });
  } catch (error) {
    console.error('Get framework templates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

function calculateOverallRiskScore(assessment) {
  const sections = ['govern', 'map', 'measure', 'manage'];
  let totalScore = 0;
  let totalItems = 0;

  sections.forEach(section => {
    if (assessment.framework[section].subcategories) {
      assessment.framework[section].subcategories.forEach(subcategory => {
        const implementationScores = {
          'not-started': 0,
          'partially-implemented': 25,
          'substantially-implemented': 75,
          'fully-implemented': 100
        };
        
        totalScore += implementationScores[subcategory.implementation] || 0;
        totalItems++;
      });
    }
  });

  return totalItems > 0 ? Math.round(totalScore / totalItems) : 0;
}

function isAssessmentComplete(assessment) {
  const sections = ['govern', 'map', 'measure', 'manage'];
  return sections.every(section => 
    assessment.framework[section].completed === true
  );
}