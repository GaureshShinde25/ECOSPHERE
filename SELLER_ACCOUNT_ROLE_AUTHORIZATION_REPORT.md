# ECOSPHERE — SELLER ACCOUNT REGISTRATION & ROLE AUTHORIZATION REPORT

**Status**: **COMPLETE**  
**Audit & Fix Date**: September 24, 2026  
**Ecosystem**: ECOSPHERE Multi-Tenant Decentralized Local Economy Engine  

---

## 1. Current Role Architecture

The ECOSPHERE authorization framework models authorization across three primary relational layers in Microsoft SQL Server:
1. **`Roles` Table**: Defines canonical system roles, codes, names, and operational scope.
2. **`UserRoles` Table**: Maps each user identity (`Users.UserId`) to a system role (`Roles.RoleId`) with `IsPrimaryRole` and `IsActive` flags.
3. **Cryptographic JWT & Middleware**: Encodes `{ userId, role, mobile }` within signed HMAC-SHA256 JWT tokens. Request authorization is enforced at route boundaries using `requireAuth` and `requireRole(...)`.

```
                    ┌────────────────────────────┐
                    │        Roles Table         │
                    ├──────────┬─────────────────┤
                    │ RoleId 1 │ customer        │
                    │ RoleId 2 │ seller          │
                    │ RoleId 3 │ administrator   │
                    └──────────┴─────────────────┘
                                  ▲
                                  │ (Foreign Key)
                    ┌─────────────┴──────────────┐
                    │      UserRoles Table       │
                    ├──────────┬─────────────────┤
                    │ UserId   │ (bigint)        │
                    │ RoleId   │ (int)           │
                    │ Primary  │ (bit = 1)       │
                    │ IsActive │ (bit = 1)       │
                    └─────────────┬──────────────┘
                                  ▲
                                  │ (User Identity)
                    ┌─────────────┴──────────────┐
                    │        Users Table         │
                    └────────────────────────────┘
```

---

## 2. Existing Roles in Database

Audited directly from SQL Server table `Roles`:

| RoleId | RoleCode | RoleName | Description | IsActive | CreatedAt |
|---|---|---|---|---|---|
| **1** | `customer` | Customer / User | Discover products, services, jobs and opportunities. | `1` (true) | 2026-08-27 12:05:01 |
| **2** | `seller` | Seller / Employer | Manage businesses, products, services, jobs and customers. | `1` (true) | 2026-08-27 12:05:01 |
| **3** | `administrator` | Administrator | Manage and monitor the ECOSPHERE platform. | `1` (true) | 2026-08-27 12:05:01 |

---

## 3. Existing UserRoles Behavior

Prior to this fix, the 1,203 database users were distributed across roles as follows:
- **`customer` (RoleId 1)**: 903 users
- **`seller` (RoleId 2)**: 240 users
- **`administrator` (RoleId 3)**: 60 users

Every seeded user had exactly 1 record in `UserRoles` with `IsPrimaryRole = 1`.

---

## 4. Root Cause

1. **Hardcoded Role Provisioning in `authService.verifyOtp`**:
   During self-registration, `authService.verifyOtp` unconditionally executed:
   ```sql
   INSERT INTO UserRoles (UserId, RoleId, IsPrimaryRole, IsActive, CreatedAt)
   VALUES (@newId, 1, 1, 1, CURRENT_TIMESTAMP);
   ```
   RoleId was hardcoded to `1` (`customer`), regardless of whether the user intended to register as a Customer or Seller.
2. **Missing `requestedRole` Intent in Registration Payload**:
   `RegisterScreen` collected name, email, mobile, and password, but provided no role/account type selector, omitting `requestedRole` from `POST /api/auth/verify-otp`.
3. **Disconnected RoleSelection UX**:
   When new users reached `RoleSelectionScreen` post-OTP, the user had already been committed to the database as a Customer with a Customer JWT. Selecting `Seller / Employer` visually triggered the notice:
   `"Note: Your account is authorized as Customer. Requesting Seller / Employer access will continue using your backend-assigned permissions."`
   Continuing enforced the backend's Customer role via an alert popup, preventing genuine Seller registration.

---

## 5. Chosen Seller Registration Architecture (Option A: Direct Seller Registration)

Option A was chosen because ECOSPHERE's existing architecture already treats `seller` (RoleId 2) as a first-class user role:
- Sellers self-register as `seller` (or `customer`).
- The backend validates the requested role against an allowlist (`['customer', 'seller']`).
- Privileged roles (such as `administrator`) can **never** be self-assigned.
- Upon OTP verification, the backend resolves the authoritative `RoleId` directly from the `Roles` table (`RoleId = 2` for seller, `RoleId = 1` for customer) and persists it to `UserRoles`.
- The JWT is minted directly from this persisted role.
- **Person ≠ Business Separation**: Having the Seller role enables the user to access Seller APIs and dashboards to create and manage one or more `Businesses`. Verification of businesses (via `VerificationRequests`) remains a separate business-entity concern.

---

## 6. Backend Changes

1. **`ecosphere_backend/src/routes/auth.routes.ts`**:
   - Updated `verifyOtpSchema` to accept optional `requestedRole: z.string().optional()`.
2. **`ecosphere_backend/src/controllers/authController.ts`**:
   - Extracted `requestedRole` from `req.body` and passed `{ name, email, requestedRole }` into `authService.verifyOtp`.
3. **`ecosphere_backend/src/services/authService.ts`**:
   - Implemented allowlist validation:
     ```ts
     const ALLOWED_SELF_REGISTRATION_ROLES = ['customer', 'seller'];
     let targetRoleCode = 'customer';
     if (registrationData?.requestedRole) {
       const normalizedRole = String(registrationData.requestedRole).trim().toLowerCase();
       if (ALLOWED_SELF_REGISTRATION_ROLES.includes(normalizedRole)) {
         targetRoleCode = normalizedRole;
       } else {
         logger.warn('Non-allowlisted or privileged role requested during registration, defaulting to customer', ...);
         targetRoleCode = 'customer';
       }
     }
     ```
   - Dynamically resolved `RoleId` from database:
     ```sql
     SELECT TOP 1 RoleId, RoleCode FROM Roles WITH (NOLOCK) WHERE LOWER(RoleCode) = @roleCode AND IsActive = 1
     ```
   - Inserted new user into `UserRoles` using `@resolvedRoleId` with `IsPrimaryRole = 1`.
   - Customized default `UserProfiles` bio and occupation (`'Business Owner'` / `'Verified Merchant & Provider'` for seller; `'Community Member'` for customer).
   - Ensured existing users logging in **never** have their persisted role altered by `requestedRole`.

---

## 7. Frontend Changes

1. **`ecosphere_app/src/services/authService.ts`**:
   - Added `requestedRole?: UserRole` to `RegistrationPayload`.
   - Forwarded `requestedRole` in `POST /api/auth/verify-otp`.
2. **`ecosphere_app/src/screens/RegisterScreen.tsx`**:
   - Added interactive glassmorphic Account Type Selector:
     - **Customer / User** (Discover products, services & opportunities)
     - **Seller / Employer** (Grow business, list products & services, hire talent)
   - Transmitted selected role to `onRegister`.
3. **`ecosphere_app/src/screens/OtpScreen.tsx`**:
   - Updated props to accept `requestedRole?: UserRole` inside `registrationData` and forward to `verifyOtp`.
4. **`ecosphere_app/src/screens/RoleSelectionScreen.tsx`**:
   - Eliminated confusing error banner and warning alert dialogs.
   - Authoritatively displays current backend assignment:
     `Active Authorization: Seller / Employer` or `Customer / User`.
   - Clearly designates `Administrator` as `Restricted Access` with lock icon, preventing self-selection.
   - Smoothly routes authorized users with "Continue as Seller" / "Continue as Customer".
5. **`ecosphere_app/App.tsx`**:
   - Tied `RegisterScreen` callback typing to `requestedRole`.
   - Restored and routed roles faithfully: sellers route to `SellerDashboard`, customers to `Home`.

---

## 8. JWT Behavior

JWT generation strictly derives the role claim from backend persistence:
```json
{
  "userId": "1210",
  "role": "seller",
  "mobile": "9990002222",
  "iat": 1790230642,
  "exp": 1790835442
}
```
- No client-supplied role or arbitrary RoleId can spoof the token.
- `req.user` in backend middleware contains the verified `role`.

---

## 9. Authorization Behavior & Role Isolation

Verified via automated HTTP integration tests against live endpoints:

| Role Claim | `/api/auth/customer-only` | `/api/auth/seller-only` | `/api/seller/dashboard` | `/api/auth/admin-only` | `/api/admin/dashboard` |
|---|---|---|---|---|---|
| **Customer** | ✅ 200 OK | 🚫 403 Forbidden | 🚫 403 Forbidden | 🚫 403 Forbidden | 🚫 403 Forbidden |
| **Seller** | 🚫 403 Forbidden | ✅ 200 OK | ✅ 200 OK | 🚫 403 Forbidden | 🚫 403 Forbidden |
| **Administrator** | 🚫 403 Forbidden | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |

---

## 10. Seller Dashboard Routing

- When an account registers or logs in with role `seller`:
  - `App.tsx` reads `user.role === 'seller'`.
  - Routes directly to `SellerDashboard` (tab / screen).
  - Fetches `/api/seller/dashboard` using authenticated Seller JWT.
  - On app restart or browser reload, `authService.getMe()` restores session identity and re-routes directly to `SellerDashboard`.

---

## 11. Business Relationship Behavior (Person ≠ Business Separation)

- Registering as a Seller creates a Person (`Users`) with role `seller` in `UserRoles`.
- It does **not** create a fake or synthetic business record.
- `sellerDashboardService.getDashboardData()` gracefully supports a new Seller with `0` businesses:
  - `stats.totalBusinesses: 0`
  - `stats.activeBusinesses: 0`
  - `primaryBusiness: undefined`
- The seller creates actual businesses via `POST /api/businesses` (`businessService.createBusiness`).

---

## 12. Customer Regression

Existing customer accounts remain completely unaffected:
- Existing Customer login with `dummy.user1000@ecosphere.test` (UserId 2):
  - Returns `role: 'customer'`.
  - Database `UserRoles` record remains `RoleId = 1`.
  - Even if a customer attempts to send `requestedRole: 'seller'` during OTP verification, the backend ignores it for existing accounts and preserves their canonical role.

---

## 13. Admin Protection

- Attempting to pass `requestedRole: 'administrator'` or `requestedRole: 'admin'` in `verifyOtp` triggers security fallback:
  - Backend logs security warning.
  - Defaults role code to `customer` and RoleId to `1`.
  - Database verifies `UserRoles.RoleId = 1`.
  - Admin endpoints return `403 Forbidden`.

---

## 14. Test Matrix Verification

Automated suite `ecosphere_backend/scripts/verify_seller_registration_matrix.ts` executed with 100% pass rate:

- [x] **New Customer registration**: Role `customer` provisioned, RoleId 1 in DB.
- [x] **New Seller registration**: Role `seller` provisioned, RoleId 2 in DB.
- [x] **Existing Customer login**: Authenticated as `customer`, DB unchanged.
- [x] **Existing Seller login**: Authenticated as `seller`, UserId 9.
- [x] **Customer role claim**: Encoded accurately in JWT.
- [x] **Seller role claim**: Encoded accurately in JWT.
- [x] **Admin protection**: Malicious `administrator` registration safely forced to `customer`.
- [x] **JWT identity**: Matches canonical integer UserId.
- [x] **JWT role**: Matches persisted database role.
- [x] **/api/auth/me**: Verified for both Customer and Seller sessions.
- [x] **UserRoles record**: Matches `RoleId` 1 or 2 with `IsPrimaryRole = 1`.
- [x] **Role dashboard routing**: Verified in navigation logic and telemetry.
- [x] **Seller API authorization**: Verified (`/api/auth/seller-only` & `/api/seller/dashboard`).
- [x] **Customer cannot access Seller APIs**: Verified with HTTP 403.
- [x] **Seller cannot access Admin APIs**: Verified with HTTP 403.
- [x] **Session restoration**: Verified via `authService.getMe()`.
- [x] **Logout & Login again**: Verified clean token lifecycle.
- [x] **Role remains correct after restart**: Verified.
- [x] **Existing authentication identity isolation remains intact**: Verified via `test_identity_isolation.js`.

---

## 15. Database Before/After Counts

| Table | Baseline Count | During Test | Final Count (Post-Cleanup) | Status |
|---|---|---|---|---|
| **Roles** | 3 | 3 | 3 | ✅ Intact |
| **UserRoles** | 1,203 | 1,206 | 1,203 | ✅ Restored |
| **Users** | 1,203 | 1,206 | 1,203 | ✅ Restored |
| **UserProfiles** | 1,203 | 1,206 | 1,203 | ✅ Restored |
| **Businesses** | 250 | 250 | 250 | ✅ Intact |

---

## 16. TypeScript & Build Results

- **Backend Typecheck**: `npm run typecheck` ➔ **0 errors** (Exit code 0).
- **Backend Build**: `npm run build` ➔ **0 errors** (Exit code 0).
- **Frontend Typecheck**: `npx tsc --noEmit` ➔ **0 errors** (Exit code 0).

---

## 17. Expo Export Result

- **Expo Web Export**: `npx expo export -p web --no-minify` ➔ **Bundled 2,193 modules, 0 errors** (Exit code 0).

---

## 18. Existing Regression Suites

- Ran `node scratch/test_identity_isolation.js` ➔ **All 7 tests passed**.
- Ran `node scratch/runFullRegression.js` ➔ **All 13 regression suites passed (29/29 APIs, 20/20 Copilot intents, 13/13 bookings)**.

---

## 19. Remaining Limitations

- Administrative roles remain strictly out-of-band / backend-assigned. Self-onboarding to Administrator is intentionally prevented by design.
- If an existing Customer account wishes to convert into a Seller account later, they can register a Business through the Business Registration flow or be upgraded through the admin console.

---

## Final Status

**SELLER ACCOUNT AUTHORIZATION — COMPLETE**
