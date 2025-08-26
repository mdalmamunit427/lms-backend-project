# LMS Backend

A Learning Management System backend built with Node.js, Express, TypeScript, and MongoDB.

## Features

- User registration with email activation
- JWT-based authentication with access and refresh tokens
- Email notifications using Nodemailer
- Redis for caching
- MongoDB for data persistence
- Protected routes with role-based authorization
- HTTP-only cookie security for refresh tokens

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URL=mongodb://localhost:27017/lms-backend

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com
```

### 3. Email Setup (Gmail Example)

To use Gmail for sending emails:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the generated password as `SMTP_PASS`

### 4. Run the Application

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication Endpoints

#### User Registration
- **POST** `/api/v1/user/register`
- Body: `{ "name": "string", "email": "string", "password": "string" }`
- Response: Returns activation token and sends activation email

#### User Activation
- **POST** `/api/v1/user/activate-user`
- Body: `{ "token": "string", "activationCode": "string" }`
- Response: Activates user account and creates user in database

#### User Login
- **POST** `/api/v1/user/login`
- Body: `{ "email": "string", "password": "string" }`
- Response: Returns access token and sets refresh token as HTTP-only cookie

#### Refresh Token
- **POST** `/api/v1/user/refresh-token`
- No body required (refresh token read from cookies)
- Response: Returns new access token

#### Logout
- **POST** `/api/v1/user/logout`
- No body required
- Response: Clears refresh token and invalidates session

#### Get Profile (Protected)
- **GET** `/api/v1/user/profile`
- Headers: `Authorization: Bearer <access_token>`
- Response: Returns current user's profile information

## Authentication Flow

1. **Register**: User registers with email and password
2. **Activate**: User activates account using email verification
3. **Login**: User logs in and receives access token + refresh token
4. **Use API**: Include access token in Authorization header for protected routes
5. **Refresh**: When access token expires, use refresh token to get new access token
6. **Logout**: Clear refresh token and invalidate session

## Token Details

- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), stored as HTTP-only cookie, used to get new access tokens

## Security Features

- HTTP-only cookies for refresh tokens
- Secure cookie settings in production
- Password hashing with bcrypt
- JWT token verification
- Role-based authorization
- Account activation via email

## Testing

Run the authentication test script:

```bash
node test-auth.js
```

This will test the complete authentication flow including registration, activation, login, protected routes, token refresh, and logout.

## Troubleshooting Email Issues

If emails are not being sent:

1. **Check Environment Variables**: Ensure all SMTP variables are set correctly
2. **Gmail App Password**: Make sure you're using an App Password, not your regular password
3. **Network Issues**: Check if your server can reach the SMTP server
4. **Logs**: Check console logs for detailed error messages

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Express middlewares (including auth)
├── models/          # MongoDB models
├── routes/          # API routes
├── templates/       # Email templates
├── utils/           # Utility functions (including JWT)
├── app.ts          # Express app setup
└── server.ts       # Server entry point
```

## Documentation

For detailed API documentation, see [AUTHENTICATION_API.md](./AUTHENTICATION_API.md)
