# Simplified Token System

## Overview
The application now uses a simplified token-based authentication system with header-based tokens and no refresh token mechanism.

## Key Features
- **Single Token**: Only access tokens, no refresh tokens
- **Header-Based**: Tokens sent via `Authorization: Bearer <token>` header
- **1-Week Expiry**: Tokens expire after 7 days
- **No Cookies**: No cookie-based authentication
- **Simple Middleware**: AuthGuard validates tokens from headers

## Authentication Flow

### 1. Sign Up
```http
POST /auth/sign-up
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### 2. Sign In
```http
POST /auth/sign-in
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "access_token": "jwt_token_here",
  "token_type": "Bearer",
  "expires_in": 604800
}
```

### 3. Access Protected Routes
```http
GET /auth/me
Authorization: Bearer <access_token>
```

### 4. Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

## Token Structure
The JWT token contains:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Public Routes
Routes marked with `@Public()` decorator don't require authentication:
- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `GET /forms` (with pagination)
- `GET /forms/paginated`

## Protected Routes
All other routes require a valid token in the Authorization header:
- `GET /auth/me`
- `POST /auth/change-password`
- `POST /auth/logout`
- All other API endpoints

## Error Responses

### No Token
```json
{
  "statusCode": 401,
  "message": "No token found in Authorization header"
}
```

### Invalid Token
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

## Implementation Details

### AuthGuard
- Checks for `@Public()` decorator
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token using JWT service
- Stores user data in request object

### Token Generation
- Uses `JWT_SECRET` environment variable
- 7-day expiry (`7d`)
- Includes user ID, email, and role

### Security Notes
- Tokens are stateless
- No server-side token storage
- Tokens must be included in every protected request
- Client must handle token expiry (7 days)

## Environment Variables Required
```env
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
```
