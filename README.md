
# Document Ingestion & Management System

A microservices-based architecture for document management and ingestion with JWT authentication and role-based access control.

## System Architecture

This project consists of the following microservices:

1. **API Gateway** - Main entry point for the API that handles authentication, document management, and communication with other services
2. **Document Ingestion Service** - Specialized service for processing document ingestion
3. **Redis** - In-memory cache for improving performance and storing session data

## Features

- JWT-based authentication with role-based access control
- Document management (upload, download, update, delete)
- Document ingestion process with status tracking
- Proper error handling and retry mechanisms
- Swagger documentation
- Database seeding for testing with large volumes of data

## Project Structure

```
jktech_poc/
├── apps/
│   ├── api_gateway/               # Main API service
│   │   ├── src/
│   │   │   ├── document/          # Document management endpoints and logic
│   │   │   ├── global/            # Global modules, guards, and decorators
│   │   │   ├── ingestion/         # Ingestion endpoints and service communication
│   │   │   ├── services/          # Shared services
│   │   │   ├── user/              # Authentication and user management
│   │   │   └── app.module.ts      # Main module configuration
│   │   └── package.json
│   ├── doc_ingestion/             # Document ingestion service
│   │   ├── src/
│   │   │   ├── entities/          # Database entities
│   │   │   ├── dto/               # Data transfer objects
│   │   │   ├── db/                # Database configuration and migrations
│   │   │   └── ingestion.service.ts # Ingestion processing logic
│   │   └── package.json
│   └── redis/                    # Redis service for caching
├── docker-compose.yml            # Docker configuration for all services
└── .env                          # Environment configuration
```

## Prerequisites

- Node.js (v22.14.0 - see .nvmrc file)
- Docker and Docker Compose
- PostgreSQL
- Redis

## How to Run the Application

### 1. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update the environment variables if needed.

### 2. Starting the Application

The simplest way to run the application is using Docker Compose:

```bash
docker-compose up --build
```

This command builds and starts all required services:
- API Gateway on port 3000
- Document Ingestion Service
- PostgreSQL database
- Redis cache

### 3. Accessing the Application

Once the services are running, you can authenticate as an admin using:

```bash
curl --location 'http://localhost:3000/user/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "admin@admin.com",
    "password": "admin"
}'
```

This will return a JWT token that you can use for authenticated requests.

### 4. API Documentation

Swagger documentation is available at:
```
http://localhost:3000/api
```

## User Roles and Permissions

The system has three types of users:

### 1. Admin

This user can perform any operations in the application such as:
- Registering new users
- CRUD operations on documents
- Create and get details of ingestions

### 2. Editor

This type of user can perform operations on documents:
- CRUD operations on documents
- Create and view details of ingestions

### 3. Viewer

This type of user has read-only access:
- View details of ingestions
- Read documents

## API Endpoints

### Authentication
- `POST /user/login` - Login and get JWT token
- `POST /user/logout` - Logout and invalidate token
- `POST /user/register` - Register a new user (Admin only)

### Document Management
- `GET /document` - List all documents
- `POST /document` - Upload a new document
- `GET /document/:id` - Download a document
- `PUT /document/:id` - Update a document
- `DELETE /document/:id` - Delete a document

### Ingestion Management
- `POST /ingestion` - Start document ingestion
- `GET /ingestion/:id` - Get ingestion status
- `POST /ingestion/:id/retry` - Retry failed ingestion
- `GET /ingestion` - List all ingestions with pagination

## Development Guide

### Running Services Individually

If you prefer to run services individually during development:

1. Start the database and Redis:
   ```bash
   docker-compose up postgres redis
   ```

2. Run the API Gateway:
   ```bash
   cd apps/api_gateway
   npm install
   npm run start:dev
   ```

3. Run the Document Ingestion Service:
   ```bash
   cd apps/doc_ingestion
   npm install
   npm run start:dev
   ```

### Database Migrations

To run database migrations:
```bash
cd apps/api_gateway
npm run migrations:up

cd ../doc_ingestion
npm run migrations:up
```

## Technical Implementation Details

### User Authentication

The authentication is implemented inside the API Gateway using Passport's JWT strategy. An Auth guard is placed on all controller APIs that require authentication.

Key files:
- `apps/api_gateway/src/global/guards/jwt-auth.guard.ts`
- `apps/api_gateway/src/user/services/auth/strategies/jwt/jwt.strategy.ts`

### User Authorization

CASL is used for building role-based authorization rules. Key files:
- `apps/api_gateway/src/global/modules/casl/cals-ability.factory.ts`
- `apps/api_gateway/src/global/decorators/check-permission.decorator.ts`
- `apps/api_gateway/src/global/guards/permission.guard.ts`

You can learn more about CASL at https://casl.js.org/v6/en/

### Document Ingestion Service

The Document Ingestion service is a separate NestJS microservice that processes document ingestions. It communicates with the API Gateway using the message pattern system.

Once a new ingestion is added, an event is fired that is asynchronously handled to update its status to success or failed, simulating actual document processing.

## Troubleshooting

- If you encounter connection issues to PostgreSQL or Redis, check if the services are running and that your `.env` file has the correct connection details.
- For permission errors, verify that you're using a token with the appropriate role permissions.
- If document uploads fail, check that the uploads directory exists and has the correct permissions.