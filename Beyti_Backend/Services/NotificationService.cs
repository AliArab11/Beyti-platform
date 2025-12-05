using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_SignalR;

namespace Beyti_Backend.Services
{
    public interface INotificationService
    {
        Task SendNotificationAsync(int recipientUserId, int? senderUserId, string type, string title, string body, string? relatedEntityType = null, int? relatedEntityId = null);
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
                CreatedAt = DateTime.UtcNow
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
    }
}