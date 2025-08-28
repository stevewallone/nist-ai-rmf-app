import Assessment from '../models/Assessment.js';
import Document from '../models/Document.js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import XLSX from 'xlsx';

export const generateComplianceReport = async (req, res) => {
  try {
    const { assessmentId, format = 'pdf' } = req.params;
    
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      organization: req.user.organization._id
    }).populate(['assessor', 'organization', 'reviewers.user']);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    let reportBuffer;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'pdf':
        reportBuffer = await generatePDFReport(assessment);
        contentType = 'application/pdf';
        filename = `compliance-report-${assessment.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        break;
      case 'excel':
        reportBuffer = await generateExcelReport(assessment);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `compliance-report-${assessment.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
        break;
      case 'json':
        reportBuffer = Buffer.from(JSON.stringify(await generateJSONReport(assessment), null, 2));
        contentType = 'application/json';
        filename = `compliance-report-${assessment.title.replace(/\s+/g, '-').toLowerCase()}.json`;
        break;
      default:
        return res.status(400).json({ message: 'Unsupported format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(reportBuffer);

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const organizationId = req.user.organization._id;

    const [assessments, documents] = await Promise.all([
      Assessment.find({ organization: organizationId }).populate('assessor'),
      Document.find({ organization: organizationId, isActive: true })
    ]);

    const overviewStats = {
      totalAssessments: assessments.length,
      completedAssessments: assessments.filter(a => a.overallStatus === 'completed').length,
      highRiskItems: assessments.filter(a => a.overallRiskScore < 60).length,
      avgComplianceScore: Math.round(
        assessments.reduce((sum, a) => sum + a.overallRiskScore, 0) / assessments.length || 0
      )
    };

    const recentAssessments = assessments
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(assessment => ({
        title: assessment.title,
        status: assessment.overallStatus,
        riskScore: assessment.overallRiskScore,
        updatedAt: assessment.updatedAt,
        aiSystem: assessment.aiSystem
      }));

    const riskTrends = generateRiskTrends(assessments);
    const complianceByFramework = calculateComplianceByFramework(assessments);

    res.json({
      overviewStats,
      recentAssessments,
      riskTrends,
      complianceByFramework
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const generateRiskRegister = async (req, res) => {
  try {
    const assessments = await Assessment.find({
      organization: req.user.organization._id
    }).populate('assessor');

    const riskRegister = [];

    assessments.forEach(assessment => {
      Object.keys(assessment.framework).forEach(sectionKey => {
        const section = assessment.framework[sectionKey];
        if (section.subcategories) {
          section.subcategories.forEach(subcategory => {
            if (subcategory.implementation !== 'fully-implemented') {
              riskRegister.push({
                assessmentTitle: assessment.title,
                aiSystemName: assessment.aiSystem.name,
                frameworkSection: sectionKey.toUpperCase(),
                subcategoryId: subcategory.subcategoryId,
                outcome: subcategory.outcome,
                currentImplementation: subcategory.implementation,
                riskLevel: getRiskLevel(subcategory.implementation),
                assessor: assessment.assessor.firstName + ' ' + assessment.assessor.lastName,
                lastReviewed: subcategory.lastReviewed,
                notes: subcategory.notes
              });
            }
          });
        }
      });
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(riskRegister);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Risk Register');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="risk-register.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Risk register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

async function generatePDFReport(assessment) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]);
  let yPosition = 750;

  // Title
  page.drawText('NIST AI Risk Management Framework', {
    x: 50,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.3, 0.7)
  });
  page.drawText('Compliance Assessment Report', {
    x: 50,
    y: yPosition - 25,
    size: 16,
    font: boldFont,
    color: rgb(0.2, 0.3, 0.7)
  });

  yPosition -= 60;

  // Assessment Details
  const details = [
    `Assessment Title: ${assessment.title}`,
    `AI System: ${assessment.aiSystem.name}`,
    `Organization: ${assessment.organization.name}`,
    `Assessor: ${assessment.assessor.firstName} ${assessment.assessor.lastName}`,
    `Overall Status: ${assessment.overallStatus}`,
    `Overall Risk Score: ${assessment.overallRiskScore}%`,
    `Created: ${new Date(assessment.createdAt).toLocaleDateString()}`,
    `Last Updated: ${new Date(assessment.updatedAt).toLocaleDateString()}`
  ];

  details.forEach(detail => {
    page.drawText(detail, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font
    });
    yPosition -= 20;
  });

  yPosition -= 20;

  // Framework Sections
  Object.keys(assessment.framework).forEach(sectionKey => {
    const section = assessment.framework[sectionKey];
    
    if (yPosition < 100) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }

    page.drawText(`${sectionKey.toUpperCase()} Framework`, {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.5, 0.8)
    });
    yPosition -= 25;

    page.drawText(`Status: ${section.completed ? 'Completed' : 'In Progress'}`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: font
    });
    yPosition -= 20;

    if (section.subcategories && section.subcategories.length > 0) {
      section.subcategories.forEach(subcategory => {
        if (yPosition < 80) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = 750;
        }

        page.drawText(`${subcategory.subcategoryId}: ${subcategory.outcome}`, {
          x: 90,
          y: yPosition,
          size: 10,
          font: font
        });
        yPosition -= 15;

        page.drawText(`Implementation: ${subcategory.implementation}`, {
          x: 110,
          y: yPosition,
          size: 9,
          font: font,
          color: getImplementationColor(subcategory.implementation)
        });
        yPosition -= 15;

        if (subcategory.notes) {
          const noteLines = wrapText(subcategory.notes, 60);
          noteLines.forEach(line => {
            if (yPosition < 60) {
              page = pdfDoc.addPage([612, 792]);
              yPosition = 750;
            }
            page.drawText(`Notes: ${line}`, {
              x: 110,
              y: yPosition,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
            yPosition -= 12;
          });
        }
        yPosition -= 10;
      });
    }
    yPosition -= 20;
  });

  return await pdfDoc.save();
}

async function generateExcelReport(assessment) {
  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Assessment Title', assessment.title],
    ['AI System', assessment.aiSystem.name],
    ['Organization', assessment.organization.name],
    ['Assessor', `${assessment.assessor.firstName} ${assessment.assessor.lastName}`],
    ['Overall Status', assessment.overallStatus],
    ['Overall Risk Score', `${assessment.overallRiskScore}%`],
    ['Created Date', new Date(assessment.createdAt).toLocaleDateString()],
    ['Last Updated', new Date(assessment.updatedAt).toLocaleDateString()]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

  // Framework details sheet
  const frameworkData = [];
  frameworkData.push(['Framework Section', 'Subcategory ID', 'Outcome', 'Implementation Level', 'Notes', 'Last Reviewed']);

  Object.keys(assessment.framework).forEach(sectionKey => {
    const section = assessment.framework[sectionKey];
    if (section.subcategories) {
      section.subcategories.forEach(subcategory => {
        frameworkData.push([
          sectionKey.toUpperCase(),
          subcategory.subcategoryId,
          subcategory.outcome,
          subcategory.implementation,
          subcategory.notes || '',
          subcategory.lastReviewed ? new Date(subcategory.lastReviewed).toLocaleDateString() : ''
        ]);
      });
    }
  });

  const frameworkWs = XLSX.utils.aoa_to_sheet(frameworkData);
  XLSX.utils.book_append_sheet(workbook, frameworkWs, 'Framework Details');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function generateJSONReport(assessment) {
  return {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: assessment.assessor.email,
      reportType: 'NIST AI RMF Compliance Report'
    },
    assessment: {
      id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      aiSystem: assessment.aiSystem,
      overallStatus: assessment.overallStatus,
      overallRiskScore: assessment.overallRiskScore,
      assessor: {
        name: `${assessment.assessor.firstName} ${assessment.assessor.lastName}`,
        email: assessment.assessor.email
      },
      organization: {
        name: assessment.organization.name,
        industry: assessment.organization.industry
      },
      framework: assessment.framework,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      completedAt: assessment.completedAt
    }
  };
}

function generateRiskTrends(assessments) {
  const trends = [];
  const last6Months = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    last6Months.push({
      date: date.toISOString().slice(0, 7),
      score: Math.floor(Math.random() * 20) + 70 // Mock data
    });
  }
  
  return last6Months;
}

function calculateComplianceByFramework(assessments) {
  if (assessments.length === 0) {
    return { govern: 0, map: 0, measure: 0, manage: 0 };
  }

  const totals = { govern: 0, map: 0, measure: 0, manage: 0 };
  let counts = { govern: 0, map: 0, measure: 0, manage: 0 };

  assessments.forEach(assessment => {
    Object.keys(assessment.framework).forEach(section => {
      if (assessment.framework[section].subcategories) {
        const sectionScore = calculateSectionScore(assessment.framework[section]);
        totals[section] += sectionScore;
        counts[section]++;
      }
    });
  });

  return {
    govern: counts.govern > 0 ? Math.round(totals.govern / counts.govern) : 0,
    map: counts.map > 0 ? Math.round(totals.map / counts.map) : 0,
    measure: counts.measure > 0 ? Math.round(totals.measure / counts.measure) : 0,
    manage: counts.manage > 0 ? Math.round(totals.manage / counts.manage) : 0
  };
}

function calculateSectionScore(section) {
  if (!section.subcategories || section.subcategories.length === 0) return 0;
  
  const scores = {
    'not-started': 0,
    'partially-implemented': 25,
    'substantially-implemented': 75,
    'fully-implemented': 100
  };

  const totalScore = section.subcategories.reduce((sum, sub) => {
    return sum + (scores[sub.implementation] || 0);
  }, 0);

  return totalScore / section.subcategories.length;
}

function getRiskLevel(implementation) {
  switch (implementation) {
    case 'not-started': return 'Critical';
    case 'partially-implemented': return 'High';
    case 'substantially-implemented': return 'Medium';
    case 'fully-implemented': return 'Low';
    default: return 'Unknown';
  }
}

function getImplementationColor(implementation) {
  switch (implementation) {
    case 'fully-implemented': return rgb(0, 0.8, 0);
    case 'substantially-implemented': return rgb(0.8, 0.8, 0);
    case 'partially-implemented': return rgb(1, 0.5, 0);
    case 'not-started': return rgb(1, 0, 0);
    default: return rgb(0, 0, 0);
  }
}

function wrapText(text, maxLength) {
  if (!text) return [''];
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [''];
}