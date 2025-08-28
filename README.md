# NIST AI Risk Management Framework Compliance Application

A comprehensive web application for implementing and verifying compliance with the NIST AI Risk Management Framework (AI RMF 1.0). This application provides organizations with tools for AI risk assessment, governance tracking, documentation management, and compliance reporting.

## Features

### Core Framework Implementation
- **GOVERN**: AI governance and risk management processes
- **MAP**: AI system context understanding and risk categorization
- **MEASURE**: AI system impact analysis and monitoring
- **MANAGE**: AI risk allocation and mitigation actions

### Key Capabilities
- ✅ Interactive assessment questionnaires for all AI RMF subcategories
- ✅ Risk scoring and prioritization matrix
- ✅ Evidence collection and documentation upload
- ✅ Progress tracking across framework requirements
- ✅ Executive governance dashboard with risk visualization
- ✅ Centralized document management with version control
- ✅ Automated compliance report generation (PDF, Excel, JSON)
- ✅ Role-based access control (Admin, Assessor, Auditor, Viewer)
- ✅ Multi-tenant architecture for service providers

### Risk Categories Coverage
- Human-AI Configuration
- Harmful Bias and Homogenization
- Dangerous, Violent, or Hateful Content
- Data Privacy
- Intellectual Property
- Environmental Impact
- Value Chain and Component Integration
- Operational and System Security
- Information Security
- Information Integrity

## Technology Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Multer for file uploads
- PDF-lib for report generation
- XLSX for Excel exports

### Frontend
- React 18 with Vite
- React Router for navigation
- React Hook Form for form management
- Tailwind CSS for styling
- Headless UI components
- Chart.js for data visualization
- React Hot Toast for notifications

### Security
- Helmet.js for security headers
- Rate limiting
- CORS configuration
- Input validation and sanitization
- Secure file upload handling
- JWT token authentication

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-rmf-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/nist-ai-rmf
   JWT_SECRET=your-super-secret-jwt-key
   MAX_FILE_SIZE=10485760
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   # Development mode (starts both frontend and backend)
   npm run dev
   
   # Or start individually
   npm run server:dev  # Backend only
   npm run client:dev  # Frontend only
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

### Getting Started

1. **Register an Organization**
   - Visit the registration page
   - Create an admin account for your organization
   - Provide organization details (name, industry, size)

2. **Create Your First Assessment**
   - Navigate to Assessments
   - Click "New Assessment"
   - Fill in AI system details
   - Begin the assessment wizard

3. **Complete Framework Sections**
   - Work through GOVERN, MAP, MEASURE, MANAGE sections
   - Answer assessment questions
   - Upload supporting documentation
   - Track progress in real-time

4. **Generate Reports**
   - Export compliance reports in multiple formats
   - Generate risk registers
   - Share results with stakeholders

### User Roles

- **Admin**: Full system access, user management, assessment approval
- **Assessor**: Create and complete assessments, upload documents
- **Auditor**: Review assessments, approve documents, generate reports
- **Viewer**: Read-only access to assessments and reports

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # Register new user/organization
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
PUT  /api/auth/profile     # Update user profile
POST /api/auth/change-password # Change password
```

### Assessment Endpoints
```
GET    /api/assessments           # List assessments
POST   /api/assessments           # Create new assessment
GET    /api/assessments/:id       # Get specific assessment
PUT    /api/assessments/:id       # Update assessment
DELETE /api/assessments/:id       # Delete assessment
PUT    /api/assessments/:id/framework # Update framework section
GET    /api/assessments/templates # Get framework templates
```

### Document Management
```
POST   /api/documents/upload     # Upload documents
GET    /api/documents            # List documents
GET    /api/documents/:id        # Get document details
GET    /api/documents/:id/download # Download document
PUT    /api/documents/:id        # Update document metadata
DELETE /api/documents/:id        # Delete document
POST   /api/documents/:id/approve # Approve document
```

### Reporting
```
GET /api/reports/dashboard                    # Dashboard data
GET /api/reports/:assessmentId/:format       # Generate compliance report
GET /api/reports/risk-register               # Generate risk register
```

## Development

### Project Structure
```
ai-rmf-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   └── assets/          # Static assets
│   └── index.html
├── src/                      # Express backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── data/                # Seed data
├── uploads/                 # File uploads directory
└── dist/                    # Production build
```

### Available Scripts

```bash
npm run dev          # Start development servers
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Adding New Assessment Templates

1. Edit `src/data/nistAiRmfTemplates.js`
2. Add new template objects following the existing structure
3. Restart the server to seed new templates

### Customizing Risk Categories

1. Update the risk category enums in `src/models/Assessment.js`
2. Add corresponding templates in the data file
3. Update frontend components to handle new categories

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
NODE_ENV=production npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://your-production-db/nist-ai-rmf
JWT_SECRET=your-production-jwt-secret
CLIENT_URL=https://your-domain.com
MAX_FILE_SIZE=10485760
BCRYPT_ROUNDS=12
```

### Docker Deployment

```dockerfile
# Example Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## Security Considerations

- All API endpoints require authentication
- File uploads are validated and size-limited
- SQL injection protection via MongoDB
- XSS protection with input sanitization
- CORS properly configured
- Security headers implemented
- Rate limiting enabled
- Sensitive data encrypted at rest

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Review the documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- NIST AI Risk Management Framework (AI RMF 1.0)
- React and Node.js communities
- Open source contributors