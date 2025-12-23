# Registration Flow Test Plan

## Test Environment Setup

### Prerequisites
- ✅ Backend running on `https://localhost:7062`
- ✅ Frontend running on `http://localhost:5173`
- ✅ Database seeded with:
  - 13 ServiceCategories
  - 10 Categories
  - 3 MembershipPlans

### Test Data
- Use unique email addresses for each test
- Format: `test.provider1@example.com`, `test.seller1@example.com`, etc.
- Phone: `+973 12345678` (valid Bahrain format)

---

## Test Case 1: Customer Registration

### Objective
Verify that a customer can register and access the customer dashboard without any onboarding.

### Steps
1. Navigate to `http://localhost:5173/register`
2. Fill out registration form:
   - First Name: `Test`
   - Last Name: `Customer`
   - Email: `test.customer1@example.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Select **"I want to Shop"** (Customer role)
4. Click **"Register"**

### Expected Results
- ✅ User account created in database
- ✅ UserProfile created with RoleType = "Customer"
- ✅ User redirected to `/dashboard`
- ✅ Customer dashboard loads successfully
- ✅ No onboarding flow shown (direct to dashboard)
- ✅ localStorage contains:
  - `authToken`
  - `userId`
  - `userRole` = "Customer"

### Database Verification
```sql
SELECT UP.Id, UP.FirstName, UP.LastName, UP.RoleType, IU.Email
FROM UserProfile UP
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id
WHERE IU.Email = 'test.customer1@example.com';
```

---

## Test Case 2: Service Provider Registration (Full Flow with Membership)

### Objective
Verify service provider can complete full 5-step onboarding with dynamic service categories and membership selection.

### Steps

#### Part 1: Initial Registration
1. Navigate to `http://localhost:5173/register`
2. Fill out registration form:
   - First Name: `Test`
   - Last Name: `Provider`
   - Email: `test.provider1@example.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Select **"I want to become a Partner"** → **"Service Provider"**
4. Click **"Register"**

#### Part 2: Step 1 - Identity
5. Verify service type dropdown loads from backend (should show: Catering, Carpentry, Cleaning, Electrical, HVAC, Landscaping, Moving Services, Other, Painting, Pest Control, Photography, Plumbing, Tutoring)
6. Fill out:
   - Business Name: `Ali's Plumbing Services`
   - Service Type: Select **"Plumbing"** (ID: 1)
   - Phone: `+973 12345678`
7. Click **"Next"**

#### Part 3: Step 2 - Services
8. Fill out:
   - Service Description: `Professional plumbing installation and repair services for residential and commercial properties`
   - Minimum Price: `25`
   - Maximum Price: `150`
9. Click **"Next"**

#### Part 4: Step 3 - Location
10. Fill out:
    - City: `Manama`
    - Block: `315`
    - Road: `1520`
    - Building: `45` (optional)
    - Avenue: `25` (optional)
11. Click **"Next"**

#### Part 5: Step 4 - Verification
12. Check the verification checkbox: **"I confirm that I have uploaded valid professional certifications or licenses"**
13. Click **"Next"**

#### Part 6: Step 5 - Membership
14. Verify membership plans load from backend (should show: Starter (Free), Souq (BHD 15), Partner (BHD 35))
15. Select **"Souq"** plan (ID: 2)
16. Click **"Complete Registration"**

### Expected Results
- ✅ Service categories loaded dynamically from `/api/ServiceCategories`
- ✅ Membership plans loaded dynamically from `/api/MembershipPlans`
- ✅ Address created in database
- ✅ ServiceProvider created with ServiceCategoryId = 1 (Plumbing)
- ✅ ServiceProviderAddress link created
- ✅ UserMembership created with MembershipPlanId = 2 (Souq)
- ✅ User redirected to `/dashboard`
- ✅ Service Provider dashboard loads
- ✅ localStorage contains:
  - `userRole` = "ServiceProvider"

### Database Verification
```sql
-- Verify ServiceProvider record
SELECT SP.Id, SP.BusinessName, SP.ServiceCategoryId, SC.Name AS CategoryName,
       SP.MinServicePrice, SP.MaxServicePrice
FROM ServiceProvider SP
JOIN ServiceCategory SC ON SP.ServiceCategoryId = SC.Id
JOIN UserProfile UP ON SP.UserProfileId = UP.Id
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id
WHERE IU.Email = 'test.provider1@example.com';

-- Verify Membership
SELECT UM.Id, UM.UserProfileId, UM.MembershipPlanId, MP.Name AS PlanName,
       UM.StartDate, UM.EndDate, UM.Status
FROM UserMembership UM
JOIN MembershipPlan MP ON UM.MembershipPlanId = MP.Id
JOIN UserProfile UP ON UM.UserProfileId = UP.Id
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id
WHERE IU.Email = 'test.provider1@example.com';
```

---

## Test Case 3: Service Provider Registration (Skip Membership)

### Objective
Verify service provider can skip membership selection and still complete registration.

### Steps
1. Follow Test Case 2 steps 1-13
2. At Step 5 - Membership, click **"Skip - Use Free Plan"**
3. Observe that Starter (Free) plan is selected
4. Click **"Complete Registration"**

### Expected Results
- ✅ All steps same as Test Case 2
- ✅ UserMembership created with MembershipPlanId = 1 (Starter/Free)
- ✅ Registration completes successfully

---

## Test Case 4: Seller Registration (Full Flow with Membership)

### Objective
Verify seller can complete full 4-step onboarding with dynamic categories and membership selection.

### Steps

#### Part 1: Initial Registration
1. Navigate to `http://localhost:5173/register`
2. Fill out registration form:
   - First Name: `Test`
   - Last Name: `Seller`
   - Email: `test.seller1@example.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Select **"I want to become a Partner"** → **"Seller"**
4. Click **"Register"**

#### Part 2: Step 1 - Identity
5. Verify category dropdown loads from backend (should show: Automotive, Beauty & Personal Care, Books & Media, Electronics, Fashion & Clothing, Food & Beverages, Home & Garden, Other, Sports & Outdoors, Toys & Games)
6. Fill out:
   - Store Name: `Tech Gadgets Bahrain`
   - Category: Select **"Electronics"** (ID: 1)
   - Phone: `+973 33445566`
7. Click **"Next"**

#### Part 3: Step 2 - Location
8. Fill out:
   - City: `Riffa`
   - Block: `940`
   - Road: `4520`
   - Building: `12`
   - Avenue: `45`
9. Click **"Next"**

#### Part 4: Step 3 - Verification
10. Check the verification checkbox: **"I confirm that I have uploaded valid business registration documents"**
11. Click **"Next"**

#### Part 5: Step 4 - Membership
12. Verify membership plans load from backend
13. Select **"Partner"** plan (ID: 3)
14. Click **"Complete Registration"**

### Expected Results
- ✅ Categories loaded dynamically from `/api/Categories`
- ✅ Membership plans loaded dynamically from `/api/MembershipPlans`
- ✅ Address created in database
- ✅ Seller created with CategoryId = 1 (Electronics)
- ✅ SellerAddress link created
- ✅ UserMembership created with MembershipPlanId = 3 (Partner)
- ✅ User redirected to `/dashboard`
- ✅ Seller dashboard loads
- ✅ localStorage contains:
  - `userRole` = "Seller"

### Database Verification
```sql
-- Verify Seller record
SELECT S.Id, S.StoreName, S.CategoryId, C.Name AS CategoryName
FROM Seller S
JOIN Category C ON S.CategoryId = C.Id
JOIN UserProfile UP ON S.UserProfileId = UP.Id
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id
WHERE IU.Email = 'test.seller1@example.com';

-- Verify Membership
SELECT UM.Id, UM.UserProfileId, UM.MembershipPlanId, MP.Name AS PlanName,
       UM.StartDate, UM.EndDate, UM.Status
FROM UserMembership UM
JOIN MembershipPlan MP ON UM.MembershipPlanId = MP.Id
JOIN UserProfile UP ON UM.UserProfileId = UP.Id
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id
WHERE IU.Email = 'test.seller1@example.com';
```

---

## Test Case 5: Seller Registration (Skip Membership)

### Objective
Verify seller can skip membership and complete registration with free plan.

### Steps
1. Follow Test Case 4 steps 1-11
2. At Step 4 - Membership, click **"Skip - Use Free Plan"**
3. Click **"Complete Registration"**

### Expected Results
- ✅ UserMembership created with MembershipPlanId = 1 (Starter/Free)
- ✅ Registration completes successfully

---

## Test Case 6: Driver Registration

### Objective
Verify driver registration works (no membership required).

### Steps
1. Navigate to `http://localhost:5173/register`
2. Fill out registration form:
   - First Name: `Test`
   - Last Name: `Driver`
   - Email: `test.driver1@example.com`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Select **"I want to become a Partner"** → **"Driver"**
4. Click **"Register"**
5. Complete driver onboarding form:
   - Vehicle Type: `Sedan`
   - License Number: `12345678`
   - Phone: `+973 77889900`
6. Click **"Submit"** or **"Complete Registration"**

### Expected Results
- ✅ Driver record created
- ✅ No membership required/created
- ✅ User redirected to `/dashboard`
- ✅ Driver dashboard loads
- ✅ localStorage contains:
  - `userRole` = "Driver"

---

## Test Case 7: Foreign Key Constraint Validation (Critical)

### Objective
Verify that the original FK constraint error is fixed - ensure serviceCategoryId and categoryId are sent correctly.

### Steps

#### Service Provider Test
1. Complete Service Provider registration (Test Case 2 or 3)
2. Check browser console for errors
3. Verify no "Foreign Key Constraint" errors appear

#### Seller Test
4. Complete Seller registration (Test Case 4 or 5)
5. Check browser console for errors
6. Verify no "Foreign Key Constraint" errors appear

### Expected Results
- ✅ NO error: "The INSERT statement conflicted with the FOREIGN KEY constraint"
- ✅ ServiceProvider.ServiceCategoryId is set correctly
- ✅ Seller.CategoryId is set correctly
- ✅ Both registrations complete without errors

---

## Test Case 8: API Integration Validation

### Objective
Verify all data is loaded from backend, not hardcoded.

### Steps
1. Open browser DevTools → Network tab
2. Start Service Provider registration
3. At Step 1, verify API call to:
   - `GET /api/ServiceCategories` - returns 13 categories
4. At Step 5, verify API call to:
   - `GET /api/MembershipPlans` - returns 3 plans
5. Start Seller registration
6. At Step 1, verify API call to:
   - `GET /api/Categories` - returns 10 categories

### Expected Results
- ✅ `/api/ServiceCategories` returns JSON with 13 items
- ✅ `/api/Categories` returns JSON with 10 items
- ✅ `/api/MembershipPlans` returns JSON with 3 items
- ✅ Dropdowns populate with backend data
- ✅ No hardcoded arrays in frontend code being used

---

## Test Case 9: Membership Assignment Validation

### Objective
Verify membership is correctly saved to database after registration.

### Steps
1. Complete Service Provider registration with Souq plan (Test Case 2)
2. Run database query:
```sql
SELECT * FROM UserMembership
WHERE MembershipPlanId = 2
ORDER BY CreatedAt DESC;
```

### Expected Results
- ✅ UserMembership record exists
- ✅ MembershipPlanId = 2 (Souq)
- ✅ Status = 'Active'
- ✅ StartDate = today's date
- ✅ EndDate = today's date + 30 days
- ✅ AutoRenew = false

---

## Test Case 10: Error Handling

### Objective
Verify proper error messages appear when API calls fail or validation errors occur.

### Steps

#### Missing Category Selection
1. Start Service Provider registration
2. At Step 1, leave "Service Type" dropdown empty
3. Fill other fields
4. Click "Next"
5. Verify error message: "Please select a service category"

#### Invalid Price Range
6. At Step 2, enter:
   - Minimum Price: `100`
   - Maximum Price: `50` (less than minimum)
7. Click "Next"
8. Verify error message: "Maximum price must be greater than or equal to minimum price"

#### Backend API Down
9. Stop the backend server
10. Try to load Service Provider registration Step 1
11. Verify error message appears about failing to load categories

### Expected Results
- ✅ Validation errors show inline on form fields
- ✅ API errors show user-friendly messages
- ✅ Form doesn't submit with validation errors
- ✅ Loading states show while fetching data

---

## Test Case 11: Existing User Login

### Objective
Verify existing users (the 2 users already in database) can still log in and access correct dashboards.

### Steps
1. Identify existing users in database:
```sql
SELECT IU.Email, UP.RoleType
FROM UserProfile UP
JOIN AspNetUsers IU ON UP.IdentityUserId = IU.Id;
```
2. Attempt to log in with each existing user
3. Verify they reach the correct dashboard based on role

### Expected Results
- ✅ Existing users can log in successfully
- ✅ Correct dashboard loads based on user role
- ✅ No registration data lost

---

## Negative Test Cases

### Test Case 12: Duplicate Email
1. Register with email `test.duplicate@example.com`
2. Try to register again with same email
3. **Expected**: Error message "Email already in use"

### Test Case 13: Invalid Phone Format
1. Start registration
2. Enter phone: `123` (invalid format)
3. **Expected**: Validation error "Please enter a valid phone number"

### Test Case 14: Password Mismatch
1. Start registration
2. Enter Password: `Test123!`
3. Enter Confirm Password: `Different123!`
4. **Expected**: Validation error "Passwords must match"

---

## Performance Tests

### Test Case 15: API Response Time
1. Measure API response times:
   - `/api/ServiceCategories` - should return < 500ms
   - `/api/Categories` - should return < 500ms
   - `/api/MembershipPlans` - should return < 500ms
2. Verify dropdowns populate quickly (< 1 second)

---

## Success Criteria Summary

✅ **All 4 user types can register successfully:**
- Customer
- Service Provider
- Seller
- Driver

✅ **Data Integration:**
- Service categories load from database
- Product categories load from database
- Membership plans load from database

✅ **Foreign Key Constraints:**
- ServiceCategoryId properly sent and saved
- CategoryId properly sent and saved
- No FK constraint errors

✅ **Membership System:**
- Memberships can be selected
- Memberships can be skipped (free plan assigned)
- UserMembership records created correctly

✅ **Navigation:**
- Users redirected to correct dashboards
- localStorage updated with correct role

✅ **Error Handling:**
- Validation errors display correctly
- API errors handled gracefully
- Loading states shown

---

## Rollback Plan

If critical issues are found during testing:

1. **Database Rollback:**
   ```sql
   -- Remove test users
   DELETE FROM UserMembership WHERE UserProfileId IN (SELECT Id FROM UserProfile WHERE /* test user criteria */);
   DELETE FROM ServiceProvider WHERE UserProfileId IN (SELECT Id FROM UserProfile WHERE /* test user criteria */);
   DELETE FROM Seller WHERE UserProfileId IN (SELECT Id FROM UserProfile WHERE /* test user criteria */);
   DELETE FROM UserProfile WHERE FirstName = 'Test';
   ```

2. **Code Rollback:**
   - Frontend: Revert to previous commit
   - Backend: Revert controller changes
   - Database: Roll back migrations

---

## Test Execution Checklist

- [ ] Backend running on https://localhost:7062
- [ ] Frontend running on http://localhost:5173
- [ ] Database seeded with sample data
- [ ] Browser DevTools open for monitoring
- [ ] SQL client ready for database verification
- [ ] Test Case 1: Customer Registration
- [ ] Test Case 2: Service Provider (with membership)
- [ ] Test Case 3: Service Provider (skip membership)
- [ ] Test Case 4: Seller (with membership)
- [ ] Test Case 5: Seller (skip membership)
- [ ] Test Case 6: Driver Registration
- [ ] Test Case 7: FK Constraint Validation
- [ ] Test Case 8: API Integration Validation
- [ ] Test Case 9: Membership Assignment Validation
- [ ] Test Case 10: Error Handling
- [ ] Test Case 11: Existing User Login
- [ ] Test Cases 12-14: Negative Tests
- [ ] Test Case 15: Performance Tests

---

## Test Results Template

After each test, record:

**Test Case #:** ___
**Status:** ✅ Pass / ❌ Fail
**Executed By:** _______________
**Date:** _______________
**Notes:** _______________
**Issues Found:** _______________

---

## Issue Reporting Template

If issues are found:

**Issue #:** ___
**Test Case:** ___
**Severity:** Critical / High / Medium / Low
**Description:** _______________
**Steps to Reproduce:** _______________
**Expected Result:** _______________
**Actual Result:** _______________
**Screenshots/Logs:** _______________
**Database State:** _______________
