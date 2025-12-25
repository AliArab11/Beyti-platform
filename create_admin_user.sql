-- ===================================================================
-- BEYTI PLATFORM - ADMIN USER CREATION SCRIPT
-- ===================================================================
-- This script creates an admin user from an existing registered account
-- Follow the instructions in ADMIN-SETUP-INSTRUCTIONS.md
-- ===================================================================

-- Step 1: SET YOUR ADMIN EMAIL
-- Replace 'admin@beyti.com' with the email you used during registration
DECLARE @AdminEmail NVARCHAR(256) = 'admin@beyti.com';
DECLARE @UserProfileId INT;
DECLARE @IdentityUserId NVARCHAR(450);

PRINT '========================================';
PRINT 'BEYTI ADMIN USER SETUP';
PRINT '========================================';
PRINT 'Admin Email: ' + @AdminEmail;
PRINT '';

-- ===================================================================
-- Step 2: Find the IdentityUserId from AspNetUsers
-- ===================================================================
SELECT @IdentityUserId = Id
FROM AspNetUsers
WHERE Email = @AdminEmail;

IF @IdentityUserId IS NULL
BEGIN
    PRINT 'ERROR: User not found with email: ' + @AdminEmail;
    PRINT 'Please register via /register first, then run this script.';
    RETURN;
END

PRINT '✓ Found AspNetUsers Id: ' + @IdentityUserId;

-- ===================================================================
-- Step 3: Get the UserProfile ID
-- ===================================================================
SELECT @UserProfileId = Id
FROM UserProfile
WHERE IdentityUserId = @IdentityUserId;

IF @UserProfileId IS NULL
BEGIN
    PRINT 'ERROR: UserProfile not found for this user.';
    PRINT 'IdentityUserId: ' + @IdentityUserId;
    RETURN;
END

PRINT '✓ Found UserProfile Id: ' + CAST(@UserProfileId AS NVARCHAR(10));
PRINT '';

-- ===================================================================
-- Step 4: Update UserProfile to Admin role
-- ===================================================================
UPDATE UserProfile
SET RoleType = 'Admin',
    Status = 'Active',
    DisplayName = 'System Administrator',
    UpdatedAt = GETDATE()
WHERE Id = @UserProfileId;

PRINT '✓ Updated UserProfile.RoleType to Admin';

-- ===================================================================
-- Step 5: Delete orphaned Customer record (if exists)
-- ===================================================================
DELETE FROM Customer
WHERE UserProfileId = @UserProfileId;

IF @@ROWCOUNT > 0
    PRINT '✓ Removed Customer record';
ELSE
    PRINT '  (No Customer record to remove)';

-- ===================================================================
-- Step 6: Get or Create Admin role
-- ===================================================================
DECLARE @AdminRoleId NVARCHAR(450);

SELECT @AdminRoleId = Id
FROM AspNetRoles
WHERE Name = 'Admin';

IF @AdminRoleId IS NULL
BEGIN
    -- Create Admin role if it doesn't exist
    SET @AdminRoleId = NEWID();
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (@AdminRoleId, 'Admin', 'ADMIN', NEWID());

    PRINT '✓ Created Admin role in AspNetRoles';
END
ELSE
BEGIN
    PRINT '✓ Admin role already exists';
END

-- ===================================================================
-- Step 7: Assign Admin role in AspNetUserRoles
-- ===================================================================
IF NOT EXISTS (
    SELECT 1 FROM AspNetUserRoles
    WHERE UserId = @IdentityUserId AND RoleId = @AdminRoleId
)
BEGIN
    INSERT INTO AspNetUserRoles (UserId, RoleId)
    VALUES (@IdentityUserId, @AdminRoleId);

    PRINT '✓ Assigned Admin role to user';
END
ELSE
BEGIN
    PRINT '  (User already has Admin role)';
END

-- ===================================================================
-- Step 8: Create AdminProfile record (if table exists)
-- ===================================================================
IF OBJECT_ID('AdminProfile', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM AdminProfile
        WHERE UserProfileId = @UserProfileId
    )
    BEGIN
        INSERT INTO AdminProfile (UserProfileId, Title, Permissions, CreatedAt)
        VALUES (
            @UserProfileId,
            'Super Admin',
            'All',
            GETDATE()
        );

        PRINT '✓ Created AdminProfile record';
    END
    ELSE
    BEGIN
        PRINT '  (AdminProfile already exists)';
    END
END
ELSE
BEGIN
    PRINT '  (AdminProfile table does not exist - skipping)';
END

PRINT '';
PRINT '========================================';
PRINT 'ADMIN USER SETUP COMPLETE!';
PRINT '========================================';
PRINT '';

-- ===================================================================
-- Step 9: Verify results
-- ===================================================================
PRINT 'Verification:';
PRINT '';

SELECT
    up.Id AS UserProfileId,
    up.IdentityUserId,
    up.DisplayName,
    up.RoleType,
    up.Status,
    au.Email,
    au.EmailConfirmed,
    r.Name AS AssignedRole
FROM UserProfile up
INNER JOIN AspNetUsers au ON up.IdentityUserId = au.Id
LEFT JOIN AspNetUserRoles aur ON au.Id = aur.UserId
LEFT JOIN AspNetRoles r ON aur.RoleId = r.Id
WHERE up.Id = @UserProfileId;

PRINT '';
PRINT 'Next Steps:';
PRINT '1. Logout from the application';
PRINT '2. Login with your admin credentials: ' + @AdminEmail;
PRINT '3. Navigate to /admin to access the admin dashboard';
PRINT '4. Verify you can approve/reject ServiceProvider requests';
PRINT '';
PRINT 'For troubleshooting, see ADMIN-SETUP-INSTRUCTIONS.md';
