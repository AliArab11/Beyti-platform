# Real-Time New Order Notification Implementation

## Overview
This document outlines the implementation of real-time order notifications in the SellerDashboard using SignalR. When a customer creates an order, the seller now receives it instantly without needing to refresh the page.

## Implementation Summary

### ✅ What Was Already Working
1. **Backend SignalR Service** - The `SendOrderCreatedAsync` method was already implemented
2. **Frontend SignalR Context** - Connection and event handling infrastructure was in place
3. **Order Status Updates** - Real-time updates for order status changes were working
4. **SellerDashboard State Management** - The `handleOrderUpdate` callback was already set up

### 🔧 Changes Made

#### Frontend Changes

##### 1. SellerDashboard.jsx
**Location:** `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`

**Changes:**
- **Line 1703**: Added `onOrderExpired={handleOrderExpired}` prop to the Orders component
- **Lines 650-704**: Enhanced `handleOrderUpdate` callback with improved logging for debugging
  - Added emoji indicators for better log readability
  - Added detailed order information logging
  - Improved duplicate detection logging

**Key Code:**
```javascript
// Enhanced order update handler with better logging
const handleOrderUpdate = React.useCallback((data) => {
  console.log('[SellerDashboard] 🔔 Received order update:', data);
  console.log('[SellerDashboard] 📊 Full data object:', JSON.stringify(data, null, 2));

  if (data.type === 'OrderReceived') {
    const newOrder = data.data || data.order;

    if (newOrder) {
      console.log('[SellerDashboard] ✅ Adding new order to list:', newOrder);
      console.log('[SellerDashboard] 📦 Order details - ID:', newOrder.id, 'Customer:', newOrder.customerName, 'Total:', newOrder.totalAmount);

      setOrders(prev => {
        const exists = prev.some(o => o.id === newOrder.id);
        if (exists) {
          console.log('[SellerDashboard] ⚠️ Order already exists, skipping duplicate');
          return prev;
        }

        const updated = [newOrder, ...prev];
        console.log('[SellerDashboard] ✅ Updated orders count:', updated.length, '(was', prev.length, ')');
        return updated;
      });

      setSnackbar({
        show: true,
        message: `New order #${newOrder.id} received from ${newOrder.customerName || 'customer'}!`,
        type: 'success'
      });
    }
  }
}, [sellerId]);
```

##### 2. Orders.jsx
**Location:** `beyti-frontend/src/Beyti-Website/Seller/Components/Orders.jsx`

**Changes:**
- **Line 46**: Added `onOrderExpired: parentOnOrderExpired` parameter to component props
- **Line 84**: Call `parentOnOrderExpired` when an order expires in the Orders view

**Key Code:**
```javascript
// Component signature with new prop
const Orders = ({
  sellerId,
  sellerName,
  onOpenOrderModal,
  orders: externalOrders,
  onOrderUpdate,
  onOrderExpired: parentOnOrderExpired
}) => {
  // ...

  // Enhanced expiry handler
  if (res.ok) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o))
    );
    if (onOrderUpdate) {
      onOrderUpdate({ id: orderId, status: "Cancelled" });
    }
    if (parentOnOrderExpired) {
      parentOnOrderExpired(orderId);  // New: propagate to parent
    }
    await restoreStock(orderId);
    console.log('✅ Order auto-cancelled and stock restored');
  }
}
```

#### Backend Changes

##### 1. OrdersController.cs
**Location:** `Beyti_Backend/Controllers/Api/OrdersController.cs`

**Changes:**
- **Lines 478-479**: Enhanced logging when sending order created events
- **Line 558**: Enhanced success logging with order ID

**Key Code:**
```csharp
// Enhanced logging for order creation
Console.WriteLine($"[OrdersController] 📤 Sending order created - OrderId: {order.Id}, CustomerId: {customer.UserProfile.Id}, SellerId: {seller.UserProfile.Id}");
Console.WriteLine($"[OrdersController] 🎯 Sending to seller group: user_{seller.UserProfile.Id}");

// ... order data preparation ...

await _signalRService.SendOrderCreatedAsync(
    customerId: customer.UserProfile.Id,
    sellerId: seller.UserProfile.Id,
    orderData: completeOrder
);

Console.WriteLine($"[OrdersController] ✅ Order created event sent successfully - Order #{order.Id}");
```

##### 2. SignalRService.cs
**Location:** `Beyti_Backend/Services/SignalRService.cs`

**Changes:**
- **Lines 44-65**: Enhanced logging in `SendOrderCreatedAsync` method to track message flow

**Key Code:**
```csharp
public async Task SendOrderCreatedAsync(int customerId, int sellerId, object orderData)
{
    Console.WriteLine($"[SignalRService] 📡 SendOrderCreatedAsync called");
    Console.WriteLine($"[SignalRService] 👤 CustomerId: {customerId}, SellerId: {sellerId}");

    // Notify customer
    Console.WriteLine($"[SignalRService] 📤 Sending OrderCreated to customer group: user_{customerId}");
    await _hubContext.Clients.Group($"user_{customerId}")
        .SendAsync("ReceiveOrderUpdate", new
        {
            type = "OrderCreated",
            data = orderData
        });

    // Notify seller
    Console.WriteLine($"[SignalRService] 📤 Sending OrderReceived to seller group: user_{sellerId}");
    await _hubContext.Clients.Group($"user_{sellerId}")
        .SendAsync("ReceiveOrderUpdate", new
        {
            type = "OrderReceived",
            data = orderData
        });

    Console.WriteLine($"[SignalRService] ✅ Order notifications sent successfully");
}
```

## How It Works

### Flow Diagram
```
Customer places order
        ↓
OrdersController.PostOrder()
        ↓
Creates order in database
        ↓
Fetches complete order data (with items, addresses, etc.)
        ↓
SignalRService.SendOrderCreatedAsync()
        ↓
Sends to SignalR Hub groups:
  - user_{customerId} → "OrderCreated" event
  - user_{sellerId} → "OrderReceived" event
        ↓
Frontend SignalR Context receives event
        ↓
useSignalRNotifications hook triggers
        ↓
SellerDashboard.handleOrderUpdate() called
        ↓
Order added to orders state array
        ↓
Orders component receives updated orders prop
        ↓
UI updates automatically - NEW ORDER APPEARS! 🎉
```

### SignalR Event Structure

**Event Name:** `ReceiveOrderUpdate` (lowercase: `receiveorderupdate` on client)

**Payload for Seller:**
```json
{
  "type": "OrderReceived",
  "data": {
    "id": 123,
    "customerId": 45,
    "sellerId": 67,
    "status": "Placed",
    "totalAmount": 25.500,
    "createdAt": "2025-12-23T10:30:00Z",
    "customerName": "John Doe",
    "sellerName": "Best Store",
    "orderItems": [
      {
        "id": 1,
        "productName": "Product 1",
        "qty": 2,
        "unitPrice": 10.000,
        "lineTotal": 20.000
      }
    ],
    // ... more order details
  }
}
```

## Testing Guide

### Prerequisites
1. Backend server running on `https://localhost:7062`
2. Frontend development server running
3. At least one customer account and one seller account
4. SignalR connection established (check browser console for connection logs)

### Test Steps

#### 1. Verify SignalR Connection
**In Seller Dashboard:**
1. Open browser console (F12)
2. Look for logs like:
   ```
   [SignalR] Connected successfully
   [SignalR] User registered: {sellerId}
   [SellerDashboard] SignalR already connected for sellerUserProfileId: {id}
   ```

#### 2. Test New Order Notification
**Setup:**
1. Open SellerDashboard in one browser window/tab
2. Open CustomerDashboard or Store in another window/tab (or use a different browser)

**Execute:**
1. As customer, add products from the seller's store to cart
2. Complete checkout and place the order
3. Click "Confirm Order"

**Expected Results in Seller Dashboard:**

**Browser Console:**
```
[OrdersController] 📤 Sending order created - OrderId: 123, CustomerId: 45, SellerId: 67
[OrdersController] 🎯 Sending to seller group: user_67
[SignalRService] 📡 SendOrderCreatedAsync called
[SignalRService] 👤 CustomerId: 45, SellerId: 67
[SignalRService] 📤 Sending OrderReceived to seller group: user_67
[SignalRService] ✅ Order notifications sent successfully
[OrdersController] ✅ Order created event sent successfully - Order #123

[SignalR] Order update: {type: "OrderReceived", data: {...}}
[SellerDashboard] 🔔 Received order update: {type: "OrderReceived", data: {...}}
[SellerDashboard] ✅ Adding new order to list: {id: 123, ...}
[SellerDashboard] 📦 Order details - ID: 123 Customer: John Doe Total: 25.500
[SellerDashboard] ✅ Updated orders count: 15 (was 14)
```

**Visual Indicators:**
1. ✅ Green snackbar notification appears: "New order #123 received from John Doe!"
2. ✅ Order appears at the top of the orders table
3. ✅ If on Dashboard view: "Recent Orders" section updates
4. ✅ If on Orders view: New order appears in "Current Requests" tab
5. ✅ Order row is highlighted with red background (new request styling)
6. ✅ Red pulsing dot indicator appears next to order number
7. ✅ "Current Requests" metric increases by 1
8. ✅ If on Dashboard: Alert banner shows "1 New Order Request"

#### 3. Test Multiple Orders
1. Place several orders quickly from customer side
2. Each should appear in real-time on seller side
3. No duplicates should appear
4. All orders should be properly sorted (newest first)

#### 4. Test Order Expiration
1. Place a new order (status: "Placed")
2. Wait 10 minutes without accepting/declining
3. Expected: Order automatically cancels, status updates to "Cancelled"
4. Stock should be restored automatically

### Troubleshooting

#### Issue: Orders not appearing in real-time

**Check 1: SignalR Connection**
```javascript
// In browser console
console.log('[Check] Is connected?', isConnected);
```
- Should be `true`
- If `false`, check backend logs for connection errors

**Check 2: Seller UserProfile ID**
```javascript
// In SellerDashboard, verify this is set
console.log('[Check] sellerUserProfileId:', sellerUserProfileId);
```
- Should be a number (the seller's UserProfile.Id)
- This MUST match the ID used in SignalR group: `user_{id}`

**Check 3: Backend Logs**
Look for the sequence:
```
[OrdersController] 📤 Sending order created...
[SignalRService] 📡 SendOrderCreatedAsync called
[SignalRService] 📤 Sending OrderReceived to seller group: user_{id}
```
- If missing, order creation might have failed
- Check for exceptions in backend

**Check 4: Frontend Event Reception**
```javascript
// Should see this in console when order is placed
[SignalR] Order update: {type: "OrderReceived", ...}
```
- If missing, SignalR event not received
- Check network tab for WebSocket connection

**Check 5: Handler Registration**
```javascript
// Verify handler is registered
// In SellerDashboard, useSignalRNotifications should be called with:
onOrderUpdate: handleOrderUpdate
```

## Architecture Notes

### State Management
- **Orders State:** Managed in SellerDashboard component
- **Prop Drilling:** Orders array passed to Orders component as `externalOrders`
- **Updates:** Orders component uses external orders instead of fetching
- **Synchronization:** SignalR events update parent state, which flows down to child

### Data Flow Pattern
```
Backend (Entity Framework)
    ↓
OrdersController (REST API)
    ↓
SignalRService (Real-time events)
    ↓
SignalR Hub (Message broker)
    ↓
SignalRContext (Frontend connection)
    ↓
useSignalRNotifications (Event handlers)
    ↓
SellerDashboard (State updates)
    ↓
Orders Component (UI rendering)
```

### Key Design Decisions

1. **Why pass orders as prop instead of fetching in Orders component?**
   - Single source of truth in parent (SellerDashboard)
   - Real-time updates managed in one place
   - Prevents duplicate API calls
   - Easier to synchronize across dashboard and orders views

2. **Why use `data.data || data.order`?**
   - Handles different payload structures from backend
   - Defensive programming for edge cases
   - Ensures compatibility if backend changes

3. **Why check for duplicates before adding?**
   - SignalR might deliver messages multiple times
   - Prevents duplicate orders in UI
   - Ensures data consistency

4. **Why enhanced logging?**
   - Easier debugging during development
   - Track message flow through system
   - Identify bottlenecks or failures
   - Can be removed/reduced in production

## Performance Considerations

- **SignalR Connection:** Single persistent WebSocket connection per user
- **Message Size:** Complete order objects sent (~2-5KB per order)
- **UI Updates:** React state updates trigger re-renders only on changed components
- **Memory:** Orders array grows with new orders (pagination recommended for large datasets)

## Future Enhancements

1. **Sound Notification:** Add audio alert when new order arrives
2. **Browser Notifications:** Use Web Notifications API for desktop alerts
3. **Order Filtering:** Real-time filtering without full page refresh
4. **Pagination:** Implement virtual scrolling for large order lists
5. **Order Grouping:** Group orders by status with live counts
6. **Analytics Updates:** Real-time metrics updates (revenue, order count, etc.)
7. **Batch Updates:** Handle multiple simultaneous orders efficiently

## Related Files

### Frontend
- `beyti-frontend/src/Beyti-Website/Seller/SellerDashboard.jsx`
- `beyti-frontend/src/Beyti-Website/Seller/Components/Orders.jsx`
- `beyti-frontend/src/contexts/SignalRContext.jsx`
- `beyti-frontend/src/hooks/useSignalRNotifications.js`

### Backend
- `Beyti_Backend/Controllers/Api/OrdersController.cs`
- `Beyti_Backend/Services/SignalRService.cs`
- `Beyti_Backend/Services/NotificationService.cs`
- `Beyti-SignalR/NotificationHub.cs`

## Support

For issues or questions, check:
1. Browser console logs (frontend debugging)
2. Backend console logs (server-side debugging)
3. Network tab for WebSocket connection status
4. SignalR connection state in React DevTools
