# Registration Errors - Fixed

## Issues Identified and Resolved

### 1. UserMemberships 404 Error

**Problem:**
- POST request to `/api/UserMemberships` was failing with 404
- The frontend was passing `userProfileId: parseInt(userId)` where `userId` was a GUID string
- Parsing a GUID as an integer results in `NaN`, causing the backend to reject the request

**Root Cause:**
- In [SellerOnboarding.jsx:270](beyti-frontend/src/Beyti-Website/Registration/SellerOnboarding.jsx#L270), the code was using:
  ```javascript
  userProfileId: parseInt(userId)  // userId is GUID '86162778-bc06-4348-bf6d-35e716a1f635'
  ```
- Should have been using `userProfileId` from localStorage (integer value `1014`)

**Fix Applied:**
- Retrieved `userProfileId` from localStorage separately
- Updated membership creation to use:
  ```javascript
  userProfileId: parseInt(userProfileId)  // Now using correct integer value
  ```

**Files Modified:**
- `beyti-frontend/src/Beyti-Website/Registration/SellerOnboarding.jsx`

---

### 2. Notifications 400 Error

**Problem:**
- GET requests to `/api/Notifications/user/{userId}` were failing with 400 Bad Request
- Error: `"The value '86162778-bc06-4348-bf6d-35e716a1f635' is not valid."`
- Backend controller expects `int userId` but frontend was passing GUID string

**Root Cause:**
- The `NotificationsController` endpoints expect `userProfileId` (integer):
  ```csharp
  [HttpGet("user/{userId}")]
  public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int userId)
  ```
- Frontend was passing ASP.NET Identity GUID via `getUserId()` instead of UserProfileId

**Fix Applied:**
1. Added `getUserProfileId()` function to both auth utility files:
   - `beyti-frontend/src/utils/auth.js`
   - `beyti-frontend/src/utils/authUtils.js`

2. Updated SellerDashboard to use `getUserProfileId()`:
   ```javascript
   const loggedInUserId = sellerUserProfileId || getUserProfileId();
   ```

3. Updated logout functions to clear `userProfileId` from localStorage

**Files Modified:**
- `beyti-frontend/src/utils/auth.js`
- `beyti-frontend/src/utils/authUtils.js`
- `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

---

## Understanding the Two IDs

### userId (ASP.NET Identity GUID)
- Type: String (GUID format)
- Example: `'86162778-bc06-4348-bf6d-35e716a1f635'`
- Purpose: ASP.NET Core Identity user identifier
- Used for: Authentication, JWT tokens

### userProfileId (Database Integer)
- Type: Integer
- Example: `1014`
- Purpose: Database foreign key for UserProfile table
- Used for: Database relationships (Notifications, Memberships, etc.)

---

### 3. Login Flow - getUserProfile 400 Error

**Problem:**
- Login.jsx was calling `getUserProfile(userId)` with GUID instead of integer
- Similar calls to `getProviderProfile`, `getSellerByUserProfileId`, and `getDriverByUserProfileId` had same issue

**Root Cause:**
- Login response provides both `userId` (GUID) and `userProfileId` (integer)
- Code was extracting userId but using it for all API calls
- Line 71: `const userId = response.userId || response.UserId || response.userProfileId || response.UserProfileId;`

**Fix Applied:**
- Separated the two IDs:
  ```javascript
  const userId = response.userId || response.UserId;  // GUID for authentication
  const userProfileId = response.userProfileId || response.UserProfileId;  // Integer for API calls
  ```
- Updated all profile API calls to use `userProfileId`
- Store both values in localStorage

**Files Modified:**
- `beyti-frontend/src/Beyti-Website/Registration/Login.jsx`

---

### 4. "Select Store" Modal Appearing After Login/Registration

**Problem:**
- After login or registration, sellers were seeing a "Select Store" modal
- This was intended for testing with multiple sellers, not for production use

**Root Cause:**
- SellerDashboard was calling `getSellers()` which returns ALL sellers in the system
- Logic: `if (sellers.length > 1) setSelectModalOpen(true)`
- This meant any user would see the modal if there are multiple sellers in the database

**Fix Applied:**
- Changed to use `getSellerByUserProfileId(currentUserProfileId)` instead
- Now only loads the seller profile for the current logged-in user
- Auto-selects that seller immediately without showing modal
- Modal will never appear for regular users (only their own seller profile)

**Files Modified:**
- `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

---

## Testing Checklist

- [x] SellerOnboarding membership creation now uses correct userProfileId
- [x] NotificationDropdown receives integer userProfileId instead of GUID
- [x] Both auth utility files have getUserProfileId() function
- [x] Logout functions clear userProfileId from localStorage
- [x] Login flow stores and uses userProfileId correctly
- [x] SellerDashboard auto-selects current user's seller without modal

## Next Steps

1. Test the seller registration flow end-to-end
2. Verify membership assignment works correctly
3. Check that notifications load properly in the seller dashboard
4. Test login flow to ensure no "Select Store" modal appears
5. Verify getUserProfile API call succeeds with userProfileId
6. Consider updating other dashboards (Customer, ServiceProvider) if they have similar issues
