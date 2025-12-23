# SignalR Real-Time Implementation Guide

## Overview
This document outlines the comprehensive SignalR implementation for real-time updates across the Beyti platform. The implementation covers notifications, orders, bookings, products, services, and categories.

## Backend Implementation

### 1. SignalR Hub Infrastructure

#### File: `Beyti-SignalR/Class1.cs`
The `NotificationHub` class provides the central hub for all real-time communications with the following methods:

**Connection Management:**
- `RegisterUser(int userId)` - Registers a user to their personal group
- `UnregisterUser(int userId)` - Removes user from their group
- `OnDisconnectedAsync()` - Cleanup on disconnect

**Real-Time Methods:**
- `SendNotificationToUser()` - Single user notification
- `SendNotificationToUsers()` - Multiple users notification
- `SendOrderUpdate()` - Order update to user
- `SendOrderStatusChange()` - Order status change notification
- `SendBookingUpdate()` - Booking update
- `SendBookingStatusChange()` - Booking status change
- `SendProductUpdate()` - Product update to seller
- `SendCategoryUpdate()` - Category update broadcast
- `SendServiceUpdate()` - Service update
- `SendAnnouncement()` - Announcement to multiple users
- `SendUnreadCountUpdate()` - Update unread notification count

### 2. SignalR Service Layer

#### File: `Beyti_Backend/Services/SignalRService.cs`
Business logic layer for SignalR operations:

**ISignalRService Interface Methods:**

**Orders:**
- `SendOrderCreatedAsync()` - Notifies customer and seller of new order
- `SendOrderStatusChangedAsync()` - Notifies customer, seller, and driver of status changes
- `SendOrderAssignedToDriverAsync()` - Notifies driver of order assignment

**Bookings:**
- `SendBookingCreatedAsync()` - Notifies customer and service provider
- `SendBookingStatusChangedAsync()` - Status change notifications
- `SendQuoteSubmittedAsync()` - Quote submission notification

**Products:**
- `SendProductCreatedAsync()` - New product notification to seller
- `SendProductUpdatedAsync()` - Product update notification
- `SendProductStatusChangedAsync()` - Product status (Active/Inactive) change

**Categories/Services:**
- `SendCategoryUpdatedAsync()` - Broadcast category updates
- `SendServiceCreatedAsync()` - Service creation notification
- `SendServiceUpdatedAsync()` - Service update notification

### 3. Notification Service Enhancement

#### File: `Beyti_Backend/Services/NotificationService.cs`
Enhanced to send real-time notifications via SignalR:

**Updated Methods:**
- `SendNotificationAsync()` - Now sends real-time notifications + updates unread count
- `SendAnnouncementNotificationsAsync()` - Sends real-time announcements to multiple users

### 4. Controller Integration

#### OrdersController (`Beyti_Backend/Controllers/Api/OrdersController.cs`)
- `PostOrder()` - Sends real-time notification when order is created
- `PutOrder()` - Sends status change updates
- `SellerResponseToOrder()` - Notifies customer of seller's response

#### ServiceBookingsController (`Beyti_Backend/Controllers/Api/ServiceBookingsController.cs`)
- `PostServiceBooking()` - Real-time notification on booking creation
- `PutServiceBooking()` - Status change notifications

#### ProductsController (`Beyti_Backend/Controllers/Api/ProductsController.cs`)
- `PostProduct()` - Notifies seller of product creation
- `PutProduct()` - Product update notifications
- `DeleteProduct()` - Status toggle notifications (Active/Inactive)

### 5. Program.cs Configuration

#### File: `Beyti_Backend/Program.cs`
Added SignalR configuration:
```csharp
// Services
builder.Services.AddScoped<ISignalRService, SignalRService>();
builder.Services.AddSignalR();

// Endpoint mapping
app.MapHub<NotificationHub>("/notificationHub");
```

#### File: `Beyti_Backend/Beyti_Backend.csproj`
Added project reference:
```xml
<ProjectReference Include="..\Beyti-SignalR\Beyti-SignalR.csproj" />
```

---

## Frontend Implementation

### 1. SignalR Client Setup

#### Package Installation
```bash
npm install @microsoft/signalr
```

### 2. SignalR Context

#### File: `beyti-frontend/src/contexts/SignalRContext.jsx`
Provides centralized SignalR connection management:

**Features:**
- Automatic connection with exponential backoff retry
- Automatic reconnection on connection loss
- User registration on connection
- Event handler management
- Connection state tracking

**Exported Functions:**
- `useSignalR()` - Hook to access SignalR context
- `SignalRProvider` - Context provider component

**Available Methods:**
- `startConnection(userId)` - Start SignalR connection for user
- `stopConnection()` - Stop connection
- `on(eventName, handler)` - Register event handler
- `off(eventName, handler)` - Unregister event handler
- `invoke(methodName, ...args)` - Invoke hub method

**State:**
- `connection` - SignalR connection instance
- `isConnected` - Connection status
- `connectionError` - Error message if connection fails

### 3. SignalR Notifications Hook

#### File: `beyti-frontend/src/hooks/useSignalRNotifications.js`
Custom hook for handling real-time notifications:

**Parameters:**
- `onNotification` - Handler for new notifications
- `onUnreadCountUpdate` - Handler for unread count updates
- `onOrderUpdate` - Handler for order updates
- `onOrderStatusChange` - Handler for order status changes
- `onBookingUpdate` - Handler for booking updates
- `onBookingStatusChange` - Handler for booking status changes
- `onProductUpdate` - Handler for product updates
- `onCategoryUpdate` - Handler for category updates
- `onServiceUpdate` - Handler for service updates
- `onAnnouncement` - Handler for announcements

**Implementation Details:**
- Uses `useCallback` to stabilize handler functions and prevent unnecessary re-registrations
- Each event type has its own `useEffect` hook to register/unregister independently
- Handlers only register when connection is established and callback is provided
- Prevents re-registration loops that can break SignalR event listening
- **CRITICAL**: Uses lowercase event names (e.g., `receivebookingupdate`) because SignalR JavaScript client automatically converts all event names to lowercase, even though the C# backend sends PascalCase names (e.g., `ReceiveBookingUpdate`)

### 4. App.jsx Integration

#### File: `beyti-frontend/src/App.jsx`
Wrapped application with `SignalRProvider`:
```jsx
<ThemeProvider>
  <SignalRProvider>
    <BrowserRouter>
      {/* App content */}
    </BrowserRouter>
  </SignalRProvider>
</ThemeProvider>
```

### 5. NotificationDropdown Integration

#### File: `beyti-frontend/src/components/NotificationDropdown.jsx`
Enhanced with real-time notification support:

**New Features:**
- Automatically connects to SignalR when userId is available
- Receives real-time notifications and adds them to the list
- Updates unread count in real-time
- No polling required - instant updates

### 6. ServiceProvider BookingsManagement Integration

#### File: `beyti-frontend/src/Beyti-Website/ServiceProvider/components/BookingsManagement.jsx`
Enhanced with real-time booking updates:

**New Features:**
- Receives real-time notifications when new bookings are received
- Updates booking status instantly when customer cancels or provider updates
- Shows snackbar notifications for booking events
- **Optimistic UI updates**: Status changes appear instantly before backend confirmation
- **No race conditions**: Removed redundant `fetchBookings()` calls that conflicted with SignalR updates
- **Automatic rollback**: Reverts optimistic updates if API calls fail
- Accepts `refreshTrigger` prop from parent to trigger external refreshes

### 7. ServiceProvider Dashboard Integration

#### File: `beyti-frontend/src/Beyti-Website/ServiceProvider/ServiceProviderDashboard.jsx`
Parent dashboard component coordinating real-time updates:

**New Features:**
- Establishes SignalR connection on mount
- Listens for booking updates and status changes
- Triggers child component refreshes via `refreshTrigger` prop (not component remounting)
- Shows snackbar notifications ONLY when user is NOT on bookings tab (prevents duplicates)
- Updates activity log when bookings change
- Coordinates between multiple dashboard widgets

### 8. Customer Dashboard Integration

#### File: `beyti-frontend/src/Beyti-Website/Customer/CustomerDashboard.jsx`
Enhanced with real-time booking and order updates:

**New Features:**
- **SignalR Connection**: Automatically establishes connection on mount with userProfileId
- Receives real-time updates when bookings are created
- Updates booking status instantly when provider responds (confirmed, rejected, etc.)
- Receives real-time order status changes from sellers
- Shows appropriate snackbar messages for all status changes
- Updates order list in real-time without page refresh
- Updates "My History" tab in real-time when booking status changes

### 9. ServiceCheckout Component Integration

#### File: `beyti-frontend/src/Beyti-Website/Store/Components/ServiceCheckout.jsx`
Service booking checkout with real-time confirmation modal:

**New Features:**
- **SignalR Connection**: Initializes connection when component mounts
- Passes status change handler to BookingConfirmationModal
- Shows snackbars when booking status changes (accepted, rejected, cancelled)
- Modal auto-closes when provider responds
- Provides immediate feedback without page refresh

### 10. BookingConfirmationModal Integration

#### File: `beyti-frontend/src/components/BookingConfirmationModal.jsx`
Real-time booking confirmation modal:

**New Features:**
- **SignalR Listener**: Listens for status changes specific to the displayed booking
- **Auto-close on status change**: Modal closes automatically when provider accepts, rejects, or when timer expires
- **Callback notification**: Calls parent's `onStatusChange` callback with new status
- Handles all booking statuses: Confirmed, Rejected, Cancelled, InProgress, Completed
- Only processes events for its specific booking ID (prevents cross-booking interference)

---

## Best Practices Implemented

### 1. Optimistic UI Updates
Components update their local state immediately when users take actions, providing instant feedback:
- Status changes appear immediately in the UI
- Backend API call happens asynchronously
- SignalR event confirms the change with authoritative data
- If API call fails, optimistic update is rolled back via `fetchBookings()`

**Example from BookingsManagement.jsx:**
```javascript
const handleStatusChange = async (bookingId, newStatus, additionalData = {}) => {
  // 1. Optimistic update - instant UI feedback
  setBookings(prev => prev.map(b =>
    b.id === bookingId ? { ...b, status: newStatus, ...additionalData } : b
  ));

  try {
    // 2. Backend update
    await updateBookingStatus(bookingId, { status: newStatus, ...additionalData });
    // 3. SignalR will send authoritative update to all connected clients
  } catch (err) {
    // 4. Rollback on error
    await fetchBookings();
  }
};
```

### 2. Avoiding Race Conditions
**Problem:** Mixing `fetchBookings()` calls with SignalR state updates can cause race conditions where stale data overwrites fresh updates.

**Solution:**
- Remove `fetchBookings()` calls after successful API operations
- Let SignalR be the single source of truth for updates
- Only use `fetchBookings()` for error rollback or external refresh triggers

### 3. Preventing Duplicate Snackbars
**Problem:** Both parent and child components listening to SignalR can show duplicate notifications.

**Solution:**
- Parent component checks `activeTab` before showing snackbars
- Only shows notifications when user is NOT on the relevant tab
- Child component always shows its own snackbars since it has more context

### 4. Component Refresh Without Remounting
**Problem:** Using `key` prop to force component remount resets ALL state, causing UI flicker and lost user interactions.

**Solution:**
- Pass `refreshTrigger` as a regular prop
- Child component watches this prop with `useEffect`
- Only triggers data fetch, preserving component state and UI context

---

## SignalR Event Flow

### Notifications
1. Backend: `NotificationService.SendNotificationAsync()` called
2. Backend: Notification saved to database
3. Backend: SignalR sends `ReceiveNotification` event to user's group
4. Backend: SignalR sends `ReceiveUnreadCountUpdate` event
5. Frontend: NotificationDropdown receives events
6. Frontend: UI updates automatically

### Orders
1. Backend: Order created/updated via OrdersController
2. Backend: `SignalRService.SendOrderCreatedAsync()` or `SendOrderStatusChangedAsync()` called
3. Backend: SignalR sends events to customer, seller, and driver (if applicable)
4. Frontend: Components listening for `ReceiveOrderUpdate` or `ReceiveOrderStatusChange` update
5. Frontend: UI reflects changes instantly

### Bookings
1. Backend: Booking created/updated via ServiceBookingsController
2. Backend: `SignalRService.SendBookingCreatedAsync()` or `SendBookingStatusChangedAsync()` called
3. Backend: SignalR sends events to customer and service provider
4. Frontend: Components listening for `ReceiveBookingUpdate` or `ReceiveBookingStatusChange` update
5. Frontend: UI updates automatically

### Products
1. Backend: Product created/updated/status changed via ProductsController
2. Backend: `SignalRService` sends appropriate product event
3. Backend: SignalR sends `ReceiveProductUpdate` to seller
4. Frontend: Product management components receive updates
5. Frontend: Product lists refresh automatically

---

## Connection Management

### Backend Configuration
- **Hub URL:** `https://localhost:7062/notificationHub`
- **CORS:** Configured for `http://localhost:5173` with credentials
- **Transport:** WebSockets with LongPolling fallback
- **Groups:** Users registered to `user_{userId}` groups

### Frontend Configuration
- **Auto-reconnect:** Enabled with exponential backoff (0s, 2s, 10s, 30s, 60s)
- **Logging:** Information level
- **Authentication:** JWT token from localStorage
- **Max Reconnect Attempts:** 5 manual attempts after automatic reconnection fails

---

## Event Reference

### Client Events (Frontend Receives)
**Note:** Event names are lowercase in JavaScript due to SignalR's automatic conversion, even though backend sends PascalCase.

| Event Name (Frontend) | Backend Name | Data | Description |
|----------------------|--------------|------|-------------|
| `receivenotification` | `ReceiveNotification` | `{ id, recipientUserId, senderUserId, type, title, body, relatedEntityType, relatedEntityId, isRead, createdAt }` | New notification |
| `receiveunreadcountupdate` | `ReceiveUnreadCountUpdate` | `number` | Updated unread count |
| `receiveorderupdate` | `ReceiveOrderUpdate` | `{ type, data }` | Order update (created/received) |
| `receiveorderstatuschange` | `ReceiveOrderStatusChange` | `{ orderId, newStatus, order }` | Order status changed |
| `receivebookingupdate` | `ReceiveBookingUpdate` | `{ type, data }` | Booking update |
| `receivebookingstatuschange` | `ReceiveBookingStatusChange` | `{ bookingId, newStatus, booking }` | Booking status changed |
| `receiveproductupdate` | `ReceiveProductUpdate` | `{ type, data }` | Product update |
| `receivecategoryupdate` | `ReceiveCategoryUpdate` | `{ updateType, category }` | Category update |
| `receiveserviceupdate` | `ReceiveServiceUpdate` | `{ type, data }` | Service update |
| `receiveannouncement` | `ReceiveAnnouncement` | `{ announcementId, title, message, audiences }` | System announcement |

### Server Methods (Frontend Calls)
| Method Name | Parameters | Description |
|-------------|------------|-------------|
| `RegisterUser` | `userId: number` | Register user to their notification group |
| `UnregisterUser` | `userId: number` | Unregister user from their group |

---

## Usage Examples

### Frontend: Listening to Order Updates
```javascript
import { useSignalRNotifications } from '../hooks/useSignalRNotifications';

function OrdersPage() {
  useSignalRNotifications({
    onOrderUpdate: (data) => {
      console.log('Order update:', data);
      // Update orders list
      if (data.type === 'OrderCreated') {
        // Handle new order
      } else if (data.type === 'OrderReceived') {
        // Handle received order (seller view)
      }
    },
    onOrderStatusChange: (data) => {
      console.log('Order status changed:', data);
      // Update specific order in list
      updateOrderStatus(data.orderId, data.newStatus);
    }
  });

  // Component logic...
}
```

### Frontend: Listening to Notifications
```javascript
import { useSignalRNotifications } from '../hooks/useSignalRNotifications';

function NotificationComponent({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Note: Event handlers are automatically registered with lowercase event names
  // The hook handles the conversion internally
  useSignalRNotifications({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
    },
    onUnreadCountUpdate: (count) => {
      setUnreadCount(count);
    }
  });

  // Component logic...
}
```

### Backend: Sending Custom Notification
```csharp
// Inject ISignalRService
private readonly ISignalRService _signalRService;

// Send order created notification
await _signalRService.SendOrderCreatedAsync(
    customerId: customer.UserProfile.Id,
    sellerId: seller.UserProfile.Id,
    orderData: new {
        id = order.Id,
        status = order.Status,
        totalAmount = order.TotalAmount
    }
);
```

---

## Testing Checklist

### Backend Testing
- [ ] Verify NotificationHub is accessible at `/notificationHub`
- [ ] Test user registration with `RegisterUser` method
- [ ] Verify CORS allows frontend origin
- [ ] Test notification sending through NotificationService
- [ ] Verify order status changes trigger SignalR events
- [ ] Test booking status changes trigger SignalR events
- [ ] Test product CRUD operations trigger SignalR events

### Frontend Testing
- [ ] Verify SignalR connection establishes on login
- [ ] Test automatic reconnection on connection loss
- [ ] Verify notifications appear in real-time
- [ ] Test unread count updates instantly
- [ ] Verify order updates appear without page refresh
- [ ] Test booking updates appear in real-time
- [ ] Verify multiple browser tabs receive same notifications

---

## Troubleshooting

### Connection Issues
1. **Check CORS configuration** in Program.cs
2. **Verify hub URL** matches backend endpoint
3. **Check JWT token** is valid and present in localStorage
4. **Inspect browser console** for SignalR connection errors
5. **Check backend logs** for connection attempts

### Events Not Received
1. **Verify user is registered** with `RegisterUser`
2. **Check userId** matches between backend and frontend
3. **Inspect event handler registration** in useSignalRNotifications
4. **Verify backend is calling** appropriate SignalRService methods
5. **Check browser console** for event logs
6. **Check for case-sensitivity warnings**: If you see warnings like `No client method with the name 'receivebookingupdate' found`, it means the backend is sending events but the frontend handlers are using the wrong case (see Event Name Case Sensitivity below)

### Event Name Case Sensitivity (FIXED)
**Problem:** Backend sends events with PascalCase names (e.g., `ReceiveBookingUpdate`) but frontend doesn't receive them. Browser console shows warnings like:
```
Warning: No client method with the name 'receivebookingupdate' found.
```

**Root Cause:** SignalR JavaScript client **automatically converts all event names to lowercase** regardless of how you register them. The backend sends `ReceiveBookingUpdate` which becomes `receivebookingupdate` on the client side.

**Solution:**
- Always use lowercase event names in frontend handler registration
- Backend can keep PascalCase (C# convention) - SignalR handles the conversion
- Example: Register as `receivebookingupdate` not `ReceiveBookingUpdate`

**Event Name Mapping:**
| Backend (C#) | Frontend (JS) |
|--------------|---------------|
| `ReceiveNotification` | `receivenotification` |
| `ReceiveBookingUpdate` | `receivebookingupdate` |
| `ReceiveBookingStatusChange` | `receivebookingstatuschange` |
| `ReceiveOrderUpdate` | `receiveorderupdate` |
| `ReceiveOrderStatusChange` | `receiveorderstatuschange` |

### Handler Re-registration Issues (FIXED)
**Problem:** Event handlers constantly re-registering, causing SignalR events to not fire reliably.

**Root Cause:** Handler functions were being recreated on every render, causing `useEffect` dependency arrays to trigger continuously, leading to constant unregister/re-register cycles.

**Solution:**
- Wrap all handler functions in `useCallback` with appropriate dependencies
- Split single `useEffect` into multiple independent `useEffect` hooks (one per event type)
- Each effect only runs when its specific handler changes, not all handlers
- This prevents unnecessary re-registrations and ensures stable event listening

### NullReferenceException on Disconnect
**Fixed:** The `OnDisconnectedAsync` method now uses thread-safe collection handling:
- Collections are copied before iteration to prevent modification errors
- Lock synchronization prevents race conditions
- Empty user lists are cleaned up to prevent memory leaks

### Performance Issues
1. **Limit notification history** to prevent memory issues
2. **Implement pagination** for notification lists
3. **Use debouncing** for frequent updates
4. **Monitor WebSocket connection** stability

---

## Future Enhancements

1. **Typing Indicators** - Show when support is typing
2. **Presence System** - Show online/offline status
3. **Read Receipts** - Track when messages are read
4. **Push Notifications** - Browser push for background notifications
5. **Message History Sync** - Sync missed messages on reconnect
6. **Delivery Confirmation** - Confirm message delivery
7. **Offline Queue** - Queue messages when offline
8. **Connection Quality Indicator** - Show connection strength

---

## Security Considerations

1. **Authentication:** JWT tokens validate user identity
2. **Authorization:** Users only receive updates for their userId
3. **Group Isolation:** Users registered to personal groups only
4. **CORS:** Restricted to allowed origins
5. **Transport Security:** HTTPS/WSS required in production
6. **Input Validation:** All hub method parameters validated

---

## Deployment Notes

### Production Configuration
1. **Update Hub URL** to production domain
2. **Configure SSL/TLS** for WebSocket connections
3. **Update CORS** to production frontend URL
4. **Enable Azure SignalR Service** for scaling (optional)
5. **Set connection logging** to Warning or Error level
6. **Configure sticky sessions** if using multiple servers

### Environment Variables
```env
SIGNALR_HUB_URL=https://api.beyti.com/notificationHub
CORS_ORIGIN=https://www.beyti.com
```

---

## Support

For issues or questions regarding SignalR implementation:
- Check browser console for connection errors
- Review backend logs for hub activity
- Verify CORS and authentication configuration
- Test with SignalR connection diagnostic tools

---

**Last Updated:** December 22, 2024
**Version:** 1.0
**Author:** Claude Sonnet 4.5
