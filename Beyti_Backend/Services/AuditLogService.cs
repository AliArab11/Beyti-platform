using BeytiDB.Data;
using Microsoft.EntityFrameworkCore;

namespace Beyti_Backend.Services
{
    public interface IAuditLogService
    {
        Task LogUserCreatedAsync(int actorUserId, int targetUserId, string displayName, string roleType);
        Task LogUserUpdatedAsync(int actorUserId, int targetUserId, string displayName, string changeDescription);
        Task LogUserActivatedAsync(int actorUserId, int targetUserId, string displayName);
        Task LogUserDeactivatedAsync(int actorUserId, int targetUserId, string displayName);
        Task LogUserSuspendedAsync(int actorUserId, int targetUserId, string displayName, string reason);
        Task LogUserReactivatedAsync(int actorUserId, int targetUserId, string displayName);
        Task LogRoleChangedAsync(int actorUserId, int oldUserId, int newUserId, string oldRole, string newRole);
    }

    public class AuditLogService : IAuditLogService
    {
        private readonly BeytiContext _context;

        public AuditLogService(BeytiContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Log when a new user is created by an admin
        /// </summary>
        public async Task LogUserCreatedAsync(int actorUserId, int targetUserId, string displayName, string roleType)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Created",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Created new user '{displayName}' with role '{roleType}'",
                Severity = "Low",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a user's profile is updated
        /// </summary>
        public async Task LogUserUpdatedAsync(int actorUserId, int targetUserId, string displayName, string changeDescription)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Updated",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Updated user '{displayName}': {changeDescription}",
                Severity = "Low",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a user account is activated
        /// </summary>
        public async Task LogUserActivatedAsync(int actorUserId, int targetUserId, string displayName)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Activated",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Activated user account '{displayName}'",
                Severity = "Medium",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a user account is deactivated
        /// </summary>
        public async Task LogUserDeactivatedAsync(int actorUserId, int targetUserId, string displayName)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Deactivated",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Deactivated user account '{displayName}'",
                Severity = "Medium",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a user account is suspended
        /// </summary>
        public async Task LogUserSuspendedAsync(int actorUserId, int targetUserId, string displayName, string reason)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Suspended",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Suspended user '{displayName}'. Reason: {reason}",
                Severity = "High",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a suspended user is reactivated
        /// </summary>
        public async Task LogUserReactivatedAsync(int actorUserId, int targetUserId, string displayName)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Reactivated",
                TargetTable = "UserProfile",
                TargetId = targetUserId,
                Description = $"Reactivated previously suspended user '{displayName}'",
                Severity = "Medium",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log when a user's role is changed (creates new user record)
        /// </summary>
        public async Task LogRoleChangedAsync(int actorUserId, int oldUserId, int newUserId, string oldRole, string newRole)
        {
            var auditLog = new AuditLog
            {
                ActorUserId = actorUserId,
                EventType = "User Role Changed",
                TargetTable = "UserProfile",
                TargetId = oldUserId,
                Description = $"Changed user role from '{oldRole}' to '{newRole}'. Old user ID: {oldUserId}, New user ID: {newUserId}",
                Severity = "High",
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
    }
}
