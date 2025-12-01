# Admin Activity Logger

## Overview
The Admin Activity Logger is a utility system that tracks and displays the last 3 admin actions in the Admin Dashboard's "Recent Activity" section. It provides a professional activity feed that helps admins see what actions they've recently performed.

## Features
- **Automatic Logging**: Admin actions are automatically logged when they occur
- **Persistent Storage**: Activities are stored in localStorage and persist across sessions
- **Recent History**: Only the last 3 activities are kept and displayed
- **Professional UI**: Activities are displayed with icons, timestamps, and details
- **Real-time Updates**: The dashboard updates immediately after actions

## Activity Types

The logger supports 4 types of activities:

1. **`approval`** (Green) - Approving requests, products, or activating users
2. **`user_created`** (Sage) - Creating or updating user accounts
3. **`suspension`** (Red) - Suspending or deactivating users/products
4. **`moderation`** (Sage) - General moderation actions (rejecting, deleting)

## How to Use

### Import the Logger
```javascript
import { logAdminActivity } from '../../../utils/adminActivityLogger';
```

### Log an Activity
```javascript
logAdminActivity(type, action, details);
```

**Parameters:**
- `type` (string): One of 'approval', 'user_created', 'suspension', 'moderation'
- `action` (string): Brief description of the action (e.g., "Approved Product")
- `details` (string, optional): Additional context (e.g., product name, user name)

## Examples

### Approving a Service Provider Request
```javascript
logAdminActivity(
  'approval',
  'Approved Service Provider Request',
  'Business: Fresh Produce Co.'
);
```

### Creating a New User
```javascript
logAdminActivity(
  'user_created',
  'Created New User',
  'John Doe - Seller'
);
```

### Suspending a User
```javascript
logAdminActivity(
  'suspension',
  'Suspended User Account',
  'Store: Bad Actor Store'
);
```

### Moderating a Product
```javascript
logAdminActivity(
  'moderation',
  'Deleted Product',
  'Product: Inappropriate Item'
);
```

## Current Integrations

The activity logger is currently integrated into:

1. **RequestApprovals** ([RequestApprovals.jsx](../Beyti-Website/Admin/components/RequestApprovals.jsx))
   - Logs when service provider requests are approved
   - Logs when service provider requests are rejected

2. **UserManagement** ([UserManagement.jsx](../Beyti-Website/Admin/components/UserManagement.jsx))
   - Logs when new users are created
   - Logs when users are updated
   - Logs when users are activated/deactivated

3. **ProductModeration** ([ProductModeration.jsx](../Beyti-Website/Admin/components/ProductModeration.jsx))
   - Logs when products are approved
   - Logs when products are suspended
   - Logs when products are deleted

## Adding to New Components

To add activity logging to a new admin component:

1. Import the logger:
```javascript
import { logAdminActivity } from '../../../utils/adminActivityLogger';
```

2. After successful admin action, call the logger:
```javascript
const handleApprove = async (id) => {
  try {
    await approveItem(id);

    // Log the activity
    logAdminActivity(
      'approval',
      'Approved Item',
      `Item #${id}`
    );

    alert('Success!');
  } catch (err) {
    console.error(err);
  }
};
```

## Viewing Activities

Activities are automatically displayed in the **Admin Dashboard** in the "Recent Activity" card:

- Each activity shows an icon based on its type
- The action description is shown in bold
- Additional details are shown below the action
- A timestamp shows how long ago the action occurred (e.g., "5 minutes ago")

## Storage Details

- **Location**: Browser localStorage
- **Key**: `adminRecentActivity`
- **Format**: JSON array of activity objects
- **Limit**: Maximum 3 activities stored
- **Persistence**: Survives page refreshes and browser restarts

## Utility Functions

### `getRecentActivities()`
Returns an array of the last 3 activities from localStorage.

```javascript
import { getRecentActivities } from '../../../utils/adminActivityLogger';

const activities = getRecentActivities();
console.log(activities);
```

### `clearAdminActivities()`
Clears all logged activities from localStorage.

```javascript
import { clearAdminActivities } from '../../../utils/adminActivityLogger';

clearAdminActivities();
```

## Best Practices

1. **Only log successful actions** - Don't log failed attempts
2. **Be concise** - Keep action descriptions short and clear
3. **Include context** - Add details like names or IDs when available
4. **Use appropriate types** - Choose the right activity type for the action
5. **Log immediately after success** - Place logging right after the API call succeeds

## Future Enhancements

Potential improvements to consider:

- [ ] Backend API integration for centralized activity logging
- [ ] Activity history page to view all past actions
- [ ] Filtering by activity type
- [ ] Export activity logs
- [ ] Multi-admin support with admin names
- [ ] Activity notifications for team admins
