-- Migration: Add IsHidden column to ServiceReview table
-- Created: 2025-12-03
-- Description: Adds a boolean column to allow service providers to hide reviews

USE BeytiDB;
GO

-- Add IsHidden column with default value of 0 (false/not hidden)
ALTER TABLE ServiceReview
ADD IsHidden BIT NOT NULL DEFAULT 0;
GO

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ServiceReview' AND COLUMN_NAME = 'IsHidden';
GO
