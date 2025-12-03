-- Migration: Add IsDeleted column to Notification table
-- Created: 2025-12-03
-- Description: Implements soft delete functionality - notifications are marked as deleted but remain in database for audit/reference

USE BeytiDB;
GO

-- Add IsDeleted column with default value of 0 (false/not deleted)
ALTER TABLE Notification
ADD IsDeleted BIT NOT NULL DEFAULT 0;
GO

-- Create index for better query performance on IsDeleted column
CREATE NONCLUSTERED INDEX IX_Notification_IsDeleted
ON Notification(IsDeleted)
INCLUDE (RecipientUserId, IsRead, CreatedAt);
GO

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Notification' AND COLUMN_NAME = 'IsDeleted';
GO

-- Verify the index was created
SELECT
    i.name AS IndexName,
    OBJECT_NAME(i.object_id) AS TableName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName,
    ic.is_included_column AS IsIncluded
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.name = 'IX_Notification_IsDeleted'
ORDER BY ic.key_ordinal;
GO
