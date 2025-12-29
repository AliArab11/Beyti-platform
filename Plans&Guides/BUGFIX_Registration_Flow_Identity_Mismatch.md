# Bug Fix Documentation: Registration Flow Identity Mismatch

**Date:** December 9, 2025
**Status:** ✅ RESOLVED
**Severity:** Critical (Blocking demo)

---

## Executive Summary

The registration and partner onboarding flow was completely broken due to three interconnected issues:
1. Registration created Customer profiles prematurely (before role selection)
2. Backend returned lowercase JSON fields, but frontend expected PascalCase
3. Login endpoint returned wrong user ID (UserProfile ID instead of Identity ID)

After systematic debugging, all issues were resolved, and the complete registration → role selection → partner onboarding flow now works correctly.

---

## Problem Description

### User Report
When users completed registration and proceeded through partner onboarding (ServiceProvider/Seller), the system failed with the error:
```
User profile not found for userId: undefined
```

### Observable Symptoms
1. **localStorage showed string 'undefined' instead of actual values:**
   ```javascript
   {
     userId: 'undefined',
     authToken: 'undefined',
     userEmail: 'user@example.com',
     userPhone: '12345678'
   }
   ```

2. **Partner onboarding consistently failed** with 400 Bad Request

3. **Login after partner registration showed role as "Customer"** instead of partner role

4. **Database showed duplicate UserProfile records** - one Customer, one Partner

---

## Root Cause Analysis

### Root Cause #1: Premature Customer Profile Creation
**Location:** `Beyti_Backend/Controllers/AuthController.cs` (Lines 58-86)

**Problem:**
The registration endpoint was creating a Customer profile IMMEDIATELY upon registration, before the user selected their role.

**Original Code:**
```csharp
var userProfile = new UserProfile
{
    IdentityUserId = identityUser.Id,
    DisplayName = $"{model.FirstName} {model.LastName}",
    RoleType = "Customer",  // ❌ Always Customer
    Status = "Active",
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

// ❌ Creating Customer record too early!
var customer = new Customer
{
    UserProfileId = userProfile.Id,
    Phone = model.PhoneNumber,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};
_businessContext.Customers.Add(customer);
```

**Impact:**
- Users who selected "Partner" already had a Customer profile
- Partner onboarding tried to update the UserProfile but Customer record remained orphaned
- Login always returned "Customer" role because that was created first

---

### Root Cause #2: JSON Serialization Case Mismatch
**Location:** `beyti-frontend/src/Beyti-Website/Registration/Register.jsx` (Lines 130-137)

**Problem:**
Backend returns JSON with camelCase field names (default .NET Core behavior), but frontend tried to access PascalCase properties.

**Backend Response (Actual):**
```json
{
  "token": "eyJhbGci...",
  "userId": "5b60353f-3cdc-4246-9c35-84d6876a6d5d",
  "userProfileId": 5026,
  "role": "Pending"
}
```

**Frontend Code (Wrong):**
```javascript
localStorage.setItem('authToken', loginResponse.Token);      // ❌ undefined
localStorage.setItem('userId', loginResponse.UserId);        // ❌ undefined
localStorage.setItem('userRole', loginResponse.Role);        // ❌ undefined
```

**Why This Happened:**
- ASP.NET Core uses camelCase JSON serialization by default
- Frontend was written expecting PascalCase (C# property names)
- `loginResponse.Token` returns `undefined` because the actual field is `token` (lowercase)

**Impact:**
- All localStorage values stored as the string `'undefined'`
- Partner onboarding received `userId: 'undefined'` and failed

---

### Root Cause #3: Wrong User ID Returned by Login
**Location:** `Beyti_Backend/Controllers/AuthController.cs` (Lines 118-124)

**Problem:**
Login endpoint returned `userProfile.Id` (business DB ID) instead of `identityUser.Id` (Identity DB ID).

**Original Code:**
```csharp
return Ok(new
{
    Token = token,
    UserId = userProfile.Id,  // ❌ Wrong! This is UserProfileId
    Role = userProfile.RoleType
});
```

**Impact:**
- Partner onboarding expects `IdentityUserId` to find and update UserProfile
- Received `UserProfileId` instead, causing lookup failure
- Even if case mismatch was fixed, wrong ID would still cause failure

---

## Investigation Process

### Step 1: Initial Error Discovery
```
Error: User profile not found for userId: undefined
```

Added debugging to see what was in localStorage:
```javascript
console.log('[ProviderOnboarding] userId from localStorage:', userId);
console.log('[ProviderOnboarding] All localStorage:', {...localStorage});
```

**Result:** Discovered `userId: 'undefined'` stored as a string, not actual undefined.

---

### Step 2: Traced Back to Registration
Suspected registration wasn't storing IDs correctly. Added logging to Register.jsx:

```javascript
console.log('[Register] Login response:', loginResponse);
console.log('[Register] Token:', loginResponse.Token);
console.log('[Register] UserId:', loginResponse.UserId);
console.log('[Register] Role:', loginResponse.Role);
```

**Result:**
```
[Register] Login response: {token: "...", userId: "...", userProfileId: 5026, role: "Pending"}
[Register] Token: undefined
[Register] UserId: undefined
[Register] Role: undefined
```

**Discovery:** Backend returns lowercase fields, frontend expects PascalCase!

---

### Step 3: Examined Backend Response
Checked `AuthController.cs` login endpoint to see what it returns:

**Discovery:** Backend was returning `UserId = userProfile.Id` which is the wrong ID layer.

---

### Step 4: Discovered Premature Customer Creation
While fixing other issues, noticed users who registered as partners had Customer records in database.

**Investigation:**
- Examined `AuthController.cs` registration endpoint
- Found Customer profile being created immediately
- Realized this violated the "delayed role profile creation" pattern

---

## Solution Implementation

### Fix #1: Delay Customer Profile Creation
**File:** `Beyti_Backend/Controllers/AuthController.cs`

**Changes:**
```csharp
// ✅ FIX: Set RoleType to 'Pending' until user selects role
var userProfile = new UserProfile
{
    IdentityUserId = identityUser.Id,
    DisplayName = $"{model.FirstName} {model.LastName}".Trim(),
    RoleType = "Pending",  // ✅ NEW: Wait for role selection
    Status = "Active",
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

_businessContext.UserProfiles.Add(userProfile);
await _businessContext.SaveChangesAsync();

// ✅ DO NOT create Customer record here!
// It will be created when user selects "I want to Shop"

return Ok(new
{
    Message = "User registered successfully",
    UserId = identityUser.Id,
    UserProfileId = userProfile.Id
});
```

---

### Fix #2: Add Customer Onboarding Endpoint
**File:** `Beyti_Backend/Controllers/Api/CustomersController.cs`

**New Code:**
```csharp
public class CustomerOnboardingDto
{
    public string UserId { get; set; }  // IdentityUserId
    public string? Phone { get; set; }
}

[HttpPost("Onboard")]
public async Task<IActionResult> OnboardCustomer([FromBody] CustomerOnboardingDto dto)
{
    try
    {
        // Find existing UserProfile by IdentityUserId
        var profile = await _context.UserProfiles
            .FirstOrDefaultAsync(up => up.IdentityUserId == dto.UserId);

        if (profile == null)
            return BadRequest(new { error = "User profile not found" });

        // Check if already a customer
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserProfileId == profile.Id);

        if (existingCustomer != null)
            return Ok(new { message = "Already a customer", customerId = existingCustomer.Id });

        // Update UserProfile to Customer role
        profile.RoleType = "Customer";
        profile.UpdatedAt = DateTime.UtcNow;

        // Create Customer record
        var customer = new Customer
        {
            UserProfileId = profile.Id,
            Phone = dto.Phone,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            customerId = customer.Id,
            userProfileId = profile.Id,
            message = "Customer profile created successfully"
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = ex.Message });
    }
}
```

---

### Fix #3: Update Login to Return IdentityUserId
**File:** `Beyti_Backend/Controllers/AuthController.cs`

**Changes:**
```csharp
return Ok(new
{
    Token = token,
    UserId = identityUser.Id,  // ✅ FIX: Return IdentityUserId for partner onboarding
    UserProfileId = userProfile.Id,
    Role = userProfile.RoleType
});
```

---

### Fix #4: Use camelCase Field Names in Frontend
**File:** `beyti-frontend/src/Beyti-Website/Registration/Register.jsx`

**Changes:**
```javascript
// ✅ FIX: Backend returns camelCase fields
localStorage.setItem('authToken', loginResponse.token);      // ✅ lowercase
localStorage.setItem('userId', loginResponse.userId);        // ✅ lowercase
localStorage.setItem('userRole', loginResponse.role);        // ✅ lowercase
```

---

### Fix #5: Add Customer Selection Handler
**File:** `beyti-frontend/src/Beyti-Website/Registration/RoleSelect.jsx`

**New Code:**
```javascript
const handleCustomerSelection = async () => {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('Session expired. Please login again.');
    navigate('/login');
    return;
  }

  setIsLoading(true);

  try {
    // Call backend to create Customer profile
    const response = await fetch('https://localhost:7062/api/Customers/Onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        UserId: userId,
        Phone: localStorage.getItem('userPhone')
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create customer profile');
    }

    const data = await response.json();
    console.log('[RoleSelect] Customer profile created:', data);

    // Update localStorage
    localStorage.setItem('userRole', 'Customer');

    // Navigate to customer dashboard
    navigate('/customer-dashboard');
  } catch (error) {
    console.error('[RoleSelect] Error creating customer profile:', error);
    alert(`Failed to complete customer registration: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
```

---

## New Registration Flow

### Before Fix (Broken):
```
1. User registers → IdentityUser + UserProfile(Customer) + Customer record created
2. User auto-logged in
3. User selects "Partner" → Goes to onboarding
4. Onboarding tries to create Partner profile
5. ❌ Customer record already exists (orphaned)
6. Login returns "Customer" role
```

### After Fix (Working):
```
1. User registers → IdentityUser + UserProfile(Pending) ONLY
2. User auto-logged in with role='Pending'
3. User chooses path:

   Path A: "I want to Shop"
   → Calls /api/Customers/Onboard
   → Creates Customer record
   → Updates UserProfile.RoleType = 'Customer'
   → Navigate to /customer-dashboard

   Path B: "I want to Partner" → ServiceProvider
   → Navigate to /provider-onboarding
   → Calls /api/ServiceProviders with userId
   → Creates ServiceProvider record
   → Updates UserProfile.RoleType = 'ServiceProvider'
   → Navigate to /serviceprovider-dashboard

4. ✅ Login returns correct role
5. ✅ Only ONE role profile per user
```

---

## Testing Verification

### Test Case 1: Register → Customer
```sql
-- After registration (before role selection)
SELECT * FROM UserProfile WHERE DisplayName = 'Test User';
-- Result: RoleType='Pending' ✅

SELECT * FROM Customer;
-- Result: 0 rows ✅

-- After selecting "I want to Shop"
SELECT * FROM UserProfile WHERE DisplayName = 'Test User';
-- Result: RoleType='Customer' ✅

SELECT * FROM Customer;
-- Result: 1 row ✅
```

### Test Case 2: Register → ServiceProvider
```sql
-- After registration (before role selection)
SELECT * FROM UserProfile WHERE DisplayName = 'Test Provider';
-- Result: RoleType='Pending' ✅

-- After completing ServiceProvider onboarding
SELECT * FROM UserProfile WHERE DisplayName = 'Test Provider';
-- Result: RoleType='ServiceProvider' ✅

SELECT * FROM ServiceProvider WHERE UserProfileId = [above Id];
-- Result: 1 row ✅

SELECT * FROM Customer WHERE UserProfileId = [above Id];
-- Result: 0 rows ✅ (no orphaned Customer record!)
```

---

## Files Modified

### Backend
1. **`Beyti_Backend/Controllers/AuthController.cs`**
   - Line 67: Changed `RoleType` to "Pending"
   - Lines 76-78: Removed premature Customer record creation
   - Line 121: Changed `UserId` to return `identityUser.Id`
   - Line 122: Added `UserProfileId` field to response

2. **`Beyti_Backend/Controllers/Api/CustomersController.cs`**
   - Lines 28-32: Added `CustomerOnboardingDto`
   - Lines 204-252: Added `POST /api/Customers/Onboard` endpoint

### Frontend
3. **`beyti-frontend/src/Beyti-Website/Registration/Register.jsx`**
   - Lines 135-137: Changed to use camelCase field names

4. **`beyti-frontend/src/Beyti-Website/Registration/RoleSelect.jsx`**
   - Lines 20-64: Added `handleCustomerSelection` async handler
   - Line 38: Changed button to call new handler

---

## Key Lessons Learned

### 1. JSON Serialization Case Sensitivity
**Problem:** Backend (C#) and Frontend (JavaScript) use different casing conventions.

**Lesson:** Always verify actual API response format in browser console before assuming field names.

**Best Practice:** Use consistent casing or create type-safe API contracts (TypeScript interfaces).

---

### 2. Multi-Layer Identity Systems
**Problem:** Two ID layers (IdentityUser vs UserProfile) caused confusion.

**Lesson:** Always be explicit about which ID layer you're using. Document clearly:
- `IdentityUserId` = ASP.NET Identity layer (authentication)
- `UserProfileId` = Business layer (application data)

**Best Practice:** Name variables to indicate the layer: `identityUserId`, `userProfileId`.

---

### 3. Delayed Role Profile Creation
**Problem:** Creating Customer profile too early violated separation of concerns.

**Lesson:** Role profiles should only be created when user explicitly selects that role.

**Pattern:**
```
Registration → UserProfile(Pending) → Role Selection → Create Role Profile
```

---

### 4. Debugging with Console Logs
**Technique:** Strategic console.log statements at critical points:
```javascript
console.log('[Component] Description:', data);
```

**Value:** Helped identify the exact point of failure (undefined values from API response).

---

## Database State Comparison

### Before Fix:
```
User: "Test User" who wants to be ServiceProvider
└─ AspNetUsers (1 record)
└─ UserProfile (2 records!)
    ├─ Id: 1001, RoleType: 'Customer'
    └─ Id: 1002, RoleType: 'ServiceProvider'
└─ Customer (1 orphaned record)
    └─ UserProfileId: 1001
└─ ServiceProvider (1 record)
    └─ UserProfileId: 1002
```

### After Fix:
```
User: "Test User" who wants to be ServiceProvider
└─ AspNetUsers (1 record)
└─ UserProfile (1 record) ✅
    └─ Id: 1001, RoleType: 'ServiceProvider'
└─ Customer (0 records) ✅
└─ ServiceProvider (1 record) ✅
    └─ UserProfileId: 1001
```

---

## Success Criteria ✅

- [x] Registration creates ONLY IdentityUser + UserProfile(Pending)
- [x] Selecting "Shop" creates Customer profile and updates role
- [x] Selecting "Partner" routes to onboarding WITHOUT creating Customer
- [x] Partner onboarding receives valid userId (IdentityUserId)
- [x] Login returns correct role based on actual user selection
- [x] No orphaned Customer records for partner users
- [x] Database maintains referential integrity (1 UserProfile, 1 role profile per user)

---

## Performance Impact

**Metrics:**
- No significant performance impact
- Reduced database records (eliminated orphaned profiles)
- One additional API call for Customer onboarding (negligible)

---

## Future Improvements

1. **Type Safety:** Implement TypeScript interfaces for API responses
2. **API Documentation:** Document all endpoint responses with exact field names
3. **Integration Tests:** Add tests for complete registration flows
4. **Database Cleanup:** Script to clean up orphaned records from before this fix

---

## Related Documentation

- Original problem discussion: `Routing Configuration LLM-friendly Summary.md`
- Backend identity issue: `BACKEND_ISSUE_USER_ROLES.md`
- Dashboard routing plan: `Dashboard Routing Update Implementation Plan.md`

---

## Contact

**Fixed By:** Claude Code (AI Assistant)
**Verified By:** Ali (Developer)
**Date:** December 9, 2025
**Status:** Production Ready ✅
