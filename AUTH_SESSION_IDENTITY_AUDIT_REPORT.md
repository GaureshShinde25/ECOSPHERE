# ECOSPHERE — Critical Authentication & Session Identity Audit & Fix Report

**Status:** AUTHENTICATION IDENTITY — FIXED  
**Audit Date:** September 23, 2026  
**Auditor / Engineer:** Antigravity AI  

---

## 1. Root Cause

The observed identity mismatch, profile leakage, and persistent display of "Aarav Sharma" (or another user's profile) were caused by a multi-layer cascade of design defects across both backend and frontend:

1. **Non-Canonical In-Memory JWT Identity**:
   When an unseeded or newly registered user verified OTP (`POST /api/auth/verify-otp`), if an exact database row was not immediately matched, `authService.verifyOtp` generated a synthetic, in-memory user object with `id: "usr_" + mobile` and hardcoded name `"Aarav Sharma"`. The resulting JWT payload carried `userId: "usr_..."` instead of a persistent database integer `UserId`.

2. **Dangerous Wildcard Matching in `profileService.getProfile`**:
   The backend query in `profileService.ts` was:
   ```sql
   SELECT TOP 1 ... FROM Users u ... WHERE u.UserId = @userId OR u.Mobile LIKE @mobilePattern
   ```
   Where `@mobilePattern` was evaluated as `'%searchMobile%'`. When `userId` was a single or few digits (e.g. `"1"`, `"2"`, or `"5"`), `@mobilePattern` evaluated to `'%1%'`, `'%2%'`, or `'%5%'`. Because almost every phone number in the database contained that digit, `SELECT TOP 1` without ordering non-deterministically returned an unrelated user's record (e.g. User B was returned User A's data).

3. **Untracked Auto-Provisioning Desynchronization**:
   If a user record was not found, `profileService.ts` lazily inserted a new row into `Users` with name `"Aarav Sharma"` and generated a new database `UserId` (e.g. `1203`). However, the client's already-issued JWT still held `userId: "usr_..."`. On subsequent API requests, the JWT `userId` never matched `1203`, perpetuating lookups that returned null or the wrong user.

4. **Hardcoded Fallbacks in `authController.getMe` and `authService.getCurrentUser`**:
   `authController.getMe` explicitly hardcoded a fallback user `"Aarav Sharma"` whenever `authService.getCurrentUser` failed to find a record. In turn, `authService.getCurrentUser` attempted `WHERE u.UserId = @userId OR u.Mobile = @userIdStr`, which failed when passed an alphanumeric `"usr_..."` token ID, triggering the fallback.

5. **Frontend Poisoning via `mockCurrentUser`**:
   In `ecosphere_app/src/services/authService.ts`, `getCurrentUser()` returned `user || mockCurrentUser` ("Aarav Sharma", phone `+91 98765 43210`, id `usr_101`). When `setUserRole()` was called, it saved `mockCurrentUser` into `tokenService.saveUserSession`, permanently corrupting local storage. `HomeScreen` and `ExploreScreen` then read this poisoned session.

6. **Absence of Session Restoration on App Startup**:
   `App.tsx` lacked startup token restoration. `SplashScreen` unconditionally navigated to `'Welcome'`, ignoring stored JWT credentials. When users logged in again, stale local state and uncontrolled navigation routes forced re-entry through onboarding screens, overwriting profiles.

7. **Discarded Registration Attributes**:
   `RegisterScreen.tsx` captured `fullName` and `email`, but its submission handler only passed `mobile` to `authService.requestOtp` and `onRegister`. Name and email were never communicated to the server or persisted.

8. **Missing UI Logout**:
   There was no Logout button in the application UI, preventing users from safely destroying active tokens when testing multi-user scenarios.

---

## 2. Exact Broken Flow

```
User registers on frontend with mobile "8585858585" and name "Gauresh Shinde"
       ↓
RegisterScreen only sends mobile to /auth/request-otp (fullName & email discarded)
       ↓
User enters OTP 123456
       ↓
Backend verify-otp searches Users table; user doesn't exist yet
       ↓
Backend creates in-memory fallback user ("Aarav Sharma", id "usr_8585858585")
       ↓
JWT signed with userId: "usr_8585858585"
       ↓
Frontend stores JWT and navigates through onboarding
       ↓
BasicProfileScreen calls PUT /api/profile
       ↓
Backend profileService resolves userId "usr_8585858585"
       ↓
Query matches no user, inserts a new user into DB (UserId = 1202)
       ↓
Client JWT still contains userId: "usr_8585858585", NOT 1202!
       ↓
App restarted or opened later
       ↓
No session restore in App.tsx -> Welcome screen shown
       ↓
User logs in -> verify-otp queries Users with LIKE '%8585858585%'
       ↓
If another user logged in (e.g. UserId 2), profileService queries WHERE UserId = 2 OR Mobile LIKE '%2%'
       ↓
LIKE '%2%' matches random user phone containing digit 2!
       ↓
User B sees User A's profile / displayed username differs from login account!
```

---

## 3. Files Inspected

### Frontend (`ecosphere_app`)
- `App.tsx`
- `src/screens/SplashScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/RegisterScreen.tsx`
- `src/screens/OtpScreen.tsx`
- `src/screens/RoleSelectionScreen.tsx`
- `src/screens/onboarding/BasicProfileScreen.tsx`
- `src/screens/onboarding/LocationSetupScreen.tsx`
- `src/screens/onboarding/PersonalizationScreen.tsx`
- `src/screens/onboarding/SkillsSetupScreen.tsx`
- `src/screens/onboarding/CompletionScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/ExploreScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/services/authService.ts`
- `src/services/tokenService.ts`
- `src/services/apiClient.ts`
- `src/services/apiConfig.ts`
- `src/services/profileService.ts`
- `src/services/serviceService.ts`
- `src/data/mockData.ts`

### Backend (`ecosphere_backend`)
- `src/controllers/authController.ts`
- `src/controllers/profileController.ts`
- `src/routes/auth.routes.ts`
- `src/routes/profile.routes.ts`
- `src/services/authService.ts`
- `src/services/profileService.ts`
- `src/services/databaseService.ts`
- `src/middleware/authMiddleware.ts`
- `src/utils/jwt.ts`
- `src/utils/response.ts`
- `src/services/bookingService.ts`
- `src/services/orderService.ts`
- `src/services/favoriteService.ts`
- `src/services/messageService.ts`
- `src/services/notificationService.ts`
- `src/services/jobService.ts`
- `src/services/communityService.ts`
- `src/services/sellerDashboardService.ts`
- `src/services/serviceService.ts`

---

## 4. Files Changed

1. `D:\ECOSPHERE\ecosphere_backend\src\services\authService.ts`
2. `D:\ECOSPHERE\ecosphere_backend\src\controllers\authController.ts`
3. `D:\ECOSPHERE\ecosphere_backend\src\routes\auth.routes.ts`
4. `D:\ECOSPHERE\ecosphere_backend\src\services\profileService.ts`
5. `D:\ECOSPHERE\ecosphere_backend\src\services\serviceService.ts`
6. `D:\ECOSPHERE\ecosphere_backend\src\services\sellerDashboardService.ts`
7. `D:\ECOSPHERE\ecosphere_backend\src\services\messageService.ts`
8. `D:\ECOSPHERE\ecosphere_backend\src\services\favoriteService.ts`
9. `D:\ECOSPHERE\ecosphere_backend\src\services\communityService.ts`
10. `D:\ECOSPHERE\ecosphere_app\src\services\authService.ts`
11. `D:\ECOSPHERE\ecosphere_app\src\screens\RegisterScreen.tsx`
12. `D:\ECOSPHERE\ecosphere_app\src\screens\LoginScreen.tsx`
13. `D:\ECOSPHERE\ecosphere_app\src\screens\OtpScreen.tsx`
14. `D:\ECOSPHERE\ecosphere_app\src\screens\ProfileScreen.tsx`
15. `D:\ECOSPHERE\ecosphere_app\src\services\serviceService.ts`
16. `D:\ECOSPHERE\ecosphere_app\App.tsx`

---

## 5. Frontend Changes

1. **`authService.ts`**:
   - Completely removed `mockCurrentUser` import and fallbacks.
   - `getCurrentUser()` returns `null` if no active session exists (preventing resurrection of mock data).
   - Removed hardcoded `'9876543210'` fallbacks in `requestOtp` and `verifyOtp`.
   - `verifyOtp` now passes `{ name, email }` payload to the backend for new registrations.
   - `setUserRole()` strictly guards against modifying nonexistent sessions.

2. **`App.tsx`**:
   - Added startup session restoration (`handleSplashFinish`): on splash screen completion, reads stored token via `tokenService.getToken()`. If token exists, calls `authService.getMe()`. If valid, restores `authUser`, sets `currentRole`, and navigates directly to the role dashboard (`Home`, `SellerDashboard`, `AdminOverview`). If invalid or expired, clears session and navigates to `'Welcome'`.
   - Fixed login vs. registration routing: existing users logging in via `LoginScreen` are routed directly to their dashboard instead of being forced into onboarding. New users from `RegisterScreen` proceed through role setup.
   - Implemented `handleLogout` to clear credentials, reset user state, and return to `'Welcome'`.
   - Removed default `pendingMobile: '9876543210'`.

3. **`RegisterScreen.tsx` & `OtpScreen.tsx`**:
   - `RegisterScreen` now forwards `{ name: fullName.trim(), email: email.trim() }` to `onRegister`.
   - `OtpScreen` passes registration payload to `authService.verifyOtp`.
   - Removed hardcoded mobile fallback.

4. **`ProfileScreen.tsx`**:
   - Added `onLogout` prop and interactive Log Out action with confirmation dialog.
   - Removed any hardcoded fallbacks; profile displays live server data.

5. **`serviceService.ts`**:
   - Removed hardcoded `'Aarav Sharma'` in booking fallback; uses active session name.

---

## 6. Backend Changes

1. **`authService.ts`**:
   - In `verifyOtp`:
     - Cleaned mobile to exact 10 digits.
     - Look up existing user via exact match: `WHERE u.Mobile = @mobile` (NO `LIKE` wildcard).
     - If user exists: sign JWT with canonical `userId: String(row.UserId)`, role, and mobile.
     - If user does not exist (registration): auto-provisions `Users`, `UserRoles`, and `UserProfiles` records atomically, extracts inserted `UserId`, and signs JWT with `userId: String(newUserId)`. Every user issued a token has a genuine database record.
   - In `getCurrentUser(userId)`:
     - Parses `numericUserId = parseInt(userId, 10)`.
     - Queries strictly by database `UserId`: `WHERE u.UserId = @userId`.
     - Returns `null` if not found (no fake fallback).

2. **`authController.ts`**:
   - `verifyOtp`: accepts optional `name` and `email` for user registration.
   - `getMe`: returns 404 `USER_NOT_FOUND` if user record cannot be resolved. Completely removed hardcoded "Aarav Sharma" fallback.

3. **`profileService.ts`**:
   - `getProfile(userId)`: parses `numericUserId = parseInt(userId, 10)`.
   - Queries strictly by `WHERE u.UserId = @userId`.
   - Removed `Mobile LIKE @mobilePattern` and eliminated lazy insertion of "Aarav Sharma".

4. **`sellerDashboardService.ts`, `serviceService.ts`, `messageService.ts`, `favoriteService.ts`, `communityService.ts`**:
   - Eliminated `LIKE @mobPattern` in all `resolveDbUserId` implementations.
   - Replaced with exact integer matching and exact 10-digit mobile equality.

---

## 7. JWT Changes

- **Payload Structure**:
  ```json
  {
    "userId": "2",
    "role": "customer",
    "mobile": "9982575892",
    "iat": 1727100000,
    "exp": 1727704800
  }
  ```
- **Canonical Identity**: The `userId` claim is now strictly the stringified SQL Server database integer `UserId` (e.g. `"2"`, `"5"`, `"1202"`).
- **Eliminated**: Synthetic `usr_<mobile>` string IDs are completely eradicated.

---

## 8. Session Restoration Changes

- **Startup Sequence**:
  1. `App.tsx` mounts with `currentScreen: 'Splash'`.
  2. `handleSplashFinish` fires:
     - `token = await tokenService.getToken()`.
     - If token present: calls `GET /api/auth/me`.
     - Backend verifies JWT signature, extracts canonical `userId`, queries `Users WHERE UserId = @userId`.
     - If valid: sets `authUser`, sets `currentRole`, navigates directly to `Home` (customer), `SellerDashboard` (seller), or `AdminOverview` (admin).
     - If invalid/expired: calls `tokenService.clearSession()`, navigates to `Welcome`.
  3. Stale local storage is automatically flushed on auth errors.

---

## 9. Profile Fetch Changes

- `GET /api/profile` extracts `req.user.userId` from the verified JWT.
- Backend queries SQL Server:
  ```sql
  SELECT TOP 1 u.UserId, u.FirstName, u.LastName, u.Email, u.Mobile, ...
  FROM Users u WITH (NOLOCK)
  LEFT JOIN UserProfiles p WITH (NOLOCK) ON u.UserId = p.UserId
  LEFT JOIN UserRoles ur WITH (NOLOCK) ON u.UserId = ur.UserId AND ur.IsPrimaryRole = 1
  LEFT JOIN Roles r WITH (NOLOCK) ON ur.RoleId = r.RoleId
  WHERE u.UserId = @userId
  ```
- Exact match on primary key. Zero ambiguity, zero wildcard collisions.

---

## 10. Cache Changes

- Removed in-memory fallbacks that cached stale user profiles.
- Client state in `tokenService` is strictly overwritten upon OTP verification or `getMe()`.
- Logout clears all storage keys (`ecosphere_jwt_token` and `ecosphere_user_session`) across both web `localStorage` and native `SecureStore`.

---

## 11. Role Isolation Changes

- Role claim in JWT is derived strictly from `UserRoles` in SQL Server (`IsPrimaryRole = 1`).
- User A (Customer, UserId 2) receives `role: 'customer'`.
- User B (Seller, UserId 5) receives `role: 'seller'`.
- Switching accounts updates `currentRole` from the validated JWT and loads the appropriate role dashboard.

---

## 12. Test Methodology

An automated test suite was constructed at `scratch/test_identity_isolation.js` to execute the full authentication and identity lifecycle against the live backend API and database:
1. User A full login flow, OTP verification, JWT claim verification, `/auth/me`, `/profile`.
2. User B full login flow, OTP verification, JWT claim verification, `/auth/me`, `/profile`.
3. Identity isolation assertion: User A attributes != User B attributes.
4. Session restoration: User A token re-validated; User B token re-validated.
5. Token security: unauthenticated requests (401) and invalid tokens (401).
6. New registration lifecycle: registration with custom name & email, auto-provisioning verification, profile update, and safe cleanup.
7. Database count invariance: pre- and post-test count verification across all 8 tables.

---

## 13. User A / User B Results

| Metric | User A | User B | Isolation Verified |
| :--- | :--- | :--- | :--- |
| **Mobile Number** | `9982575892` | `8716885756` | Distinct |
| **Database UserId** | `2` | `5` | `2 !== 5` |
| **Full Name** | `Ayaan Malhotra` | `Gauresh Mehta` | Clean separation |
| **Role Claim** | `customer` | `seller` | `customer !== seller` |
| **JWT `userId`** | `"2"` | `"5"` | Canonical match |
| **`/api/auth/me` Name** | `Ayaan Malhotra` | `Gauresh Mehta` | 100% Match |
| **`/api/profile` Name** | `Ayaan Malhotra` | `Gauresh Mehta` | 100% Match |

---

## 14. App Restart Results

- Requesting `/api/auth/me` and `/api/profile` with User A's stored token reliably restores User A (`Ayaan Malhotra`, UserId 2).
- Requesting `/api/auth/me` and `/api/profile` with User B's stored token reliably restores User B (`Gauresh Mehta`, UserId 5).
- No fallback to "Aarav Sharma" occurred in either session restoration test.

---

## 15. Logout / Login Switching Results

- `handleLogout` successfully deletes stored JWT and session cache.
- Logging in as User B immediately after User A produces User B credentials; User A data is completely unreachable.
- Invalidating the token causes immediate 401 rejection and redirects to Welcome.

---

## 16. Database Verification

Table counts were compared before and after the complete audit test suite:

| Table | Pre-Audit Baseline | Post-Audit Final | Schema Changes | Data Loss |
| :--- | :---: | :---: | :---: | :---: |
| **Users** | 1,202 | 1,202 | 0 | 0 |
| **UserProfiles** | 1,202 | 1,202 | 0 | 0 |
| **Skills** | 24 | 24 | 0 | 0 |
| **Jobs** | 601 | 601 | 0 | 0 |
| **Services** | 1,200 | 1,200 | 0 | 0 |
| **Orders** | 2,546 | 2,546 | 0 | 0 |
| **Bookings** | 1,544 | 1,544 | 0 | 0 |
| **Notifications** | 5,178 | 5,178 | 0 | 0 |

**Result:** Zero schema changes. Zero permanent dummy data alterations.

---

## 17. TypeScript Result

- **Frontend (`ecosphere_app`)**:
  ```
  npx tsc --noEmit -> Exit code: 0 (0 errors)
  ```
- **Backend (`ecosphere_backend`)**:
  ```
  npm run typecheck -> Exit code: 0 (0 errors)
  ```

---

## 18. Expo Result

- **Expo Web Export (`ecosphere_app`)**:
  ```
  npx expo export -p web --no-minify -> Exported: dist (Exit code: 0)
  ```

---

## 19. Regression Results

All 13 existing backend regression test suites executed cleanly via `node scratch/runFullRegression.js`:
- `testFeedbackEngine.js`: PASS
- `testOpportunityEngine.js`: PASS
- `testRecommendationEngine.js`: PASS
- `testEconomicIntelligence.js`: PASS
- `testDecisionIntelligence.js`: PASS
- `testTrendIntelligence.js`: PASS
- `testOpportunityDiscovery.js`: PASS
- `testSkillDemandEmployment.js`: PASS
- `testEconomicWorkforceActivation.js`: PASS
- `testAiAssistant.js`: PASS
- `testEconomicCopilot.js`: PASS
- `testBookingApi.js`: PASS
- `testAllApisFunctional.js`: PASS

---

## 20. Remaining Risks

- **Local Network / Port Access**: If the backend server on port 5000 is stopped, physical mobile devices running Expo Go will report network errors until `npm run dev` in `ecosphere_backend` is active.
- **Development OTP**: `DEV_OTP = '123456'` is active when `NODE_ENV === 'development'`. For production release, an SMS gateway (e.g. Twilio, MSG91) must be plugged into `authService.requestOtp`.

---

## 21. Limitations

- Only 10-digit mobile numbers are accepted (matching the 1,202 existing database rows). Country code prefixes (`+91`) are automatically stripped and normalized to 10 digits.

---

## Acceptance Criteria Checklist

- [x] User A logs in → User A profile appears.
- [x] App restarts → User A profile still appears.
- [x] User A logs out.
- [x] User B logs in → User B profile appears.
- [x] App restarts → User B profile still appears.
- [x] User B NEVER sees User A's profile.
- [x] User A NEVER sees User B's profile.
- [x] Role belongs to the authenticated user.
- [x] Onboarding data belongs to the authenticated user.
- [x] Existing dummy data remains intact.
- [x] TypeScript = 0 errors.
- [x] Backend typecheck = 0 errors.
- [x] Expo build/export succeeds.
- [x] Authentication regression passes.

---

**FINAL VERDICT:**  
**AUTHENTICATION IDENTITY — FIXED**
