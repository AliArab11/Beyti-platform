-- Fix Category seed data (without Description column)
USE [BeytiDB]
GO

SET IDENTITY_INSERT [dbo].[Category] ON;
GO

INSERT INTO [dbo].[Category] ([Id], [Name], [IsActive], [CreatedAt])
VALUES
    (1, 'Electronics', 1, '2025-12-23 00:00:00'),
    (2, 'Fashion & Clothing', 1, '2025-12-23 00:00:00'),
    (3, 'Home & Garden', 1, '2025-12-23 00:00:00'),
    (4, 'Sports & Outdoors', 1, '2025-12-23 00:00:00'),
    (5, 'Books & Media', 1, '2025-12-23 00:00:00'),
    (6, 'Food & Beverages', 1, '2025-12-23 00:00:00'),
    (7, 'Beauty & Personal Care', 1, '2025-12-23 00:00:00'),
    (8, 'Toys & Games', 1, '2025-12-23 00:00:00'),
    (9, 'Automotive', 1, '2025-12-23 00:00:00'),
    (10, 'Other', 1, '2025-12-23 00:00:00');
GO

SET IDENTITY_INSERT [dbo].[Category] OFF;
GO

SELECT * FROM [dbo].[Category];
