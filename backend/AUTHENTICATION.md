# SwimFlow Authentication System

## Overview

The SwimFlow authentication system has been successfully implemented with JWT-based authentication and comprehensive user management capabilities.

## Implemented Features

### 1. JWT Authentication Middleware (`src/middleware/auth.ts`)
- **AuthService**: Utility class for JWT token generation and verification
- **authenticateToken**: Middleware to verify access tokens
- **requireRole**: Role-based access control middleware
- **requireAdmin**: Admin-only access middleware
- **requireProfessorOrAdmin**: Professor or admin access middleware

### 2. Authentication Routes (`src/routes/auth.ts`)
- **POST /api/auth/login**: User login with email/password
- **POST /api/auth/refresh**: Refresh access token using refresh token
- **POST /api/auth/logout**: User logout (client-side token invalidation)
- **GET /api/auth/me**: Get current authenticated user information

### 3. User Management Service (`src/services/userService.ts`)
- **createUser**: Create new users (professors/admins) with validation
- **updateUser**: Update user information with permission checks
- **getUser**: Retrieve user by ID (excluding password hash)
- **listUsers**: List users with filtering and search capabilities
- **deleteUser**: Delete users with referential integrity checks
- **getUserStats**: Get user statistics (classes, evaluations, students)
- **hashPassword**: Secure password hashing with bcrypt (12 salt rounds)

### 4. User Management Routes (`src/routes/users.ts`)
- **POST /api/users**: Create user (admin only)
- **GET /api/users**: List all users with filters (admin only)
- **GET /api/users/:id**: Get user by ID (admin or own profile)
- **PUT /api/users/:id**: Update user (admin or own profile)
- **DELETE /api/users/:id**: Delete user (admin only)
- **GET /api/users/:id/stats**: Get user statistics (admin or own profile)

## Security Features

### Password Security
- Minimum 8 characters with uppercase, lowercase, and number requirements
- bcrypt hashing with 12 salt rounds
- Password validation using Joi schemas

### JWT Security
- Separate access and refresh tokens
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Token type validation (access vs refresh)
- User existence verification on each request

### Authorization
- Role-based access control (admin, professor)
- Permission checks for sensitive operations
- Users can only modify their own profiles (unless admin)
- Admins cannot delete themselves

### Input Validation
- Comprehensive Joi validation schemas
- Email format validation
- Password strength requirements
- SQL injection prevention through Prisma ORM

## Environment Variables

Required environment variables (see `.env.example`):
```
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
DATABASE_URL="postgresql://..."
```

## API Usage Examples

### Login
```bash
POST /api/auth/login
{
  "email": "admin@swimflow.com",
  "password": "admin123"
}
```

### Create User (Admin only)
```bash
POST /api/users
Authorization: Bearer <access_token>
{
  "email": "professor@swimflow.com",
  "password": "SecurePass123",
  "name": "Professor Name",
  "role": "professor"
}
```

### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <access_token>
```

## Database Integration

The system integrates with the existing Prisma schema:
- Uses the `User` model with proper relationships
- Maintains referential integrity with classes and evaluations
- Supports soft constraints for data consistency

## Error Handling

Comprehensive error handling with standardized error codes:
- `VALIDATION_ERROR`: Input validation failures
- `UNAUTHORIZED`: Authentication failures
- `FORBIDDEN`: Authorization failures
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Unique constraint violations
- `INTERNAL_ERROR`: Server errors

## Testing

The system is built with testability in mind:
- Modular service architecture
- Dependency injection ready
- Comprehensive validation
- Error boundary handling

## Next Steps

The authentication system is ready for integration with:
1. Frontend authentication flows
2. Student management modules
3. Class and training management
4. Evaluation system
5. File upload functionality

All endpoints are documented and follow RESTful conventions with proper HTTP status codes and error messages.