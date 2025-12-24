# Admin User Setup Guide

## Issue
The Super Admin user was created in the database without an email and password, making it impossible to login through the `/login` page.

## Background
The registration system now properly supports Admin login through the same login page as other user types. The AdminView component has been updated to use dynamic credentials from localStorage instead of hardcoded values.

## Solution: Create an Admin User with Email/Password

You have two options to create an admin user that can log in:

### Option 1: Update Existing Super Admin in Database (Recommended)

Run this SQL query to add email and password to the existing Super Admin:

```sql
-- Update the AspNetUsers table for the Super Admin
UPDATE AspNetUsers
SET
    Email = 'admin@beyti.com',
    NormalizedEmail = 'ADMIN@BEYTI.COM',
    UserName = 'admin@beyti.com',
    NormalizedUserName = 'ADMIN@BEYTI.COM',
    EmailConfirmed = 1,
    PasswordHash = 'AQAAAAIAAYagAAAAEH...' -- Generate this using ASP.NET Identity PasswordHasher
WHERE Id = '<Super Admin User ID>';

-- Make sure the UserProfile is linked correctly
UPDATE UserProfiles
SET
    DisplayName = 'Super Admin',
    RoleType = 'Admin',
    Status = 'Active'
WHERE UserProfileId = 3; -- Adjust ID as needed
```

**To generate a password hash:**
1. Use the ASP.NET Identity PasswordHasher in your backend
2. Or use a C# console app:
```csharp
using Microsoft.AspNetCore.Identity;

var hasher = new PasswordHasher<IdentityUser>();
var hash = hasher.HashPassword(null, "YourPasswordHere");
Console.WriteLine(hash);
```

### Option 2: Create New Admin User via Backend API

Create an endpoint in your backend to register an admin user:

```csharp
[HttpPost("register-admin")]
public async Task<IActionResult> RegisterAdmin([FromBody] RegisterAdminDto dto)
{
    // Only allow this in development or with proper authorization
    if (!_env.IsDevelopment())
    {
        return Forbid();
    }

    var user = new ApplicationUser
    {
        UserName = dto.Email,
        Email = dto.Email,
        EmailConfirmed = true
    };

    var result = await _userManager.CreateAsync(user, dto.Password);

    if (!result.Succeeded)
    {
        return BadRequest(result.Errors);
    }

    // Assign Admin role
    await _userManager.AddToRoleAsync(user, "Admin");

    // Create UserProfile
    var userProfile = new UserProfile
    {
        UserId = user.Id,
        DisplayName = dto.DisplayName,
        RoleType = "Admin",
        Status = "Active",
        CreatedAt = DateTime.UtcNow
    };

    await _context.UserProfiles.AddAsync(userProfile);
    await _context.SaveChangesAsync();

    return Ok(new { userId = user.Id, userProfileId = userProfile.UserProfileId });
}
```

Then call it via Postman or your frontend:

```json
POST /api/Auth/register-admin
{
  "email": "admin@beyti.com",
  "password": "Admin@123",
  "displayName": "Super Admin"
}
```

### Option 3: Use Existing Registration Flow with Role Update

1. Register a new user through `/register` as a Customer
2. Manually update their role in the database:

```sql
-- Get the UserId from AspNetUsers
SELECT Id FROM AspNetUsers WHERE Email = 'youremail@example.com';

-- Update their UserProfile to Admin
UPDATE UserProfiles
SET RoleType = 'Admin'
WHERE UserId = '<UserId from above>';

-- Add them to the Admin role in AspNetUserRoles
INSERT INTO AspNetUserRoles (UserId, RoleId)
VALUES ('<UserId>', (SELECT Id FROM AspNetRoles WHERE Name = 'Admin'));
```

## Testing Admin Login

Once you've created an admin user with email/password:

1. Navigate to `/login`
2. Enter the admin email and password
3. Click "Sign In"
4. You should be redirected to `/dashboard`
5. DashboardRouter will then redirect you to `/admin-view`
6. AdminView should load with your user's data (no hardcoded credentials)

## Verification Checklist

- [ ] Admin user has email in `AspNetUsers` table
- [ ] Admin user has PasswordHash in `AspNetUsers` table
- [ ] UserProfile exists with `RoleType = 'Admin'`
- [ ] User is in the `Admin` role in `AspNetUserRoles` table
- [ ] Can login via `/login` page
- [ ] Redirects to `/admin-view` after login
- [ ] Admin dashboard loads without errors
- [ ] User data shows correctly (not hardcoded)

## Future Improvements

1. **Seed Data**: Add admin user creation to database seed/migration
2. **Setup Wizard**: Create a first-time setup wizard for creating the initial admin
3. **Environment Variables**: Store default admin credentials in environment variables for seeding
4. **Role Management**: Build UI for admins to create other admin users

## Security Notes

⚠️ **Important Security Considerations:**

- Never commit admin credentials to source control
- Use strong passwords for admin accounts
- Consider implementing 2FA for admin users
- Limit admin account creation in production
- Log all admin actions for audit purposes
- Regularly review admin user list

## Contact

If you continue to have issues:
1. Check the backend logs for authentication errors
2. Verify the database schema matches expectations
3. Ensure ASP.NET Identity is configured correctly
4. Check that email confirmation is set to true for admin users
