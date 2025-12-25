# Admin User Setup Instructions

## Overview

This guide walks you through creating an admin user for the Beyti platform using **Option 3** (Manual SQL Approach). This is the recommended method for development environments.

---

## Prerequisites

- ✅ Access to the database (SQL Server Management Studio or Azure Data Studio)
- ✅ Application running on `https://localhost:7062`
- ✅ Basic understanding of SQL

---

## Setup Process

### Step 1: Register via Application

1. Open your browser and navigate to `https://localhost:7062/register`
2. Fill in the registration form:
   - **Email:** `admin@beyti.com` (or your preferred admin email)
   - **Password:** Choose a **strong** password (e.g., `Admin@SecurePass123`)
   - **Display Name:** `System Administrator`
   - **Phone:** Your phone number
3. Click **Sign Up**
4. Complete registration (this creates a Customer account initially)
5. **Important:** Remember the email and password you used!

### Step 2: Run the SQL Script

1. Open **SQL Server Management Studio** or **Azure Data Studio**
2. Connect to your **BeytiDB** database
3. Open the file [`create_admin_user.sql`](create_admin_user.sql)
4. **IMPORTANT:** Update line 8 with your registered email:
   ```sql
   DECLARE @AdminEmail NVARCHAR(256) = 'admin@beyti.com';  -- ← Change this!
   ```
5. Click **Execute** (or press F5)
6. Review the output - you should see:
   ```
   ========================================
   BEYTI ADMIN USER SETUP
   ========================================
   Admin Email: admin@beyti.com

   ✓ Found AspNetUsers Id: ...
   ✓ Found UserProfile Id: ...
   ✓ Updated UserProfile.RoleType to Admin
   ✓ Assigned Admin role to user
   ...
   ========================================
   ADMIN USER SETUP COMPLETE!
   ========================================
   ```

### Step 3: Verify Admin Access

1. **Logout** from the application (if currently logged in)
2. Navigate to `https://localhost:7062/login`
3. Login with your admin credentials:
   - **Email:** `admin@beyti.com` (the email you registered with)
   - **Password:** Your chosen password
4. After login, check `localStorage.userRole` in browser console:
   ```javascript
   localStorage.getItem('userRole')  // Should return: "Admin"
   ```
5. Navigate to `/admin` - you should see the Admin Dashboard
6. Verify you can access:
   - **Request Approvals** tab (ServiceProvider applications)
   - **User Management**
   - **Statistics**

---

## What the Script Does

The `create_admin_user.sql` script performs the following operations:

| Step | Action | Purpose |
|------|--------|---------|
| 1 | Finds `IdentityUserId` from `AspNetUsers` by email | Locates your registered account |
| 2 | Finds `UserProfileId` from `UserProfile` table | Links to your user profile |
| 3 | Updates `UserProfile.RoleType` to `'Admin'` | Changes role from Customer to Admin |
| 4 | Deletes orphaned `Customer` record | Removes the Customer profile created during registration |
| 5 | Creates `'Admin'` role in `AspNetRoles` (if doesn't exist) | Ensures Admin role exists |
| 6 | Adds user to Admin role in `AspNetUserRoles` | Assigns Admin role to your account |
| 7 | Creates `AdminProfile` record (if table exists) | Creates admin-specific profile with permissions |
| 8 | Displays verification query | Shows your admin account details |

---

## Troubleshooting

### Error: "User not found"

**Cause:** The email in the script doesn't match the registration email.

**Solution:**
1. Check the email you used during registration
2. Update line 8 in `create_admin_user.sql` to match exactly
3. Re-run the script

### Error: "UserProfile not found"

**Cause:** The user was created in `AspNetUsers` but not in `UserProfile`.

**Solution:**
1. Check the database for `AspNetUsers` table:
   ```sql
   SELECT * FROM AspNetUsers WHERE Email = 'admin@beyti.com'
   ```
2. Check `UserProfile` table:
   ```sql
   SELECT * FROM UserProfile WHERE IdentityUserId = '<Id from above>'
   ```
3. If UserProfile doesn't exist, there may be an issue with the registration flow

### Cannot Access Admin Dashboard

**Symptoms:** Login works, but `/admin` route shows errors or redirects.

**Solution:**
1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear();
   ```
2. **Re-login** with admin credentials
3. **Check localStorage values:**
   ```javascript
   console.log({
       userRole: localStorage.getItem('userRole'),
       userProfileId: localStorage.getItem('userProfileId'),
       userId: localStorage.getItem('userId')
   });
   ```
4. If `userRole` is not `'Admin'`, re-run the SQL script

### Admin Dashboard Shows No Data

**Cause:** Database might be empty or admin endpoints have issues.

**Solution:**
1. Check browser console for API errors
2. Verify backend is running on `https://localhost:7062`
3. Test the admin endpoints manually:
   ```bash
   curl -X GET "https://localhost:7062/api/AdminDashboard/ServiceProviderRequests" -k
   ```

---

## Security Best Practices

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

### 1. Strong Passwords
- ✅ Use strong passwords for admin accounts (min 12 characters, mixed case, numbers, symbols)
- ✅ Example: `Admin@SecurePass123!`
- ❌ **Never** use: `admin`, `password`, `123456`

### 2. Credential Management
- ✅ Store admin credentials in a password manager
- ✅ Use environment variables for default credentials in production
- ❌ **Never** commit admin credentials to version control

### 3. Email Domain
- ✅ Consider using a different email domain for admins (e.g., `admin@admin.beyti.com`)
- ✅ This helps distinguish admin accounts from regular users

### 4. Multi-Factor Authentication (Future)
- 📝 Plan to implement 2FA for admin accounts in production
- 📝 Consider using services like Auth0, Okta, or Azure AD B2C

### 5. Audit Logging
- ✅ All admin actions should be logged (already implemented via `AuditLogService`)
- ✅ Regularly review admin activity logs
- ✅ Query admin actions:
  ```sql
  SELECT * FROM AuditLog
  WHERE UserId IN (
      SELECT Id FROM AspNetUsers
      WHERE Email = 'admin@beyti.com'
  )
  ORDER BY CreatedAt DESC;
  ```

### 6. Access Control
- ✅ Limit the number of admin accounts
- ✅ Use role-based permissions (e.g., `Super Admin`, `Moderator`)
- ✅ Regularly review and revoke inactive admin accounts

---

## Testing Your Admin Account

### Test Checklist

- [ ] **Login Test**
  - Navigate to `/login`
  - Enter admin credentials
  - Verify successful login

- [ ] **Role Verification**
  - Check `localStorage.userRole === 'Admin'`
  - Verify no errors in browser console

- [ ] **Dashboard Access**
  - Navigate to `/admin`
  - Verify admin dashboard loads
  - Check for API errors in console

- [ ] **ServiceProvider Approval**
  - Navigate to **Request Approvals** tab
  - Verify you can see pending applications
  - Test **Approve** button on a test application
  - Test **Reject** button with rejection reason

- [ ] **User Management**
  - View all users
  - Filter by role (Admin, Customer, Seller, ServiceProvider, Driver)
  - Test user status updates

- [ ] **Statistics**
  - Verify statistics display correctly
  - Check counts for users, requests, revenue, etc.

---

## Creating Additional Admin Users

To create more admin users, repeat the process:

1. Have the new admin register via `/register`
2. Run `create_admin_user.sql` with their email
3. Verify access

**Alternatively (for experienced users):**

You can create a new admin directly via SQL by modifying the script to insert a new user:

```sql
-- This is advanced - use the registration flow instead for safety
INSERT INTO AspNetUsers (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PasswordHash, ...)
VALUES (NEWID(), 'newemail@admin.com', 'NEWEMAIL@ADMIN.COM', ...);
```

---

## Reverting Admin to Regular User

If you need to demote an admin back to a regular user:

```sql
DECLARE @Email NVARCHAR(256) = 'admin@beyti.com';
DECLARE @UserProfileId INT;
DECLARE @IdentityUserId NVARCHAR(450);

SELECT @IdentityUserId = Id FROM AspNetUsers WHERE Email = @Email;
SELECT @UserProfileId = Id FROM UserProfile WHERE IdentityUserId = @IdentityUserId;

-- Change role back to Customer
UPDATE UserProfile SET RoleType = 'Customer' WHERE Id = @UserProfileId;

-- Remove from Admin role
DELETE FROM AspNetUserRoles
WHERE UserId = @IdentityUserId
  AND RoleId = (SELECT Id FROM AspNetRoles WHERE Name = 'Admin');

-- Delete AdminProfile
DELETE FROM AdminProfile WHERE UserProfileId = @UserProfileId;

-- Create Customer record
INSERT INTO Customer (UserProfileId, CreatedAt, UpdatedAt)
VALUES (@UserProfileId, GETDATE(), GETDATE());
```

---

## Production Deployment Notes

### For Production Environments:

1. **Do NOT use this manual SQL approach**
   - Create a secure admin registration endpoint
   - Require super admin approval for new admin creation
   - Use environment variables for initial seed admin

2. **Implement Proper Authentication**
   - Add OAuth/SAML for enterprise SSO
   - Implement 2FA for all admin accounts
   - Use JWT with short expiration times

3. **Database Security**
   - Restrict SQL Server access to specific IPs
   - Use Azure Key Vault or AWS Secrets Manager for connection strings
   - Enable SQL audit logging

4. **Monitoring**
   - Set up alerts for admin login attempts
   - Log all admin actions to external service (e.g., Splunk, ELK)
   - Monitor for unusual activity patterns

---

## Support

If you encounter issues not covered in this guide:

1. **Check the backend logs** for authentication errors
2. **Verify the database schema** matches expectations
3. **Ensure ASP.NET Identity** is configured correctly
4. **Check that email confirmation** is set to true for admin users

For additional help, contact the development team or open an issue in the repository.

---

## Quick Reference

**Files:**
- [`create_admin_user.sql`](create_admin_user.sql) - SQL script for admin creation
- [`ADMIN-USER-SETUP.md`](ADMIN-USER-SETUP.md) - Alternative guide (older version)

**Key Tables:**
- `AspNetUsers` - Identity user accounts
- `AspNetRoles` - Available roles (Admin, Customer, etc.)
- `AspNetUserRoles` - User-to-role assignments
- `UserProfile` - Application-level user profiles
- `AdminProfile` - Admin-specific settings

**Key Routes:**
- `/register` - User registration
- `/login` - User login
- `/admin` - Admin dashboard
- `/admin-view` - Admin view (alternative route)

**Key localStorage Keys:**
- `authToken` - JWT authentication token
- `userId` - ASP.NET Identity User ID (GUID)
- `userProfileId` - UserProfile table ID (integer)
- `userRole` - User's role (should be `'Admin'`)
- `userEmail` - User's email address

---

**Last Updated:** 2025-12-25
**Version:** 1.0.0
