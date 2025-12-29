-- Migration: Add Services Table
-- Description: Creates the Service table to store individual services offered by service providers
-- The hierarchy is: ServiceCategory (main) > ServiceCatalog (sub) > Service (individual provider services)

-- Create Service table
CREATE TABLE [dbo].[Service] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [ServiceProviderId] INT NOT NULL,
    [ServiceCatalogId] INT NOT NULL,
    [Name] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [MinPrice] DECIMAL(10, 2) NULL,
    [MaxPrice] DECIMAL(10, 2) NULL,
    [EstimatedDuration] INT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME2(3) NOT NULL DEFAULT (SYSDATETIME()),
    CONSTRAINT [PK_Service] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Service_ServiceProvider] FOREIGN KEY ([ServiceProviderId])
        REFERENCES [dbo].[ServiceProvider] ([Id]),
    CONSTRAINT [FK_Service_ServiceCatalog] FOREIGN KEY ([ServiceCatalogId])
        REFERENCES [dbo].[ServiceCatalog] ([Id])
);
GO

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX [IX_Service_Provider] ON [dbo].[Service] ([ServiceProviderId]);
GO

CREATE NONCLUSTERED INDEX [IX_Service_Catalog] ON [dbo].[Service] ([ServiceCatalogId]);
GO

-- Add ServiceId column to ServiceBooking table (optional, nullable)
ALTER TABLE [dbo].[ServiceBooking]
ADD [ServiceId] INT NULL;
GO

-- Add foreign key constraint
ALTER TABLE [dbo].[ServiceBooking]
ADD CONSTRAINT [FK_ServiceBooking_Service] FOREIGN KEY ([ServiceId])
    REFERENCES [dbo].[Service] ([Id]) ON DELETE SET NULL;
GO

-- Create index
CREATE NONCLUSTERED INDEX [IX_ServiceBooking_Service] ON [dbo].[ServiceBooking] ([ServiceId]);
GO

PRINT 'Services table and related changes have been created successfully!';
GO
