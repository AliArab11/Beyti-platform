using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_Backend.Services;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly INotificationService _notificationService;

        public NotificationsController(BeytiContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/Notifications/user/5
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .AsNoTracking()
                .Where(n => n.RecipientUserId == userId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/user/5/unread
        [HttpGet("user/{userId}/unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .AsNoTracking()
                .Where(n => n.RecipientUserId == userId && !n.IsRead && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/user/5/unread/count
        [HttpGet("user/{userId}/unread/count")]
        public async Task<ActionResult<int>> GetUnreadCount(int userId)
        {
            var count = await _context.Notifications
                .CountAsync(n => n.RecipientUserId == userId && !n.IsRead && !n.IsDeleted);

            return Ok(count);
        }

        // PUT: api/Notifications/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(notification);
        }

        // PUT: api/Notifications/user/5/read-all
        [HttpPut("user/{userId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId && !n.IsRead && !n.IsDeleted)
                .ToListAsync();

            foreach (var n in notifications)
                n.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Marked {notifications.Count} notifications as read." });
        }

        // DELETE: api/Notifications/5
        // Soft delete - marks notification as deleted but keeps it in database
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            // Soft delete: mark as deleted instead of removing from database
            notification.IsDeleted = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Notifications/user/5/sent
        [HttpGet("user/{userId}/sent")]
        public async Task<ActionResult<IEnumerable<object>>> GetSentNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .AsNoTracking()
                .Include(n => n.RecipientUser)
                .Where(n => n.SenderUserId == userId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.RecipientUserId,
                    RecipientName = n.RecipientUser.DisplayName,
                    n.SenderUserId,
                    n.Type,
                    n.Title,
                    n.Body,
                    n.RelatedEntityType,
                    n.RelatedEntityId,
                    n.IsRead,
                    n.IsDeleted,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }
    }
}