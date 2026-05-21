# erp-frontend

# Evvo ERP - Enterprise Resource Planning System

A fully dynamic, scalable, and enterprise-grade ERP platform built with the MERN stack (MySQL, Express, React, Node.js).

## Architecture Overview

```
evvo-erp/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # App, DB, Swagger, Socket config
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, RBAC, Audit, Rate limiting
│   │   ├── models/            # Sequelize models (15 models)
│   │   ├── repositories/      # Data access layer
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # JWT, response helpers, dynamic query
│   ├── migrations/            # Database migrations
│   └── seeders/               # Default data
├── frontend/                  # React + TypeScript SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # AppLayout, Sidebar, Header
│   │   │   ├── ui/            # Button, Card, Modal, Table, Input
│   │   │   └── dynamic/       # DynamicTable, DynamicForm
│   │   ├── pages/             # Route pages
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   ├── store/             # Redux Toolkit state
│   │   └── types/             # TypeScript types
│   └── ...
├── docker-compose.yml         # Docker setup
├── install.sh                 # One-command installer
└── .github/workflows/         # CI/CD pipelines
```

## Quick Start

### Option 1: One-Command Install
```bash
chmod +x install.sh && ./install.sh
```

### Option 2: Manual Setup
```bash
# 1. Clone and navigate
cd evvo-erp

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# 3. Configure backend/.env with your MySQL credentials

# 4. Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# 5. Run database migrations and seed
cd ../backend && npm run migrate && npm run seed

# 6. Start development servers
cd ..
npm run dev
```

### Option 3: Docker
```bash
# Copy and configure environment
cp .env.example .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

## Default Credentials

| Role        | Email                      | Password        |
|-------------|----------------------------|-----------------|
| Super Admin | superadmin@evvoerp.com     | SuperAdmin@123  |
| Admin       | admin@evvoerp.com          | Admin@123       |
| Manager     | manager@evvoerp.com        | Manager@123     |

**Change these immediately after first login!**

## Access URLs

| Service       | URL                              |
|---------------|----------------------------------|
| Frontend      | http://localhost:3000            |
| Backend API   | http://localhost:5000/api/v1     |
| API Docs      | http://localhost:5000/api/docs   |

## Key Features

### Dynamic Module Engine
- Create modules without any code changes
- Auto-generates MySQL tables and CRUD APIs
- 30+ field types (text, number, select, date, file, relation, formula...)
- Drag-and-drop field ordering
- Dynamic form builder with validation

### Role-Based Access Control (RBAC)
- Flexible permission system
- Role hierarchy with levels
- Per-user permission overrides
- Multi-tenant isolation

### Real-Time Features
- WebSocket-based live notifications
- Real-time dashboard updates
- Activity tracking

### Built-in ERP Modules
- HRMS (Human Resource Management)
- CRM (Customer Relationship Management)
- Finance & Accounting
- Inventory Management
- Sales Management
- Purchase Management
- Project Management
- Customer Support

### Enterprise Features
- Multi-company support
- Multi-language (EN, AR, ES, FR)
- Workflow engine with approval system
- Audit trail for all actions
- Export to Excel/CSV
- Email/SMS notifications
- JWT with refresh token rotation
- Rate limiting

## API Documentation

Full Swagger/OpenAPI docs available at `http://localhost:5000/api/docs`

### Key Endpoints

```
POST   /api/v1/auth/login           Login
POST   /api/v1/auth/refresh         Refresh token
GET    /api/v1/auth/me              Get profile

GET    /api/v1/users                List users
POST   /api/v1/users                Create user
GET    /api/v1/users/:id            Get user
PUT    /api/v1/users/:id            Update user

GET    /api/v1/modules              List modules
POST   /api/v1/modules              Create module
POST   /api/v1/modules/:id/fields   Add field to module

GET    /api/v1/data/:module         Dynamic record list
POST   /api/v1/data/:module         Create record
PUT    /api/v1/data/:module/:id     Update record
DELETE /api/v1/data/:module/:id     Delete record
GET    /api/v1/data/:module/export  Export to Excel

GET    /api/v1/dashboard/stats      Dashboard stats
GET    /api/v1/dashboard/activity   Activity chart
```

## Environment Variables

See `.env.example` and `backend/.env.example` for all configuration options.

## Technology Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18 + TypeScript + Vite + Tailwind CSS  |
| State      | Redux Toolkit + React Query                  |
| UI         | Lucide Icons + Recharts + Framer Motion      |
| Forms      | React Hook Form + Zod                        |
| Backend    | Node.js 20 + Express.js                      |
| Database   | MySQL 8.0 + Sequelize ORM                    |
| Auth       | JWT (access + refresh token rotation)        |
| Real-time  | Socket.IO                                    |
| Docs       | Swagger/OpenAPI 3.0                          |
| DevOps     | Docker + GitHub Actions CI/CD                |
| Code Style | ESLint + Prettier + Husky                    |

## Development

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Database operations
cd backend
npm run migrate          # Run pending migrations
npm run migrate:undo     # Rollback all migrations
npm run seed             # Seed default data
npm run seed:undo        # Remove seeded data
```

## Creating a Custom Module

Via Admin Panel:
1. Go to **Admin > Modules**
2. Click **Create Module**
3. Enter name, slug, category, color
4. Add fields via the Field Builder
5. Access data at `/modules/{your-slug}`
6. API auto-available at `/api/v1/data/{your-slug}`

## Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Docker production
docker-compose -f docker-compose.yml up -d --build

# Environment: set NODE_ENV=production in .env
```

## License

MIT — Free to use, modify, and distribute.
