-- Sample Query: Add notification for user 1031
-- Created: 2025-12-03
-- Description: Inserts a test notification for user 1031

USE BeytiDB;
GO

-- Insert a sample notification for user 1031
INSERT INTO Notification (
    RecipientUserId,
    SenderUserId,
    Type,
    Title,
    Body,
    RelatedEntityType,
    RelatedEntityId,
    IsRead,
    IsDeleted,
    CreatedAt
)
VALUES (
    1031,                                -- RecipientUserId: User who will receive the notification
    NULL,                                -- SenderUserId: NULL for system notifications, or specify a user ID
    'System',                            -- Type: e.g., 'System', 'Order', 'Review', 'Message', 'Approval', etc.
    'Welcome to Beyti Platform',         -- Title: Short notification title
    'Thank you for joining Beyti! Explore our services and start your journey.',  -- Body: Notification message
    NULL,                                -- RelatedEntityType: e.g., 'Order', 'Service', 'Review', etc.
    NULL,                                -- RelatedEntityId: ID of the related entity
    0,                                   -- IsRead: 0 = unread, 1 = read
    0,                                   -- IsDeleted: 0 = not deleted, 1 = deleted (soft delete)
    GETUTCDATE()                         -- CreatedAt: Current UTC timestamp
);
GO

-- Verify the notification was added
SELECT
    Id,
    RecipientUserId,
    SenderUserId,
    Type,
    Title,
    Body,
    RelatedEntityType,
    RelatedEntityId,
    IsRead,
    IsDeleted,
    CreatedAt
FROM Notification
WHERE RecipientUserId = 1031
ORDER BY CreatedAt DESC;
GO
