# AN Awesome Subcontractor Work Management System

A comprehensive system for managing subcontractor jobs, invoices, and payments. Built with Next.js and Supabase.

## Features

- **User Authentication**: Secure login and registration system with role-based access.
- **Role-based Access Control**: Different interfaces for administrators and subcontractors.
- **Job Management**: Create, view, update, and track jobs.
- **Invoice Generation**: Automatically generate invoices for completed jobs.
- **Notification System**: Real-time notifications for status updates.
- **Responsive UI**: Mobile-friendly design using TailwindCSS and shadcn/ui.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel or any hosting provider that supports Next.js

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Supabase account

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Database Setup

1. Create a new Supabase project
2. Run the SQL scripts from `sql-setup.md` in the SQL editor

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

### Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## System Structure

- `/src/app`: Next.js App Router
  - `/auth`: Authentication pages (login, signup)
  - `/dashboard/admin`: Admin dashboard views
  - `/dashboard/subcontractor`: Subcontractor dashboard views
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks
- `/src/lib`: Utility functions and configurations
- `/src/types`: TypeScript interfaces and types

## Admin Features

- View all subcontractors
- Manage jobs (approve, update status)
- Generate invoices
- View reports and analytics

## Subcontractor Features

- Submit new job entries
- Track job status
- View and download invoices
- Update profile information

## License

This project is licensed under the MIT License
