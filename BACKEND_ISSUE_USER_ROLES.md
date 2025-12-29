# Backend Issue: User Profile Role Type Not Updated

## Problem Description

When a user completes partner onboarding (Seller, ServiceProvider, or Driver), the backend creates the partner profile but **does not update the UserProfile's `RoleType` field**. This causes the `RoleType` to remain as `'Customer'` even after successful partner registration.

## Impact

- Login API returns `role: 'Customer'` for all users, including partners
- User profile API (`/api/UserProfiles/Profile/{userId}`) returns `RoleType: 'Customer'` for partners
- The user profile response does NOT include partner profile IDs (e.g., `SellerId`, `ServiceProviderId`, `DriverId`)
- Frontend has to implement workarounds to detect and preserve partner roles

## Example

**User**: V seller (email: Vseller@gmail.com)
**Expected**: After completing Seller onboarding, `RoleType` should be `'Seller'`
**Actual**: `RoleType` remains `'Customer'`

### API Response After Seller Onboarding:
```json
{
  "UserProfileId": 3027,
  "DisplayName": "V seller",
  "RoleType": "Customer",  // ❌ Should be "Seller"
  "Status": "Active",
  "CreatedAt": "2025-12-02T23:31:27.076"
  // Missing: SellerId field
}
```

## Root Cause

The registration flow:
1. **Register** (`/api/Auth/register`) creates:
   - Identity (ASP.NET Identity user)
   - UserProfile with `RoleType='Customer'`
   - Customer profile

2. **Onboarding** creates partner profile but:
   - Creates Seller/ServiceProvider/Driver record
   - Links to UserProfile via `UserProfileId`
   - **❌ Does NOT update UserProfile.RoleType**
   - **❌ Does NOT link partner ID back to UserProfile**

## Required Backend Fixes

### Fix 1: Update RoleType on Partner Creation

When a partner profile is created (Seller, ServiceProvider, Driver), update the associated UserProfile's `RoleType`:

**Endpoints to Update:**
- `POST /api/Sellers` → Set `UserProfile.RoleType = 'Seller'`
- `POST /api/ServiceProviders` → Set `UserProfile.RoleType = 'ServiceProvider'`
- `POST /api/Drivers` → Set `UserProfile.RoleType = 'Driver'`

**Example Implementation (C#):**
```csharp
// In SellerController.cs or equivalent
[HttpPost]
public async Task<IActionResult> CreateSeller([FromBody] SellerDto sellerDto)
{
    // Create seller record
    var seller = new Seller
    {
        UserProfileId = sellerDto.UserProfileId,
        StoreName = sellerDto.StoreName,
        // ... other fields
    };

    await _context.Sellers.AddAsync(seller);
    await _context.SaveChangesAsync();

    // ✅ UPDATE: Set UserProfile RoleType
    var userProfile = await _context.UserProfiles
        .FindAsync(sellerDto.UserProfileId);

    if (userProfile != null)
    {
        userProfile.RoleType = "Seller";
        await _context.SaveChangesAsync();
    }

    return Ok(seller);
}
```

### Fix 2: Include Partner IDs in UserProfile Response

Update the `/api/UserProfiles/Profile/{userId}` endpoint to include partner profile IDs:

**Expected Response:**
```json
{
  "UserProfileId": 3027,
  "DisplayName": "V seller",
  "RoleType": "Seller",  // ✅ Correct role
  "SellerId": 123,       // ✅ Include partner ID
  "Status": "Active",
  "CreatedAt": "2025-12-02T23:31:27.076",
  "Email": "Vseller@gmail.com",
  "Phone": "+973XXXXXXXX"
}
```

### Fix 3: Update Login Response (Optional)

Consider updating the login API to return the actual role instead of always returning 'Customer':

**Current:**
```json
{
  "token": "...",
  "userId": 3027,
  "role": "Customer"  // ❌ Always Customer
}
```

**Improved:**
```json
{
  "token": "...",
  "userId": 3027,
  "role": "Seller"    // ✅ Actual role
}
```

## Frontend Workarounds (Temporary)

Until the backend is fixed, the frontend implements these workarounds:

### 1. Role Preservation on Login
When a user logs in again (same userId), preserve their partner role from localStorage:

```javascript
// Login.jsx
const previousUserId = localStorage.getItem('userId');
const isDifferentUser = previousUserId && previousUserId !== String(userId);

if (!isDifferentUser && hasPartnerRole) {
  // Keep existing role (Seller/ServiceProvider/Driver)
  console.log('[Login] Preserving existing partner role:', existingRole);
} else {
  // Set role from API (will be 'Customer')
  localStorage.setItem('userRole', apiRole);
}
```

### 2. Partner Profile Detection
Attempt to detect partner type from user profile response:

```javascript
// Check for partner profile IDs in response
if (userProfile.ServiceProviderId || userProfile.serviceProviderId) {
  localStorage.setItem('userRole', 'ServiceProvider');
} else if (userProfile.SellerId || userProfile.sellerId) {
  localStorage.setItem('userRole', 'Seller');
} else if (userProfile.DriverId || userProfile.driverId) {
  localStorage.setItem('userRole', 'Driver');
}
```

**Note**: This workaround doesn't work because the backend doesn't include these IDs in the response.

### 3. User Switching Detection
Clear old user data when a different user logs in:

```javascript
const isDifferentUser = previousUserId && previousUserId !== String(userId);
if (isDifferentUser) {
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  // ... clear other data
}
```

## Migration Strategy (If Backend is Fixed)

If the backend is updated to fix `RoleType`, existing users in the database will still have incorrect data. A migration script is needed:

```sql
-- Update Sellers
UPDATE UserProfiles
SET RoleType = 'Seller'
WHERE UserProfileId IN (SELECT DISTINCT UserProfileId FROM Sellers);

-- Update Service Providers
UPDATE UserProfiles
SET RoleType = 'ServiceProvider'
WHERE UserProfileId IN (SELECT DISTINCT UserProfileId FROM ServiceProviders);

-- Update Drivers
UPDATE UserProfiles
SET RoleType = 'Driver'
WHERE UserProfileId IN (SELECT DISTINCT UserProfileId FROM Drivers);
```

## Testing Checklist

After backend fixes are implemented, test:

- [ ] Create new Seller → Verify `RoleType='Seller'` in database
- [ ] Create new ServiceProvider → Verify `RoleType='ServiceProvider'`
- [ ] Create new Driver → Verify `RoleType='Driver'`
- [ ] Login as Seller → Verify API returns `role='Seller'`
- [ ] Get user profile → Verify `RoleType='Seller'` and `SellerId` is included
- [ ] Run migration script → Verify existing users are updated
- [ ] Login as migrated user → Verify correct role is returned

## Priority

**HIGH** - This affects all partner users and requires frontend workarounds that may fail in edge cases (e.g., different browser, cleared cache).

## Related Files

### Backend (Assumed):
- `Controllers/SellersController.cs`
- `Controllers/ServiceProvidersController.cs`
- `Controllers/DriversController.cs`
- `Controllers/UserProfilesController.cs`
- `Controllers/AuthController.cs`

### Frontend:
- `src/Beyti-Website/Registration/Login.jsx` (workarounds)
- `src/utils/auth.js` (auth utilities)
- `src/components/DashboardRouter.jsx` (role-based routing)
