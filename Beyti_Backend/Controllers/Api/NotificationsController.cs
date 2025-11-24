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
                .Where(n => n.RecipientUserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/user/5/unread
        [HttpGet("user/{userId}/unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/user/5/unread/count
        [HttpGet("user/{userId}/unread/count")]
        public async Task<ActionResult<int>> GetUnreadCount(int userId)
        {
            var count = await _context.Notifications
                .CountAsync(n => n.RecipientUserId == userId && !n.IsRead);

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
                .Where(n => n.RecipientUserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in notifications)
                n.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Marked {notifications.Count} notifications as read." });
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}