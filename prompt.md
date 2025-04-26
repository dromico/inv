# Subcontractor Work Management System - Development Prompt

## Project Overview

Create a web application for a MainContractor to manage subcontractor work submissions. The system should allow subcontractors to submit job details and allow the MainContractor (admin) to review and manage these submissions.

## Tech Stack

- **Frontend Framework**: Next.js with App Router architecture
- **Backend**: Next.js API Routes
- **Database & Authentication**: Supabase
- **Styling**: Tailwind CSS with Shadcn UI components
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: TanStack Query (React Query)
- **PDF Generation**: React-PDF
- **Date Handling**: date-fns

## User Types

1. **Admin (MainContractor)** - Single admin account created during initial setup
2. **Subcontractors** - Multiple accounts, each representing different subcontractors

## Core Features

### Authentication System

- Implement Supabase Auth for user authentication
- Create login and signup pages
- Role-based access control (admin vs subcontractor)
- Protected routes based on authentication status and user role
- Middleware to verify authentication on server-side

### Subcontractor Features

- **Job Submission Form** with fields:
  - Job type
  - Location
  - Start date and end date
  - Unit quantity
  - Unit price
  - Notes/description (optional)
  - File attachments (optional)
- **Automatic calculation** of total (unit × unit price)
- **Job Management**: Add, edit, and delete their own job submissions
- **Job Status Tracking**: View the status of submitted jobs (pending, in-progress, completed)
- **Invoice Generation**: Download PDF invoices for their completed jobs
- **Notification System**: Receive notifications about status changes

### Admin Features

- **Dashboard** showing overview of all submitted jobs
- **Job Management**: View, edit, and manage all subcontractor submissions
- **Status Updates**: Change job status (pending, in-progress, completed)
- **Invoice Management**: Generate and download invoices for any job
- **Subcontractor Management**: View list of all subcontractors
- **Notifications**: Send notifications to subcontractors
- **Bulk Actions**: Ability to select multiple jobs for simultaneous status updates or invoice generation

### Invoicing System

- Professional PDF invoice generation
- Include all job details (type, location, dates, quantities, prices)
- Calculate subtotals, taxes (if applicable), and grand totals
- Include company branding
- Downloadable format
- Stored in database for future reference
- All monetary values must be displayed in Malaysian Ringgit (RM)

### Notification System

- In-app notifications for both admin and subcontractors
- Notification triggers:
  - New job submission
  - Status changes
  - Invoice generation
- Notification center showing read/unread notifications
- Real-time updates using Supabase Realtime

### Optional File Upload

- Allow attachment of files to job submissions
- Support common file types (PDF, images, etc.)
- Secure storage in Supabase Storage
- Access control for uploaded files

## Database Schema

### Users Table (handled by Supabase Auth)
- id (primary key)
- email
- hashed_password
- role (admin/subcontractor)

### Profiles Table
- id (references auth.users.id)
- company_name
- contact_person
- phone_number
- address
- created_at

### Jobs Table
- id (primary key)
- subcontractor_id (references profiles.id)
- job_type
- location
- start_date
- end_date
- unit (quantity)
- unit_price (in Malaysian Ringgit - RM)
- total (calculated: unit * unit_price, in Malaysian Ringgit - RM)
- status (pending, in-progress, completed)
- notes
- created_at
- updated_at

### Files Table (Optional)
- id (primary key)
- job_id (references jobs.id)
- file_name
- storage_path
- content_type
- uploaded_at

### Notifications Table
- id (primary key)
- recipient_id (references auth.users.id)
- message
- read (boolean)
- job_id (optional reference to jobs.id)
- created_at

## UI/UX Requirements

### General Layout
- Clean, professional interface
- Responsive design for mobile and desktop
- Intuitive navigation
- Dashboard-style layout for both user types

### Subcontractor Portal
- Dashboard showing job submissions and their status
- Easy-to-use form for new submissions
- Table/list view of submitted jobs
- Detail view for each job
- Invoice download section

### Admin Portal
- Comprehensive dashboard with key metrics
- Filterable/searchable table of all job submissions
- Calendar view option for job dates
- Subcontractor management section
- Invoice generation and download functionality

### UX Enhancements
- **Mobile Optimization**:
  - Implement mobile-first design principles
  - Ensure full functionality on smartphones for subcontractors working in the field
  - Optimize touch targets and form inputs for mobile use
- **Dashboard Organization**:
  - Display key metrics prominently (total active jobs, pending payments)
  - Show recently updated items at the top
  - Provide quick-action buttons for common tasks
- **Form Experience**:
  - Implement multi-step forms for complex submissions to reduce cognitive load
  - Add autosave functionality to prevent data loss
  - Provide contextual help and tooltips
- **Search & Filtering**:
  - Advanced search capabilities across jobs, dates, and subcontractors
  - Quick filters for common needs (e.g., "Completed this month", "Pending payment")
  - Save custom filter presets
- **User Onboarding**:
  - First-time user experience with guided tooltips
  - Well-designed empty states for new users with no data
  - Contextual help throughout the application
- **Error States**:
  - Clear error messaging and recovery options
  - Offline mode capabilities for poor connectivity situations
  - Form field validation with helpful error messages

## Security Requirements

- Role-based access control using Supabase RLS policies
- Server-side validation for all form submissions
- Secure file handling
- CSRF protection
- API route protection
- Rate limiting for auth attempts

## Application Flow

### Subcontractor Flow
1. Subcontractor logs in
2. Views dashboard with previous submissions
3. Creates new job submission
4. System calculates total based on unit and price
5. Optionally attaches files
6. Submits the job
7. Receives notification when status changes
8. Downloads invoice when job is completed

### Admin Flow
1. Admin logs in
2. Views dashboard with all submissions
3. Reviews and edits submissions as needed
4. Updates job status
5. Generates invoices for completed jobs
6. Manages subcontractor accounts

## Development Specifications

### Project Structure (Next.js App Router)
```
/app
  /auth
    /login
    /signup
  /dashboard
    /subcontractor
      /jobs
      /invoices
      /notifications
    /admin
      /jobs
      /subcontractors
      /reports
  /(shared components)
    /components
      /forms
      /tables
      /modals
```

### API Routes
```
/api
  /jobs - CRUD operations for job entries
  /profiles - User profile management
  /invoices - Invoice generation and retrieval
  /notifications - Notification management
  /files - File upload handling (optional)
```

### Supabase Setup
- Authentication with email/password
- Storage buckets for file uploads
- Database tables as per schema
- Row-level security policies
- Realtime functionality for notifications

### Performance Considerations
- Implement pagination for job listings to handle large datasets efficiently
- Optimize PDF generation to handle concurrent requests
- Use server-side caching for frequently accessed data
- Implement lazy loading for images and large content
- Consider incremental static regeneration for dashboard pages
- Use proper indexing on database tables for query performance

## Future Considerations
- Email notifications
- Advanced reporting features
- Mobile app version
- Multi-language support
- Integration with accounting software
- Multi-admin support

## Specific Requirements

- Single job type structure (not multiple job types)
- No approval workflow needed
- Admin can edit all subcontractor submissions
- Subcontractors can only update their own submissions
- PDF invoice generation with download capability
- Single admin account during development
- File uploads as optional feature
- Notification system for job updates
- Status tracking for all jobs

## Development Phases

### Phase 1: Foundation (2-3 weeks)
- Project setup with Next.js and Supabase
- Authentication system implementation
- Database schema creation
- Basic UI components

### Phase 2: Core Features (3-4 weeks)
- Job submission system
- Admin and subcontractor dashboards
- Basic CRUD operations
- Status tracking implementation

### Phase 3: Advanced Features (2-3 weeks)
- PDF invoice generation
- Notification system
- File upload functionality
- UI/UX refinements

### Phase 4: Testing & Deployment (1-2 weeks)
- Comprehensive testing
- Bug fixes and performance optimization
- Production deployment
- Documentation

## Initial Setup Requirements
- Supabase project creation
- Next.js project initialization
- Environment variables configuration
  - Create `.env.local` file with placeholders for Supabase credentials:
    ```
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
    ```
  - Later, replace placeholders with actual Supabase tokens after project creation
- User roles and permissions setup
- Initial admin account creation

## Additional Technical Requirements

### Next.js Version & Configuration
- Install Next.js 15 specifically (not any other version)
- Configure app router properly with modern patterns
- Set up proper middleware for authentication flow

### Authentication & Session Management
- Implement secure cookie-based authentication with proper expiry times
- Ensure cookies are properly configured with HTTP-only and secure flags where appropriate
- Handle logout by properly clearing all cookies and session data
- Set up automatic redirects:
  - Authenticated users trying to access login/signup pages should redirect to dashboard
  - Unauthenticated users trying to access protected routes should redirect to login
  - Admin users should redirect to admin dashboard after login
  - Subcontractors should redirect to subcontractor dashboard after login

### Admin User Creation & Management
- Create initial admin user through Supabase SQL queries during setup
- Implement script or admin panel to add additional admin users if needed
- Admin credentials should be securely stored
- Add proper SQL schema with special flags for admin users

### SQL Schema Implementation
- Create proper SQL schema with all tables mentioned in the Database Schema section
- Implement SQL triggers for automatic calculations (total = unit * unit price)
- Set up proper foreign key constraints and cascade rules
- Implement Row Level Security (RLS) policies for proper data access control
- Create SQL functions for complex operations if needed

### Subcontractor Item Management
- Allow subcontractors to add, edit, and remove job items as desired
- Implement proper validation to prevent deletion of items with dependent records
- Add batch operations for managing multiple items simultaneously
- Implement item versioning to track changes over time

### UI Components
- Use proper popover calendar components for all date inputs
- Ensure all date pickers are accessible and mobile-friendly
- Implement date range selection where appropriate (start/end dates)
- Add modern UI touches like skeletons during loading states
- Ensure all forms have proper validation with clear error messages
- Add confirmation dialogs for destructive actions
- Display all monetary values in Malaysian Ringgit (RM) format

## Development Guidelines

### Terminal Commands
- Never use '&&' operator in terminal commands
- Use separate distinct commands instead of chaining with '&&'
- Document all terminal commands in a setup guide for future reference