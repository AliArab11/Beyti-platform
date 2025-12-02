-- =============================================
-- Migration: Rename Address Columns
-- Date: 2025-12-02
-- Description: Renames Governorate to Region and Block to PostalCode
--              to match the updated C# Entity Framework models
-- =============================================

USE BeytiDB;
GO

PRINT 'Starting Address column rename migration...';
GO

-- =============================================
-- Rename Governorate to Region
-- =============================================
IF EXISTS (SELECT * FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Address')
           AND name = 'Governorate')
BEGIN
    PRINT 'Renaming column: Governorate -> Region';
    EXEC sp_rename 'dbo.Address.Governorate', 'Region', 'COLUMN';
    PRINT 'Successfully renamed Governorate to Region';
END
ELSE
BEGIN
    PRINT 'Column Governorate not found. Checking if Region already exists...';

    IF EXISTS (SELECT * FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Address')
               AND name = 'Region')
    BEGIN
        PRINT 'Region column already exists. No action needed.';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Neither Governorate nor Region column found!';
    END
END
GO

-- =============================================
-- Rename Block to PostalCode
-- =============================================
IF EXISTS (SELECT * FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Address')
           AND name = 'Block')
BEGIN
    PRINT 'Renaming column: Block -> PostalCode';
    EXEC sp_rename 'dbo.Address.Block', 'PostalCode', 'COLUMN';
    PRINT 'Successfully renamed Block to PostalCode';
END
ELSE
BEGIN
    PRINT 'Column Block not found. Checking if PostalCode already exists...';

    IF EXISTS (SELECT * FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Address')
               AND name = 'PostalCode')
    BEGIN
        PRINT 'PostalCode column already exists. No action needed.';
    END
    ELSE
    BEGIN
        PRINT 'WARNING: Neither Block nor PostalCode column found!';
    END
END
GO

PRINT 'Migration completed successfully!';
PRINT '-----------------------------------';
PRINT 'Columns renamed:';
PRINT '  - Governorate -> Region';
PRINT '  - Block -> PostalCode';
GO

-- =============================================
-- Verification Query (optional - uncomment to verify)
-- =============================================
-- SELECT
--     COLUMN_NAME,
--     DATA_TYPE,
--     CHARACTER_MAXIMUM_LENGTH,
--     IS_NULLABLE
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'Address'
--     AND COLUMN_NAME IN ('Region', 'PostalCode')
-- ORDER BY ORDINAL_POSITION;
-- GO

-- =============================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================
-- USE BeytiDB;
-- GO
-- EXEC sp_rename 'dbo.Address.Region', 'Governorate', 'COLUMN';
-- EXEC sp_rename 'dbo.Address.PostalCode', 'Block', 'COLUMN';
-- GO
