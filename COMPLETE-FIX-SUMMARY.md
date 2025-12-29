# Complete Registration & Login Fix Summary

## Overview
Fixed multiple critical issues related to userId/userProfileId confusion across the seller and driver registration and login flows.

---

## Issues Fixed

### 1. SellerOnboarding - UserMemberships 404 Error ✅

**Problem:**
- POST to `/api/UserMemberships` failed with 404
- Code was passing `parseInt(userId)` where `userId` was a GUID
- Result: `NaN` sent to backend, causing rejection

**Solution:**
- Retrieved `userProfileId` separately from localStorage
- Changed from: `userProfileId: parseInt(userId)`
- Changed to: `userProfileId: parseInt(userProfileId)`

**File:** `beyti-frontend/src/Beyti-Website/Registration/SellerOnboarding.jsx`

---

### 2. Notifications 400 Error ✅

**Problem:**
- GET to `/api/Notifications/user/{userId}` failed with 400
- Backend expects integer `userProfileId` but received GUID string
- Error: `"The value '86162778-bc06-4348-bf6d-35e716a1f635' is not valid."`

**Solution:**
- Added `getUserProfileId()` function to both auth utility files
- Updated SellerDashboard to use `getUserProfileId()` instead of `getUserId()`
- Updated logout functions to clear `userProfileId`

**Files:**
- `beyti-frontend/src/utils/auth.js`
- `beyti-frontend/src/utils/authUtils.js`
- `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

---

### 3. Login - getUserProfile 400 Error ✅

**Problem:**
- Login.jsx called `getUserProfile(userId)` with GUID instead of integer
- Similar issues with `getProviderProfile`, `getSellerByUserProfileId`, `getDriverByUserProfileId`

**Solution:**
- Separated `userId` (GUID) and `userProfileId` (integer) extraction from login response
- Updated all profile API calls to use `userProfileId`
- Store both values in localStorage

**File:** `beyti-frontend/src/Beyti-Website/Registration/Login.jsx`

**Code Change:**
```javascript
// Before
const userId = response.userId || response.UserId || response.userProfileId || response.UserProfileId;

// After
const userId = response.userId || response.UserId;  // GUID
const userProfileId = response.userProfileId || response.UserProfileId;  // Integer
```

---

### 4. "Select Store" Modal Appearing ✅

**Problem:**
- Sellers saw "Select Store" modal after login/registration
- Modal appeared if there were multiple sellers in the database
- Used for testing, not intended for production

**Solution:**
- Changed from `getSellers()` (all sellers) to `getSellerByUserProfileId()`
- Auto-selects the seller for the logged-in user immediately
- Modal never appears for regular users

**File:** `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

**Code Change:**
```javascript
// Before
const data = await getSellers();  // Returns ALL sellers
if (sellers.length > 1) setSelectModalOpen(true);

// After
const sellerData = await getSellerByUserProfileId(currentUserProfileId);  // Only current user's seller
// Auto-select immediately, never show modal
```

---

### 5. SellerDashboard - handleSellerSelect Undefined ✅

**Problem:**
- `ReferenceError: handleSellerSelect is not defined`
- Function didn't exist, was called in useEffect

**Solution:**
- Replaced function call with direct state setters
- Set `setSellerName()`, `setSellerId()`, `setSellerUserProfileId()` directly

**File:** `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

---

### 6. DriverDashboard - Same Issues as Seller ✅

**Problem:**
- Same "Select Driver" modal issue
- Same `handleDriverSelect is not defined` error

**Solution:**
- Applied identical fix as SellerDashboard
- Use `getDriverByUserProfileId()` instead of `getDrivers()`
- Auto-select driver for current user
- Set state directly instead of calling non-existent function

**File:** `beyti-frontend/src/Beyti-Website/Driver/DriverDashboard.jsx`

---

## Key Concepts

### Two Different IDs in the System

#### userId (ASP.NET Identity GUID)
- **Type:** String (GUID format)
- **Example:** `'86162778-bc06-4348-bf6d-35e716a1f635'`
- **Purpose:** ASP.NET Core Identity authentication
- **Used for:** JWT tokens, authentication
- **Storage:** `localStorage.getItem('userId')`

#### userProfileId (Database Integer)
- **Type:** Integer
- **Example:** `1014`
- **Purpose:** Database foreign key for UserProfile table
- **Used for:** All database relationships (Notifications, Memberships, Sellers, Drivers, etc.)
- **Storage:** `localStorage.getItem('userProfileId')`
- **Accessor:** `getUserProfileId()` - returns parsed integer

---

## Files Modified

1. **Auth Utilities** (Added `getUserProfileId()` function)
   - `beyti-frontend/src/utils/auth.js`
   - `beyti-frontend/src/utils/authUtils.js`

2. **Registration/Login**
   - `beyti-frontend/src/Beyti-Website/Registration/SellerOnboarding.jsx`
   - `beyti-frontend/src/Beyti-Website/Registration/Login.jsx`

3. **Dashboards**
   - `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`
   - `beyti-frontend/src/Beyti-Website/Driver/DriverDashboard.jsx`

---

## Testing Checklist

- [x] Seller registration creates membership successfully
- [x] Seller login works without errors
- [x] Seller dashboard loads without "Select Store" modal
- [x] Notifications load correctly for sellers
- [x] Driver login works without errors
- [x] Driver dashboard loads without "Select Driver" modal
- [x] Notifications load correctly for drivers
- [x] `getUserProfileId()` function available in both auth utils
- [x] Logout clears `userProfileId` from localStorage

---

## Best Practices Established

### When to Use Which ID

✅ **Use `userId` (GUID) for:**
- Checking authentication status
- Comparing if same user is logged in
- JWT token validation

✅ **Use `userProfileId` (integer) for:**
- All API calls to backend endpoints
- Database queries and relationships
- Notifications, Memberships, Sellers, Drivers, etc.

### Pattern for Auto-Selecting User Profiles

```javascript
useEffect(() => {
  const loadProfile = async () => {
    const currentUserProfileId = getUserProfileId();
    if (!currentUserProfileId) return;

    const { getProfileByUserProfileId } = await import('../../services/api');
    const profileData = await getProfileByUserProfileId(currentUserProfileId);

    if (profileData) {
      // Set state directly
      setProfileId(profileData.id);
      setProfileName(profileData.name);
      setUserProfileId(profileData.userProfileId);
      setSelectModalOpen(false); // Never show modal
    }
  };
  loadProfile();
}, []);
```

---

## Future Considerations

### Potential Issues to Watch

1. **ServiceProvider Dashboard** - May have similar select modal issues
2. **Customer Dashboard** - Check if same pattern is used
3. **Admin Operations** - Verify admin endpoints use correct ID types

### Recommended Next Steps

1. Apply same pattern to ServiceProviderDashboard if it has similar selection logic
2. Create a reusable hook: `useCurrentUserProfile(userType)` to standardize this pattern
3. Consider backend changes to accept either ID type and convert internally
4. Add TypeScript types to clearly distinguish the two ID types

---

## Notes

- The "Select Profile" modals were originally for testing with multiple profiles
- In production, users should only see their own profile
- Dynamic imports used to avoid circular dependencies
- State is set directly rather than through helper functions to avoid scope issues
