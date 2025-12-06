# Service Provider Activity Logger

## Overview
The Service Provider Activity Logger is a utility system that tracks and displays the last 3 service provider actions in the Service Provider Dashboard's "Recent Activity" section. It provides a professional activity feed that helps service providers see what actions they've recently performed across their dashboard.

## Features
- **Automatic Logging**: Service provider actions are automatically logged when they occur
- **Persistent Storage**: Activities are stored in localStorage and persist across sessions
- **Recent History**: Only the last 3 activities are kept and displayed per provider
- **Professional UI**: Activities are displayed with icons, timestamps, and details
- **Real-time Updates**: The dashboard updates when returning to the overview page
- **Multi-Provider Support**: Each service provider has their own separate activity log

## Activity Types

The logger supports 4 types of activities:

1. **`service`** (Sage) - Creating, updating, activating, or deactivating services
2. **`booking`** (Green) - Sending quotes, confirming, completing, or managing bookings
3. **`schedule`** (Sage) - Adding or removing availability time slots
4. **`profile`** (Sage) - Updating business profile information

## How to Use

### Import the Logger
```javascript
import { logProviderActivity } from '../../../utils/providerActivityLogger';
```

### Log an Activity
```javascript
logProviderActivity(serviceProviderId, type, action, details);
```

**Parameters:**
- `serviceProviderId` (number): The ID of the service provider
- `type` (string): One of 'service', 'booking', 'schedule', 'profile'
- `action` (string): Brief description of the action (e.g., "Created New Service")
- `details` (string, optional): Additional context (e.g., service name, customer name)

## Examples

### Creating a New Service
```javascript
logProviderActivity(
  6, // serviceProviderId
  'service',
  'Created New Service',
  'Service: Home Cleaning'
);
```

### Sending a Quote
```javascript
logProviderActivity(
  6,
  'booking',
  'Sent Quote',
  'Customer: John Doe - 45.00 BHD'
);
```

### Adding Availability
```javascript
logProviderActivity(
  6,
  'schedule',
  'Added Availability',
  'Monday: 09:00 - 17:00'
);
```

### Updating Profile
```javascript
logProviderActivity(
  6,
  'profile',
  'Updated Business Profile',
  'Changed display name to Fresh Produce Co.'
);
```

## Current Integrations

The activity logger is currently integrated into:

1. **ServicesManagement** ([ServicesManagement.jsx](../Beyti-Website/ServiceProvider/components/ServicesManagement.jsx))
   - Logs when services are created
   - Logs when services are updated
   - Logs when services are activated/deactivated

2. **BookingsManagement** ([BookingsManagement.jsx](../Beyti-Website/ServiceProvider/components/BookingsManagement.jsx))
   - Logs when quotes are sent
   - Logs when bookings are confirmed
   - Logs when services are started/completed
   - Logs when bookings are canceled/rejected

3. **ScheduleManagement** ([ScheduleManagement.jsx](../Beyti-Website/ServiceProvider/components/ScheduleManagement.jsx))
   - Logs when availability time slots are added
   - Logs when availability time slots are removed

4. **ServiceProviderDashboard** ([ServiceProviderDashboard.jsx](../Beyti-Website/ServiceProvider/ServiceProviderDashboard.jsx))
   - Logs when business profile is updated

## Adding to New Components

To add activity logging to a new service provider component:

1. Import the logger:
```javascript
import { logProviderActivity } from '../../../utils/providerActivityLogger';
```

2. After successful action, call the logger:
```javascript
const handleAction = async (id) => {
  try {
    await performAction(id);

    // Log the activity
    logProviderActivity(
      serviceProviderId,
      'service', // or 'booking', 'schedule', 'profile'
      'Action Description',
      `Details: ${someValue}`
    );

    alert('Success!');
  } catch (err) {
    console.error(err);
  }
};
```

## Viewing Activities

Activities are automatically displayed in the **Service Provider Dashboard** (Overview page) in the "Recent Activity" card:

- Each activity shows an icon based on its type
- The action description is shown in bold
- Additional details are shown below the action
- A timestamp shows how long ago the action occurred (e.g., "5 minutes ago")

## Storage Details

- **Location**: Browser localStorage
- **Key Format**: `providerRecentActivity_{serviceProviderId}` (separate log per provider)
- **Format**: JSON array of activity objects
- **Limit**: Maximum 3 activities stored per provider
- **Persistence**: Survives page refreshes and browser restarts

## Utility Functions

### `getRecentProviderActivities(serviceProviderId)`
Returns an array of the last 3 activities for a specific provider from localStorage.

```javascript
import { getRecentProviderActivities } from '../../../utils/providerActivityLogger';

const activities = getRecentProviderActivities(6);
console.log(activities);
```

### `clearProviderActivities(serviceProviderId)`
Clears all logged activities for a specific provider from localStorage.

```javascript
import { clearProviderActivities } from '../../../utils/providerActivityLogger';

clearProviderActivities(6);
```

## Best Practices

1. **Only log successful actions** - Don't log failed attempts
2. **Be concise** - Keep action descriptions short and clear
3. **Include context** - Add details like names or values when available
4. **Use appropriate types** - Choose the right activity type for the action
5. **Log immediately after success** - Place logging right after the API call succeeds
6. **Always pass serviceProviderId** - Each provider has their own activity log

## Activity Icon Guide

- **Service actions** - Package icon (Sage background)
- **Booking actions** - Calendar check icon (Green background)
- **Schedule actions** - Calendar icon (Sage background)
- **Profile actions** - User icon (Sage background)

## Comparison with Admin Activity Logger

Unlike the Admin Activity Logger which uses a single storage key for all admin actions, the Service Provider Activity Logger uses provider-specific storage keys (`providerRecentActivity_{serviceProviderId}`) to maintain separate activity logs for each service provider. This ensures that different providers can use the same browser without seeing each other's activities.

## Future Enhancements

Potential improvements to consider:

- [ ] Backend API integration for centralized activity logging
- [ ] Activity history page to view all past actions
- [ ] Filtering by activity type
- [ ] Export activity logs
- [ ] Activity notifications
- [ ] Analytics dashboard showing most common actions
