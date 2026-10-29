# ECOSPHERE Backend API Foundation

TypeScript Node.js & Express REST API backend for the **ECOSPHERE** platform, connecting to the SQL Server database.

---

## 📋 Features

- **Node.js + Express + TypeScript** modular architecture.
- **SQL Server Integration**: Connection pool using `mssql` with parameterized query security.
- **Security Suite**: `helmet`, `cors`, JSON body parsing with payload size limits, sanitized logging.
- **Health Checks**:
  - `GET /api/health`: Service status endpoint.
  - `GET /api/health/database`: Live SQL Server connectivity verification.
- **Authentication Prep**:
  - `POST /api/auth/request-otp`
  - `POST /api/auth/verify-otp` (Development OTP: `123456`)
- **JWT & Role Support**: Token generation and authorization middleware supporting `customer`, `seller`, and `administrator` roles.
- **Centralized Error Handling**: Standardized success and error JSON envelopes.

---

## 🛠️ Prerequisites

1. **Node.js**: v18.0.0 or higher
2. **SQL Server**: Running instance containing the `ECOSPHERE` database.

---

## ⚙️ Environment Configuration

Create a `.env` file in `ecosphere_backend/` based on `.env.example`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SQL Server Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=ECOSPHERE
DB_USER=sa
DB_PASSWORD=YourStrongPasswordHere!
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Security / Authentication Configuration
JWT_SECRET=super_secret_ecosphere_jwt_key_change_me_in_prod
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=*
```

> [!WARNING]
> Never commit `.env` to source control.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Typecheck Code
```bash
npm run typecheck
```

### 3. Run in Development Mode
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📡 API Endpoints

### 1. Service Health
* **GET** `/api/health`
* **Response**:
```json
{
  "success": true,
  "service": "ECOSPHERE API"
}
```

### 2. Database Connectivity Health
* **GET** `/api/health/database`
* **Response (Success)**:
```json
{
  "success": true,
  "database": "ECOSPHERE",
  "connected": true
}
```
* **Response (Failure - 503 Service Unavailable)**:
```json
{
  "success": false,
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Unable to connect to SQL Server database"
  }
}
```

### 3. Auth - Request OTP
* **POST** `/api/auth/request-otp`
* **Request**:
```json
{
  "mobile": "9876543210"
}
```
* **Response (Development Mode)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "developmentOtp": "123456"
}
```

### 4. Auth - Verify OTP
* **POST** `/api/auth/verify-otp`
* **Request**:
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```
* **Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_9876543210",
    "name": "Aarav Sharma",
    "email": "user_9876543210@ecosphere.io",
    "phone": "9876543210",
    "role": "customer",
    "status": "active",
    "verified": true,
    "walletBalance": 5000
  }
}
```

---

## 📱 React Native Frontend Configuration

To configure the React Native Expo app (`ecosphere_app`) to talk to this backend, set `EXPO_PUBLIC_API_URL` in `ecosphere_app/.env`:

* **iOS Simulator**: `http://localhost:5000/api`
* **Android Emulator**: `http://10.0.2.2:5000/api`
* **Physical Mobile Device**: `http://<YOUR_LOCAL_IP>:5000/api` (e.g. `http://192.168.1.100:5000/api`)

> [!NOTE]
> Physical mobile devices cannot connect to `localhost` because `localhost` refers to the phone itself. Use your workstation's local network IP address (e.g., `192.168.x.x`).
