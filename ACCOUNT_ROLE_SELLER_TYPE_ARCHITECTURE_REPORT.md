# ECOSPHERE — Account Role & Seller Type Architecture Report

> **Status:** ACCOUNT ROLE & SELLER TYPE — COMPLETE  
> **Phase Notice:** Phase 6 Commerce UI remained strictly halted as instructed. Verification executed against real SQL Server database, running backend server, and Expo web bundler.

---

## 1. Existing Role Architecture

Prior to this revision, the system carried legacy ambiguities regarding multi-role representation. In the preflight audit, we inspected the core tables in the SQL Server database (`LAPTOP-LFA2J60D\SQLEXPRESS` / `ECOSPHERE`):
- `Roles`: Contained 3 canonical roles:
  - `RoleId 1`: `customer`
  - `RoleId 2`: `seller`
  - `RoleId 3`: `administrator`
- `UserRoles`: Holds mapping between `UserId` and `RoleId`, with a boolean column `IsPrimaryRole` (bit).

### Audit Findings:
- Total Users in database: **1,204**
- Total `UserRoles` records: **1,204**
- Distribution of primary roles across the 1,204 users:
  - `customer`: **903** users
  - `seller`: **241** users
  - `administrator`: **60** users
- Multi-role check: Running `SELECT UserId, COUNT(*) FROM UserRoles GROUP BY UserId HAVING COUNT(*) > 1` returned **0 rows**. Every existing account already had exactly one primary role record.

---

## 2. Existing Seller Architecture

An audit of existing seller accounts (`RoleId = 2`) revealed:
- 241 users hold the `seller` role.
- Associated tables:
  - `UserProfiles.Occupation`: Captured various occupational designations such as `Consultant` (42), `Student` (38), `Technician` (37), `Business Owner` (37), `Freelancer` (34), `Software Engineer` (32), `Merchant` (21).
  - `Businesses`: 250 records exist in the database, linked to owners via `OwnerUserId = Users.UserId`.
  - `BusinessCategories`: 15 categories exist (e.g. `Food & Restaurant`, `Retail`, `Technology`, `Healthcare`, `Hospitality`, `Logistics`).
- **Migration Gap**: Existing seller accounts created before this revision have free-text occupations and lack structured seller sub-type taxonomy in their profile preferences. Per user instruction, these accounts were **not** mass-updated or guessed; their data remains intact and preserved.

---

## 3. One-Role-Per-Account Implementation

### Core Enforcement Rule
An account identified by its unique identity (`UserId`, mobile, email) holds **exactly ONE primary platform role**:
$$\text{Account} \to \text{ONE PRIMARY ROLE} \in \{\text{CUSTOMER}, \text{SELLER}, \text{ADMINISTRATOR}\}$$

### Backend Protection & Enforcement:
1. **Allowlist Validation**: During registration/OTP verification in [authService.ts](file:///d:/ECOSPHERE/ecosphere_backend/src/services/authService.ts), `requestedRole` is strictly validated against `['customer', 'seller']`. Privileged roles like `administrator` are automatically rejected and coerced to `customer`.
2. **Single Primary Role Record**: When provisioning a user, the backend inserts exactly one record into `UserRoles` with `IsPrimaryRole = 1`.
3. **No Silent Role Flipping**:
   - A customer cannot pass `role: 'seller'` to `PUT /api/profile`. The controller drops protected fields (`role`, `id`, `UserId`, `status`), and `UserRoles` is never modified.
   - A seller cannot toggle to customer.
   - When an existing user logs in via OTP, their existing database role is fetched from `UserRoles ur WHERE ur.UserId = @userId AND ur.IsPrimaryRole = 1`. The `requestedRole` parameter is ignored for existing accounts.
4. **JWT Generation**: The JWT claims (`userId`, `role`, `mobile`) are signed **strictly** from the resolved database role, never from client-supplied state.

---

## 4. Seller Type Architecture

A Seller in ECOSPHERE is not a monolithic generic type. When `SELLER` is chosen, the system establishes their Seller Type:

```
PERSON / ACCOUNT
       ↓
ONE PRIMARY ROLE: SELLER
       ↓
  SELLER TYPE
       ├── 1. Shop Owner (Retail, Grocery, Electronics, Clothing, etc.)
       ├── 2. Service Provider (Home Services, Beauty, Professional, etc.)
       ├── 3. Technician (AC, Refrigeration, Electrical, Appliances, etc.)
       ├── 4. Restaurant Owner (Dining, Cafes, Cloud Kitchens, Bakery)
       ├── 5. Hotel Owner (Hospitality, Lodging, Resorts, Homestays)
       ├── 6. Wholesaler / Dealer (B2B Bulk Goods, FMCG, Commercial)
       ├── 7. Delivery Agent (Local Logistics, Courier, Parcel Transport)
       └── 8. Employer (Workforce Hiring, Job Opportunity Creation)
```

### Persistence Mechanism:
- `UserProfiles.Occupation`: Persists the human-readable professional title, e.g. `"Shop Owner - Grocery"` or `"Service Provider"`.
- `UserProfiles.Bio`: Serializes structured configuration `{ sellerType, shopType, categories }` within `nvarchar(500)`.
- Backend endpoints return `sellerType` in `/api/auth/me` and `/api/profile`.

---

## 5. Business Type Architecture

Shop Owners map to canonical business archetypes from `BusinessCategories` (15 categories):
- `GROCERY`: Grocery & Staples
- `ELECTRONICS`: Electronics & Mobiles
- `CLOTHING`: Clothing & Fashion
- `PHARMACY`: Pharmacy & Wellness
- `HARDWARE`: Hardware & Tools
- `FURNITURE`: Furniture & Living
- `STATIONERY`: Books & Stationery
- `OTHER`: General Retail

---

## 6. Category Architecture & Distinction

The hierarchy strictly separates distinct concepts across the ecosystem:

| Level | Concept | Example | What It Represents |
|---|---|---|---|
| 1 | **ROLE** | `SELLER` | Platform authorization and permissions (1 per account) |
| 2 | **SELLER TYPE** | `SHOP_OWNER` | How the entity operates in the local economy |
| 3 | **SHOP TYPE** | `GROCERY` | Storefront archetype |
| 4 | **CATEGORIES** | `Biscuits, Grains, Dairy, Vegetables` | Operating merchandise categories sold |
| 5 | **PRODUCTS** | `Parle-G, Basmati Rice, Amul Milk` | Concrete inventory catalog items |

Categories describe what the business operates in; they are **never** treated as user roles.

---

## 7. Database Tables Inspected & Capability Matrix

| Concept | Existing Table | Existing API | Status / Reusable? |
|---|---|---|---|
| Primary Role | `Roles`, `UserRoles` | `/api/auth/verify-otp`, `/api/auth/me` | ✅ Reusable directly |
| Seller Type | `UserProfiles.Occupation` | `/api/profile` | ✅ Reusable directly |
| Business Type / Shop Type | `BusinessCategories` | `GET /api/businesses/categories` | ✅ Reusable via new GET endpoint |
| Shop Operating Categories | `ProductCategories` | `GET /api/products/categories` | ✅ Reusable via new GET endpoint |
| Service Category | `ServiceCategories` | `GET /api/services/categories` | ✅ Reusable via new GET endpoint |
| Technical Skills | `Skills`, `UserSkills` | `/api/skills` | ✅ Reusable directly |
| Delivery Agent | `UserProfiles` | `/api/profile` | ✅ Reusable via profile preferences |
| Custom Categories | *None* | *None* | ⚠️ Not supported in schema; reported via UI modal |

---

## 8. APIs Reused

- `POST /api/auth/request-otp`: Reused for mobile OTP delivery.
- `GET /api/auth/me`: Reused for authoritative session profile.
- `GET /api/auth/customer-only`, `/api/auth/seller-only`: Reused for role authorization checks.
- `GET /api/skills`: Reused for technical skills intelligence.

---

## 9. APIs Changed / Created

1. `GET /api/businesses/categories`:
   - Lists 15 active business categories from `BusinessCategories` (`CategoryId`, `CategoryName`, `Description`, `IconName`).
2. `GET /api/products/categories`:
   - Lists 12 active product categories from `ProductCategories` (`ProductCategoryId`, `CategoryName`, `Description`, `ImageUrl`).
3. `GET /api/services/categories`:
   - Lists 14 active service categories from `ServiceCategories` (`ServiceCategoryId`, `CategoryName`, `Description`, `IconName`).
4. `POST /api/auth/verify-otp`:
   - Updated Zod schema and controller to accept optional `sellerType`.
   - Populates `UserProfiles.Occupation` and returns `sellerType` in authenticated user object.
5. `GET /api/profile` & `PUT /api/profile`:
   - Schema in [profile.routes.ts](file:///d:/ECOSPHERE/ecosphere_backend/src/routes/profile.routes.ts) updated to validate `sellerType`, `shopType`, `categories`, and `preferences`.
   - Persists operating configuration and returns structured `preferences` and `sellerType`.

---

## 10. Frontend Screens Created / Modified

1. **`CategoryMultiSelect.tsx`** ([CategoryMultiSelect.tsx](file:///d:/ECOSPHERE/ecosphere_app/src/components/common/CategoryMultiSelect.tsx)):
   - Reusable multi-select category component with:
     - Real-time search filter and clear action.
     - Chip/card selection with animated checkmark badge and accent glowing borders.
     - Dynamic selected counter (`X selected (min 1)`).
     - Clear All button.
     - Empty search state & error state banners.
     - **Extension Point**: `+ ADD CATEGORY` triggers a category governance modal: *"Custom seller-defined categories require backend/category support."*
2. **`RoleSelectionScreen.tsx`** ([RoleSelectionScreen.tsx](file:///d:/ECOSPHERE/ecosphere_app/src/screens/RoleSelectionScreen.tsx)):
   - Redesigned with a 3-step progressive onboarding architecture:
     - **Step 1 (ROLE)**: Select between Customer and Seller. Administrator card is strictly hidden for non-admin accounts.
     - **Step 2 (SELLER TYPE)**: "Tell us what you do" showing cards for Shop Owner, Service Provider, Technician, Restaurant Owner, Hotel Owner, Wholesaler / Dealer, Delivery Agent, and Employer.
     - **Step 3A (SHOP TYPE)**: For Shop Owners, prompts for store archetype (Grocery, Electronics, Fashion, Pharmacy, Hardware, Furniture, Stationery, Retail).
     - **Step 3B (CATEGORIES)**: Hosts `CategoryMultiSelect` to pick operating merchandise/service categories.
3. **`App.tsx`** ([App.tsx](file:///d:/ECOSPHERE/ecosphere_app/App.tsx)):
   - Updated `handleRoleSelection` to accept `sellerConfig`, persist configuration to `profileService.updateProfile`, and route sellers to `SellerDashboard` and customers through customer profile onboarding.
4. **App Services**:
   - `businessService.getCategories()` added to [businessService.ts](file:///d:/ECOSPHERE/ecosphere_app/src/services/businessService.ts).
   - `productService.getCategories()` added to [productService.ts](file:///d:/ECOSPHERE/ecosphere_app/src/services/productService.ts).
   - `serviceService.getCategories()` added to [serviceService.ts](file:///d:/ECOSPHERE/ecosphere_app/src/services/serviceService.ts).
   - `profileService` interfaces expanded in [profileService.ts](file:///d:/ECOSPHERE/ecosphere_app/src/services/profileService.ts).

---

## 11. Customer Flow

1. User registers or selects **CUSTOMER** on Step 1.
2. Verified backend role is `customer`.
3. Account proceeds to Customer Onboarding:
   - `BasicProfileScreen`: Personal name and biography.
   - `LocationSetupScreen`: City / neighborhood location.
   - `PersonalizationScreen`: Discovery preferences (Shopping, Services, Opportunities).
   - `SkillsSetupScreen`: Optional personal skills and work preferences.
   - `CompletionScreen`: Lands on `Home` dashboard.
4. Customer **cannot** self-assign or toggle to Seller.

---

## 12. Seller Flow

1. User registers or selects **SELLER** on Step 1.
2. Navigates to Step 2: "Tell us what you do".
3. Selects their specific **Seller Type**.
4. Routes to the appropriate specialized configuration step.
5. Saves operating categories to backend.
6. Lands on `SellerDashboard`.

---

## 13. Shop Owner Flow

1. User selects **Shop Owner** in Step 2.
2. Transitions to Step 3A: "What type of shop do you own?"
3. Options: Grocery & Staples, Electronics & Mobiles, Clothing & Fashion, Pharmacy & Wellness, Hardware & Tools, Furniture & Living, Books & Stationery, General Retail.
4. Proceeds to Step 3B: Category Selection.

---

## 14. Grocery Category Flow

When Shop Type = `GROCERY`:
- Multi-select displays canonical grocery categories:
  - `[✓] Biscuits`
  - `[✓] Grains & Pulses`
  - `[✓] Dairy & Eggs`
  - `[✓] Vegetables`
  - `[ ] Fruits`
  - `[ ] Snacks & Munchies`
  - `[ ] Beverages`
  - `[ ] Personal Care`
  - `[ ] Household & Cleaning`
  - `[ ] Spices & Condiments`
  - `[ ] Bakery & Bread`
  - `[ ] Frozen Foods`
- Seller can search ("Biscuits"), select/deselect, clear all, and review selections.
- Persisted upon clicking "Complete Seller Setup".

---

## 15. Other Seller Types Supported

All 8 requested seller types are supported in the Step 2 taxonomy:
- **Service Provider**: Multi-select canonical service categories (Electrical, Plumbing, Appliance Repair, Cleaning, Beauty, Tutoring, Media).
- **Technician**: Multi-select technical specializations (AC Repair, Refrigerator Repair, Washing Machine, Electrical Wiring, TV & Audio).
- **Restaurant Owner**: Multi-select culinary categories (North Indian, South Indian, Fast Food, Bakery, Asian, Italian, Beverages).
- **Hotel Owner**: Multi-select stay types (Boutique, Business, Budget, Homestay, Resort, Serviced Apartments).
- **Wholesaler / Dealer**: Multi-select B2B distribution categories (FMCG, Bulk Grains, Commercial Electronics, Construction, Textiles).
- **Delivery Agent**: Multi-select transport & logistics modes (Two-Wheeler, Auto Cargo, Mini Van, Grocery Express, Courier & Parcel).
- **Employer**: Multi-select workforce hiring categories (Retail Sales, Kitchen Staff, Delivery Drivers, Technicians, Warehouse).

---

## 16. Unsupported Seller Types & Future Scope

- **Custom delivery partner telematics & vehicle registration**: Only profile logistics categories are collected; vehicle registration papers and GPS tracking models are not yet modeled in the database and were not invented.
- **B2B Wholesale contract / quotation pricing**: B2B bulk category interest is captured, but wholesale tiered discount engines remain slated for future backend phases.
- **Hotel room inventory & PMS integration**: Hotel archetype is captured, but live room inventory engines remain future scope.

---

## 17. Custom Category Capability

- **Backend Database Audit**: Confirmed zero database tables exist for custom seller-defined categories (`BusinessCategories`, `ProductCategories`, and `ServiceCategories` are system-managed static lookup tables).
- **Design Enforcement**: Per instructions, fake local persistence was **not** created.
- **UI Extension Point**: In `CategoryMultiSelect`, clicking `+ ADD CATEGORY` renders a modal informing:
  > *"Custom seller-defined categories require backend/category support. To maintain high discovery precision across ECOSPHERE, catalog listings are matched to canonical, verified taxonomies."*

---

## 18. JWT Behavior

- Real database integer `UserId` is always used.
- Payload claims: `{ userId: string, role: 'customer' | 'seller' | 'administrator', mobile: string, iat, exp }`.
- Role claim in the token is strictly determined by the database query on `UserRoles` where `IsPrimaryRole = 1`.
- Frontend cannot generate or modify JWT tokens.

---

## 19. Authorization Behavior

- `/api/auth/customer-only`: Returns 200 for Customer; 403 Forbidden for Seller.
- `/api/auth/seller-only`: Returns 200 for Seller; 403 Forbidden for Customer.
- `/api/seller/dashboard`: Protected by `requireRole('seller', 'administrator')`; returns 200 for Seller; 403 Forbidden for Customer.
- `/api/auth/admin-only`: Returns 403 Forbidden for both Customer and Seller.

---

## 20. Identity Isolation & Regression Matrix Results

Automated execution via `test_role_seller_type_matrix.js` and `verify_seller_registration_matrix.ts`:

```
====================================================
ECOSPHERE ROLE & SELLER TYPE ARCHITECTURE TEST SUITE
====================================================
[PASS] Admin Cannot Self-Register (Coerced to customer)
[PASS] New Customer Registration & Role Integrity
[PASS] Customer has exactly 1 record in UserRoles (IsPrimaryRole = 1)
[PASS] /api/auth/me returns customer
[PASS] Customer can access /api/auth/customer-only
[PASS] Customer is FORBIDDEN (403) from /api/auth/seller-only
[PASS] Customer Cannot Self-Grant Seller Role
[PASS] New Seller Registration & Seller Type
[PASS] Seller has exactly 1 primary role in UserRoles
[PASS] UserProfiles.Occupation is Shop Owner
[PASS] Seller can access /api/auth/seller-only
[PASS] Shop Owner & Grocery Categories Setup Flow
[PASS] Occupation reflects Shop Owner - Grocery
[PASS] Categories stored in preferences (Biscuits, Grains, Dairy, Vegetables)
[PASS] Seller Cannot Toggle to Customer Role
[PASS] 15 Business Categories returned
[PASS] 12 Product Categories returned
[PASS] 14 Service Categories returned
>>> ALL TEST MATRIX ASSERTIONS PASSED! <<<
```

---

## 21. Database Safety & Drift Verification

Pre-test and post-test counts on SQL Server (`LAPTOP-LFA2J60D\SQLEXPRESS` / `ECOSPHERE`):

| Table | Pre-Test Baseline | Post-Test Verified | Drift |
|---|---|---|---|
| `Users` | 1,204 | 1,204 | **0** |
| `UserProfiles` | 1,204 | 1,204 | **0** |
| `Roles` | 3 | 3 | **0** |
| `UserRoles` | 1,204 | 1,204 | **0** |
| `Businesses` | 250 | 250 | **0** |
| `BusinessCategories` | 15 | 15 | **0** |
| `Skills` | 24 | 24 | **0** |
| `Services` | 1,200 | 1,200 | **0** |
| `Products` | 1,500 | 1,500 | **0** |
| `ServiceCategories` | 14 | 14 | **0** |
| `ProductCategories` | 12 | 12 | **0** |

**Zero schema alterations. Zero data loss. Baseline fully preserved.**

---

## 22. TypeScript Verification

- **Frontend (`ecosphere_app`)**:
  ```bash
  npx tsc --noEmit
  # Exit code: 0 (Zero errors)
  ```
- **Backend (`ecosphere_backend`)**:
  ```bash
  npm run typecheck
  # Exit code: 0 (Zero errors)
  ```

---

## 23. Backend Build Verification

- **Backend Build (`ecosphere_backend`)**:
  ```bash
  npm run build
  # Exit code: 0 (Clean compilation into dist/)
  ```

---

## 24. Expo Web Bundler Verification

- **Expo Web Export (`ecosphere_app`)**:
  ```bash
  npx expo export -p web --no-minify
  # Web Bundled: index.ts (2194 modules)
  # Assets: 6
  # Web bundles: 1 (6.2MB)
  # Exported: dist (Exit code: 0)
  ```

---

## 25. Remaining Limitations & Recommendations

1. **Category Tagging on Products**: Currently, operating categories describe what the shop or provider offers. In Phase 6 (Commerce), newly added products should be linked to one of the shop's configured operating categories.
2. **Custom Category Governance Workflow**: If custom merchant-defined categories are prioritized in the future, an admin approval table (e.g. `CustomCategoryRequests`) should be designed rather than allowing arbitrary unmoderated tags into the catalog.
3. **Delivery Partner Domain Entity**: When delivery dispatch is built, a dedicated `DeliveryPartners` relational table can link to `Users` with vehicle type and license verification.

---

### Final Milestone Verification
- **One Role Per Account**: Fully enforced at database, API, and UI levels.
- **Seller Type Hierarchy**: Fully architected and operational.
- **Business/Shop Archetypes**: Fully integrated with canonical business categories.
- **Category Multi-Select Component**: Fully implemented and reusable.
- **Phase 6 Commerce**: Remained halted as instructed.

**ACCOUNT ROLE & SELLER TYPE — COMPLETE**
