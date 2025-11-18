-- =============================================
-- Seed Sample Membership Plans
-- Database: Beyti-V1
-- Table: MembershipPlan
-- =============================================

USE [Beyti-V1]
GO

-- Insert 3 Sample Membership Plans
-- Note: Id is auto-generated (IDENTITY column)
-- Note: CreatedAt will use SYSUTCDATETIME() for current UTC time

-- 1. Basic Plan
INSERT INTO [dbo].[MembershipPlan]
    ([Name], [Description], [MonthlyPrice], [DurationDays], [IsActive], [CreatedAt])
VALUES
    ('Basic',
     'Perfect for individuals getting started. Includes essential features and limited listings.',
     9.99,
     30,
     1,
     SYSUTCDATETIME());

-- 2. Professional Plan
INSERT INTO [dbo].[MembershipPlan]
    ([Name], [Description], [MonthlyPrice], [DurationDays], [IsActive], [CreatedAt])
VALUES
    ('Professional',
     'Ideal for growing businesses. More listings, priority support, and advanced features.',
     29.99,
     30,
     1,
     SYSUTCDATETIME());

-- 3. Enterprise Plan
INSERT INTO [dbo].[MembershipPlan]
    ([Name], [Description], [MonthlyPrice], [DurationDays], [IsActive], [CreatedAt])
VALUES
    ('Enterprise',
     'Complete solution for large organizations. Unlimited listings, dedicated support, and premium features.',
     99.99,
     30,
     1,
     SYSUTCDATETIME());

GO

-- Verify the inserted data
SELECT * FROM [dbo].[MembershipPlan]
ORDER BY [MonthlyPrice];

GO
