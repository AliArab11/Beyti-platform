-- ============================================
-- Beyti Platform - Seed Data SQL Script
-- ============================================
-- Execute this script in your SQL Server database to populate
-- ServiceCategory, Category, and MembershipPlan tables
-- ============================================

USE [BeytiDB]
GO

-- ============================================
-- 1. SERVICE CATEGORIES (13 records)
-- ============================================
SET IDENTITY_INSERT [dbo].[ServiceCategory] ON;
GO

INSERT INTO [dbo].[ServiceCategory] ([Id], [Name], [Description], [IsActive], [CreatedAt])
VALUES
    (1, 'Plumbing', 'Plumbing and pipe installation services', 1, '2025-12-23 00:00:00'),
    (2, 'Electrical', 'Electrical installation and repair services', 1, '2025-12-23 00:00:00'),
    (3, 'Carpentry', 'Woodwork and furniture services', 1, '2025-12-23 00:00:00'),
    (4, 'Painting', 'Interior and exterior painting services', 1, '2025-12-23 00:00:00'),
    (5, 'Cleaning', 'Professional cleaning services', 1, '2025-12-23 00:00:00'),
    (6, 'Tutoring', 'Educational tutoring services', 1, '2025-12-23 00:00:00'),
    (7, 'Photography', 'Photography and videography services', 1, '2025-12-23 00:00:00'),
    (8, 'Catering', 'Food catering services', 1, '2025-12-23 00:00:00'),
    (9, 'Landscaping', 'Garden and landscape maintenance', 1, '2025-12-23 00:00:00'),
    (10, 'HVAC', 'Heating, ventilation, and air conditioning services', 1, '2025-12-23 00:00:00'),
    (11, 'Pest Control', 'Pest management and extermination services', 1, '2025-12-23 00:00:00'),
    (12, 'Moving Services', 'Relocation and moving assistance', 1, '2025-12-23 00:00:00'),
    (13, 'Other', 'Other professional services', 1, '2025-12-23 00:00:00');
GO

SET IDENTITY_INSERT [dbo].[ServiceCategory] OFF;
GO

-- ============================================
-- 2. PRODUCT CATEGORIES (10 records)
-- ============================================
SET IDENTITY_INSERT [dbo].[Category] ON;
GO

INSERT INTO [dbo].[Category] ([Id], [Name], [Description], [IsActive], [CreatedAt])
VALUES
    (1, 'Electronics', 'Electronic devices and accessories', 1, '2025-12-23 00:00:00'),
    (2, 'Fashion & Clothing', 'Apparel and fashion items', 1, '2025-12-23 00:00:00'),
    (3, 'Home & Garden', 'Home improvement and garden supplies', 1, '2025-12-23 00:00:00'),
    (4, 'Sports & Outdoors', 'Sports equipment and outdoor gear', 1, '2025-12-23 00:00:00'),
    (5, 'Books & Media', 'Books, music, movies, and media', 1, '2025-12-23 00:00:00'),
    (6, 'Food & Beverages', 'Food products and beverages', 1, '2025-12-23 00:00:00'),
    (7, 'Beauty & Personal Care', 'Beauty products and personal care items', 1, '2025-12-23 00:00:00'),
    (8, 'Toys & Games', 'Toys, games, and entertainment', 1, '2025-12-23 00:00:00'),
    (9, 'Automotive', 'Auto parts and accessories', 1, '2025-12-23 00:00:00'),
    (10, 'Other', 'Other products', 1, '2025-12-23 00:00:00');
GO

SET IDENTITY_INSERT [dbo].[Category] OFF;
GO

-- ============================================
-- 3. MEMBERSHIP PLANS (3 records)
-- ============================================
SET IDENTITY_INSERT [dbo].[MembershipPlan] ON;
GO

INSERT INTO [dbo].[MembershipPlan] ([Id], [Name], [Description], [MonthlyPrice], [DurationDays], [IsActive], [CreatedAt])
VALUES
    (1, 'Starter', 'Free tier - Basic listing, up to 10 products, email support', 0.00, 30, 1, '2025-12-23 00:00:00'),
    (2, 'Souq', 'Featured listing, unlimited products, priority support, analytics', 15.00, 30, 1, '2025-12-23 00:00:00'),
    (3, 'Partner', 'Everything in Souq plus account manager, advanced analytics, API access', 35.00, 30, 1, '2025-12-23 00:00:00');
GO

SET IDENTITY_INSERT [dbo].[MembershipPlan] OFF;
GO

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify data was inserted correctly

-- Verify ServiceCategory
SELECT COUNT(*) AS ServiceCategoryCount FROM [dbo].[ServiceCategory] WHERE IsActive = 1;
SELECT * FROM [dbo].[ServiceCategory] ORDER BY Id;

-- Verify Category
SELECT COUNT(*) AS CategoryCount FROM [dbo].[Category] WHERE IsActive = 1;
SELECT * FROM [dbo].[Category] ORDER BY Id;

-- Verify MembershipPlan
SELECT COUNT(*) AS MembershipPlanCount FROM [dbo].[MembershipPlan] WHERE IsActive = 1;
SELECT * FROM [dbo].[MembershipPlan] ORDER BY Id;

GO

PRINT 'Seed data insertion completed successfully!';
PRINT 'ServiceCategories: 13 records';
PRINT 'Categories: 10 records';
PRINT 'MembershipPlans: 3 records';
GO
