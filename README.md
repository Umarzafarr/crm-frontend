# CRM System Frontend

This is a React frontend for a CRM (Customer Relationship Management) system built with React, TypeScript, and Material UI.

## Features

- **Authentication System**
  - User signup and login with JWT
  - Protected routes requiring authentication

- **Contact Management**
  - CRUD operations for contacts
  - Filtering contacts by categories (Hotlist, A-List, B-List, C-List, Standard)
  - Sorting and searching functionality
  - Responsive design for mobile and desktop

- **Daily Reminders System**
  - Creating, updating, completing, and deleting reminders
  - Today's reminders view
  - Reminder summary dashboard
  - Setting and tracking daily contact goals

## Technologies Used

- React 19
- TypeScript
- Material UI
- React Router 7
- Formik + Yup (Form validation)
- Axios (API requests)
- Chart.js (Data visualization)
- date-fns (Date formatting)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Backend API server running at http://localhost:3000

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/crm-frontend.git
   cd crm-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     REACT_APP_API_URL=http://localhost:3000/api/v1
     ```

4. Start the development server:
   ```
   npm start
   ```
   The app will run on http://localhost:3001

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── auth/          # Authentication related components
│   ├── contacts/      # Contact related components
│   ├── dashboard/     # Dashboard components
│   ├── layout/        # Layout components
│   └── reminders/     # Reminder related components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # API service layer
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Backend API Integration

This frontend connects to a NestJS backend API. The API endpoints include:

- **Authentication**
  - `POST /api/v1/auth/signup` - Register a new user
  - `POST /api/v1/auth/login` - Login and get JWT token

- **Contacts**
  - `GET /api/v1/contacts` - List all contacts with filtering options
  - `GET /api/v1/contacts/:id` - Get a specific contact
  - `POST /api/v1/contacts` - Create a new contact
  - `PATCH /api/v1/contacts/:id` - Update a contact
  - `DELETE /api/v1/contacts/:id` - Delete a contact
  - `GET /api/v1/contacts/category/:category` - Get contacts by category

- **Reminders**
  - `GET /api/v1/reminders` - List all reminders
  - `GET /api/v1/reminders/:id` - Get a specific reminder
  - `POST /api/v1/reminders` - Create a new reminder
  - `PATCH /api/v1/reminders/:id` - Update a reminder
  - `DELETE /api/v1/reminders/:id` - Delete a reminder
  - `GET /api/v1/reminders/daily` - Get today's reminders
  - `GET /api/v1/reminders/summary` - Get reminder summary
  - `GET /api/v1/reminders/goal-progress` - Get contact goal progress
  - `PATCH /api/v1/reminders/daily-goal` - Update daily contact goal
  - `PATCH /api/v1/reminders/:id/complete` - Mark a reminder as completed

## Building for Production

To build the application for production:

```
npm run build
```

This will create a `build` directory with production-ready files that can be served by any static file server.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 