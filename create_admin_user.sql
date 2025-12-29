-- ===================================================================
-- BEYTI PLATFORM - ADMIN USER CREATION SCRIPT
-- ===================================================================
-- This script creates an admin user from an existing registered account
-- Follow the instructions in ADMIN-SETUP-INSTRUCTIONS.md
-- ===================================================================

-- IMPORTANT: Make sure you're connected to the Beyti-V1 database
USE [Beyti-V1];
GO

-- Step 1: SET YOUR IDENTITY USER ID
-- Your IdentityUserId: 6bbb4590-4ea1-44c8-8967-9ef8d43ba2aa
DECLARE @UserProfileId INT;
DECLARE @IdentityUserId NVARCHAR(450) = '6bbb4590-4ea1-44c8-8967-9ef8d43ba2aa';

PRINT '========================================';
PRINT 'BEYTI ADMIN USER SETUP';
PRINT '========================================';
PRINT 'IdentityUserId: ' + @IdentityUserId;
PRINT '';

-- ===================================================================
-- Step 2: Get the UserProfile ID
-- ===================================================================
SELECT @UserProfileId = Id
FROM [dbo].[UserProfile]
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
-- Step 3: Update UserProfile to Admin role
-- ===================================================================
UPDATE [dbo].[UserProfile]
SET RoleType = 'Admin',
    Status = 'Active',
    DisplayName = 'System Administrator',
    UpdatedAt = GETDATE()
WHERE Id = @UserProfileId;

PRINT '✓ Updated UserProfile.RoleType to Admin';

-- ===================================================================
-- Step 4: Delete orphaned Customer record (if exists)
-- ===================================================================
DELETE FROM [dbo].[Customer]
WHERE UserProfileId = @UserProfileId;

IF @@ROWCOUNT > 0
    PRINT '✓ Removed Customer record';
ELSE
    PRINT '  (No Customer record to remove)';

-- ===================================================================
-- Step 5: Create AdminProfile record (if table exists)
-- ===================================================================
IF OBJECT_ID('[dbo].[AdminProfile]', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[AdminProfile]
        WHERE UserProfileId = @UserProfileId
    )
    BEGIN
        INSERT INTO [dbo].[AdminProfile] (UserProfileId, Title, Permissions, CreatedAt)
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
-- Step 6: Verify results
-- ===================================================================
PRINT 'Verification:';
PRINT '';

SELECT
    Id AS UserProfileId,
    IdentityUserId,
    DisplayName,
    RoleType,
    Status,
    CreatedAt,
    UpdatedAt
FROM [dbo].[UserProfile]
WHERE Id = @UserProfileId;

PRINT '';
PRINT 'Next Steps:';
PRINT '1. Logout from the application';
PRINT '2. Login with your admin credentials';
PRINT '3. Navigate to /admin to access the admin dashboard';
PRINT '4. Verify you can approve/reject ServiceProvider requests';
PRINT '';
PRINT 'For troubleshooting, see ADMIN-SETUP-INSTRUCTIONS.md';
