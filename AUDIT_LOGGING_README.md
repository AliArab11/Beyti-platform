# Audit Logging System - User Management

## Overview

The Beyti platform now includes a comprehensive audit logging system that tracks all administrative actions related to user management. This ensures accountability, transparency, and compliance with security best practices.

## Features

The audit logging system automatically records the following user management operations:

1. **User Creation** - When a new user account is created
2. **User Updates** - When user profile information is modified (name, status)
3. **User Activation** - When a user account is activated
4. **User Deactivation** - When a user account is deactivated
5. **User Suspension** - When a user account is suspended (with reason)
6. **User Reactivation** - When a suspended user is restored
7. **Role Changes** - When a user's role is changed (creates new user record)

## Backend Implementation

### AuditLogService

**Location:** `Beyti_Backend/Services/AuditLogService.cs`

The `AuditLogService` provides a clean interface for creating audit log entries:

```csharp
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
```

### Service Registration

The service is registered in `Program.cs`:

```csharp
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
```

### Controller Integration

**Location:** `Beyti_Backend/Controllers/Api/AdminDashboardController.cs`

The `AdminDashboardController` has been updated to use the `IAuditLogService`:

```csharp
public class AdminDashboardController : ControllerBase
{
    private readonly BeytiContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditLogService _auditLogService;

    public AdminDashboardController(
        BeytiContext context,
        INotificationService notificationService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLogService = auditLogService;
    }
}
```

## API Endpoints with Audit Logging

### 1. Create User
**Endpoint:** `POST /api/AdminDashboard/Users?adminUserProfileId={id}`

**Logs:**
- Event Type: "User Created"
- Severity: Low
- Description: "Created new user '{displayName}' with role '{roleType}'"

### 2. Update User
**Endpoint:** `PUT /api/AdminDashboard/Users/{id}?adminUserProfileId={id}`

**Logs:**
- Event Type: "User Updated" or "User Role Changed"
- Severity: Low (updates) or High (role changes)
- Description: Detailed list of changes made

### 3. Toggle User Status
**Endpoint:** `PATCH /api/AdminDashboard/Users/{id}/toggle?adminUserProfileId={id}`

**Logs:**
- Event Type: "User Activated" or "User Deactivated"
- Severity: Medium
- Description: Action performed with user name

### 4. Suspend User
**Endpoint:** `PUT /api/AdminDashboard/SuspendUser/{userId}?adminUserProfileId={id}`

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Logs:**
- Event Type: "User Suspended"
- Severity: High
- Description: "Suspended user '{displayName}'. Reason: {reason}"

### 5. Reactivate User
**Endpoint:** `PUT /api/AdminDashboard/ReactivateUser/{userId}?adminUserProfileId={id}`

**Logs:**
- Event Type: "User Reactivated"
- Severity: Medium
- Description: "Reactivated previously suspended user '{displayName}'"

## Frontend Integration

### API Service

**Location:** `beyti-frontend/src/services/api.js`

All user management functions now accept an optional `adminUserProfileId` parameter:

```javascript
// Create user with audit logging
export const createUser = async (data, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users?adminUserProfileId=${adminUserProfileId}`
    : '/AdminDashboard/Users';

  return await fetchAPI(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Update user with audit logging
export const updateUser = async (id, data, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users/${id}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/Users/${id}`;

  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Toggle user status with audit logging
export const toggleUserStatus = async (id, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/Users/${id}/toggle?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/Users/${id}/toggle`;

  return await fetchAPI(url, {
    method: 'PATCH',
  });
};

// Suspend user with audit logging
export const suspendUser = async (userId, reason, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/SuspendUser/${userId}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/SuspendUser/${userId}`;

  return await fetchAPI(url, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
};

// Reactivate user with audit logging
export const reactivateUser = async (userId, adminUserProfileId = null) => {
  const url = adminUserProfileId
    ? `/AdminDashboard/ReactivateUser/${userId}?adminUserProfileId=${adminUserProfileId}`
    : `/AdminDashboard/ReactivateUser/${userId}`;

  return await fetchAPI(url, {
    method: 'PUT',
  });
};
```

### Component Usage Example

```javascript
import { createUser, updateUser, toggleUserStatus } from '../../../services/api';

// Get admin user profile ID from auth context or state
const adminUserProfileId = getCurrentUser().profileId;

// Create a new user
const handleCreateUser = async (userData) => {
  try {
    const newUser = await createUser(userData, adminUserProfileId);
    console.log('User created with audit log:', newUser);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};

// Update a user
const handleUpdateUser = async (userId, userData) => {
  try {
    const updatedUser = await updateUser(userId, userData, adminUserProfileId);
    console.log('User updated with audit log:', updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
  }
};

// Toggle user status
const handleToggleStatus = async (userId) => {
  try {
    const user = await toggleUserStatus(userId, adminUserProfileId);
    console.log('User status toggled with audit log:', user);
  } catch (error) {
    console.error('Failed to toggle user status:', error);
  }
};
```

## Audit Log Data Structure

Each audit log entry contains the following information:

```csharp
public class AuditLog
{
    public int Id { get; set; }                      // Unique identifier
    public int? ActorUserId { get; set; }            // Admin who performed the action
    public string EventType { get; set; }            // Type of event (e.g., "User Created")
    public string? TargetTable { get; set; }         // Table affected (e.g., "UserProfile")
    public int? TargetId { get; set; }               // ID of affected record
    public string? Description { get; set; }         // Detailed description of the action
    public string? Severity { get; set; }            // Low, Medium, High, Critical
    public DateTime CreatedAt { get; set; }          // When the event occurred
    public virtual UserProfile? ActorUser { get; set; } // Navigation property to admin
}
```

### Severity Levels

- **Low**: Routine operations (user creation, profile updates)
- **Medium**: Account status changes (activation, deactivation, reactivation)
- **High**: Security-relevant actions (suspension, role changes)
- **Critical**: Reserved for critical system events

## Viewing Audit Logs

### Frontend Component

**Location:** `beyti-frontend/src/Beyti-Website/Admin/components/AuditLogs.jsx`

The Audit Logs page provides:

- **Statistics Dashboard**: Total logs, today's logs, critical logs, unique actors
- **Filtering**: By event type and severity
- **Search**: Full-text search across event types, descriptions, and tables
- **Detailed View**: Timestamp, event type, actor, target, description, severity

### API Endpoints

```javascript
// Get all audit logs
export const getAuditLogs = async () => {
  return await fetchAPI('/AuditLogs');
};

// Get specific audit log
export const getAuditLog = async (id) => {
  return await fetchAPI(`/AuditLogs/${id}`);
};
```

## Database Schema

The `AuditLogs` table is indexed for optimal performance:

```sql
-- Index on actor for filtering by admin
IX_AuditLogs_Actor (ActorUserId)

-- Index on event type for filtering
IX_AuditLogs_EventType (EventType)

-- Composite index on target table and ID
IX_AuditLogs_Target (TargetTable, TargetId)
```

## Best Practices

1. **Always Pass Admin ID**: Ensure the `adminUserProfileId` is passed for all admin operations
2. **Meaningful Descriptions**: Audit log descriptions should be clear and actionable
3. **Appropriate Severity**: Choose the correct severity level based on the action's impact
4. **Regular Review**: Administrators should regularly review audit logs for anomalies
5. **Retention Policy**: Consider implementing a retention policy for old audit logs

## Security Considerations

1. **Immutability**: Audit logs should not be editable (only viewable)
2. **Access Control**: Only administrators should access audit logs
3. **Comprehensive Coverage**: All user management operations must be logged
4. **No PII in Descriptions**: Avoid logging sensitive personal information in descriptions

## Future Enhancements

Potential improvements to the audit logging system:

1. **Automated Alerts**: Notify admins of suspicious patterns
2. **Export Functionality**: Export audit logs to CSV/PDF for compliance
3. **Advanced Filtering**: Date range, multiple event types, actor filtering
4. **Audit Log Integrity**: Implement checksums or blockchain for tamper-proof logs
5. **Real-time Monitoring**: Live dashboard showing recent admin actions
6. **Compliance Reports**: Generate compliance reports for audits

## Troubleshooting

### Audit Logs Not Being Created

1. Verify `IAuditLogService` is registered in `Program.cs`
2. Ensure `adminUserProfileId` is being passed in API calls
3. Check database connectivity and AuditLogs table exists
4. Review application logs for exceptions in AuditLogService

### Missing Admin Information

If `ActorUserId` is null in audit logs:
- Verify the frontend is correctly retrieving and passing the admin's profile ID
- Check that the admin user exists in the UserProfiles table
- Ensure authentication is working properly

### Performance Issues

If audit logging is slow:
- Verify indexes exist on AuditLogs table
- Consider batch insertion for multiple operations
- Review database query performance
- Implement caching for frequently accessed audit logs

## Support

For questions or issues with the audit logging system, please contact the development team or refer to the main project documentation.

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
