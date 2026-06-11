# Service Now Taxonomy App

A full-stack web application for managing ServiceNow incident taxonomy and classification.

## Features

- **Taxonomy Classification**: Classify incidents using applications, modules, incidents, and actions
- **CRUD Management**: Add, edit, and remove taxonomy items
- **Duplicate Prevention**: Existing values are displayed to prevent duplicates
- **Real Database**: MongoDB with Mongoose ODM
- **REST API**: Express.js API with validation
- **Modern UI**: React with Tailwind CSS
- **Type Safety**: Full TypeScript support

## Project Structure

```
├── client/               # React frontend
├── server/               # Node.js backend
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or remote URI

### Backend Setup

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

The server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173`

## API Endpoints

- `GET/POST /api/applications`
- `GET/POST /api/modules`
- `GET/POST /api/incidents`
- `GET/POST /api/actions`
- `GET/POST /api/tags`

## Best Practices Implemented

- ✅ TypeScript for type safety
- ✅ Environment variables for configuration
- ✅ Input validation
- ✅ Error handling middleware
- ✅ CORS enabled
- ✅ Unique indexes for duplicate prevention
- ✅ RESTful API design
- ✅ Component-based UI
- ✅ Responsive design
