using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_SignalR;

namespace Beyti_Backend.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(int recipientUserId, int? senderUserId, string type, string title, string body, string? relatedEntityType = null, int? relatedEntityId = null);
        Task SendAnnouncementNotificationsAsync(int announcementId, int adminUserId, string title, string message, List<string> audiences);
    }

    public class NotificationService : INotificationService
    {
        private readonly BeytiContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(BeytiContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task SendNotificationAsync(
            int recipientUserId,
            int? senderUserId,
            string type,
            string title,
            string body,
            string? relatedEntityType = null,
            int? relatedEntityId = null)
        {
            // If senderUserId is provided (admin action), append admin name to body
            string finalBody = body;
            if (senderUserId.HasValue)
            {
                var senderProfile = await _context.UserProfiles.FindAsync(senderUserId.Value);
                if (senderProfile != null && senderProfile.RoleType == "Admin")
                {
                    string adminName = senderProfile.DisplayName ?? "Administrator";
                    // Append admin name after "administrator" in the message
                    finalBody = body.Replace("by an administrator", $"by Administrator {adminName}");
                }
            }

            // Save to database
            var notification = new Notification
            {
                RecipientUserId = recipientUserId,
                SenderUserId = senderUserId,
                Type = type,
                Title = title,
                Body = finalBody,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Send real-time notification via SignalR
            await _hubContext.Clients.Group($"user_{recipientUserId}").SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.RecipientUserId,
                notification.SenderUserId,
                notification.Type,
                notification.Title,
                notification.Body,
                notification.RelatedEntityType,
                notification.RelatedEntityId,
                notification.IsRead,
                notification.CreatedAt
            });
        }

        public async Task SendAnnouncementNotificationsAsync(
            int announcementId,
            int adminUserId,
            string title,
            string message,
            List<string> audiences)
        {
            // 1. Fetch all users matching the audiences
            var recipients = new List<int>();

            foreach (var audience in audiences)
            {
                var users = await _context.UserProfiles
                    .Where(u => u.RoleType == audience && u.Status == "Active")
                    .Select(u => u.Id)
                    .ToListAsync();
                recipients.AddRange(users);
            }

            // Remove duplicates in case a user belongs to multiple selected audiences
            recipients = recipients.Distinct().ToList();

            // 2. Create notification for each recipient
            var notifications = recipients.Select(recipientId => new Notification
            {
                RecipientUserId = recipientId,
                SenderUserId = adminUserId,
                Type = "Announcement",
                Title = title,
                Body = message,
                RelatedEntityType = "Announcement",
                RelatedEntityId = announcementId,
                IsRead = false,
                IsDeleted = false,
                CreatedAt = DateTime.Now
            }).ToList();

            // 3. Bulk insert notifications
            await _context.Notifications.AddRangeAsync(notifications);
            await _context.SaveChangesAsync();

            // 4. Send real-time notifications via SignalR
            foreach (var notification in notifications)
            {
                await _hubContext.Clients.Group($"user_{notification.RecipientUserId}")
                    .SendAsync("ReceiveNotification", new
                    {
                        id = notification.Id,
                        recipientUserId = notification.RecipientUserId,
                        senderUserId = notification.SenderUserId,
                        type = notification.Type,
                        title = notification.Title,
                        body = notification.Body,
                        relatedEntityType = notification.RelatedEntityType,
                        relatedEntityId = notification.RelatedEntityId,
                        isRead = notification.IsRead,
                        createdAt = notification.CreatedAt
                    });
            }
        }
    }
}