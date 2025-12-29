# Quick Test Checklist - Real-Time Order Notifications

## Before You Start

- [ ] Backend is running (`dotnet run` in Beyti_Backend)
- [ ] Frontend is running (`npm run dev` in beyti-frontend)
- [ ] You have a customer account
- [ ] You have a seller account with products

## Test Procedure

### Step 1: Open Seller Dashboard

1. Open browser with Developer Console (F12)
2. Login and navigate to Seller Dashboard
3. Select a seller from the modal

### Step 2: Record IDs

**In Browser Console, look for and record:**

```
📝 sellerId (Seller entity): _______
📝 sellerUserProfileId: _______
📝 SignalR registered as user_: _______
```

**In Backend Console, look for and record:**

```
📝 RegisterUser: userId=_______
📝 Added to SignalR group: user_______
```

**✅ CHECK:** Do these IDs MATCH?
- Frontend registered as: `user_______`
- Backend registered as: `user_______`

### Step 3: Place Order as Customer

1. Open another browser tab/window (or incognito)
2. Login as customer
3. Add products from the seller's store
4. Complete checkout
5. Click "Confirm Order"

### Step 4: Verify Backend Logs

**Backend Console should show:**

```
[OrdersController] 📤 Sending order created - OrderId: ___, SellerId: ___
[SignalRService] 👤 CustomerId: ___, SellerId: ___
[NotificationHub] 📊 Currently registered users: ___
[NotificationHub]    - User ___: ___ connection(s)
[SignalRService] 📤 Sending OrderReceived to seller group: user___
[SignalRService] ✅ Order notifications sent successfully
```

**Record:**
```
📝 Sending to group: user_______
```

**✅ CHECK:** Does this match the registered ID from Step 2?

### Step 5: Verify Frontend Logs

**Browser Console should show:**

```
[SignalR] Order update: {type: "OrderReceived", data: {...}}
[SellerDashboard] 🔔 Received order update: ...
[SellerDashboard] ✅ Adding new order to list: ...
[SellerDashboard] ✅ Updated orders count: ___ (was ___)
```

### Step 6: Verify Visual Updates

**Seller Dashboard should show:**

- [ ] Green snackbar notification appears
- [ ] Order appears at top of orders table
- [ ] Order row has red background
- [ ] Order has pulsing red dot indicator
- [ ] "Current Requests" metric increased by 1
- [ ] If on Dashboard: "Recent Orders" section updated
- [ ] NO PAGE REFRESH NEEDED!

## Quick Diagnosis

### ✅ SUCCESS
All of the above happened → Real-time orders are working!

### ❌ FAILURE SCENARIO 1: No Frontend Logs
**Backend logs OK, but NO frontend logs**

**Problem:** User ID mismatch OR frontend not listening

**Check:**
1. Do IDs from Step 2 and Step 4 match?
   - Registered as: `user_X`
   - Sent to: `user_Y`
   - If X ≠ Y → **ID MISMATCH BUG**

2. Is `useSignalRNotifications` called?
   ```javascript
   useSignalRNotifications({
     onOrderUpdate: handleOrderUpdate
   });
   ```

### ❌ FAILURE SCENARIO 2: Frontend Logs But No UI Update
**Frontend logs "Adding new order", but UI doesn't update**

**Problem:** State management issue

**Check:**
1. Is Orders component using `externalOrders`?
2. Is orders count increasing in logs?

### ❌ FAILURE SCENARIO 3: No Backend Logs
**Backend doesn't log SignalR messages**

**Problem:** Order creation failed OR SignalR service not called

**Check:**
1. Was order created successfully?
2. Check backend console for exceptions
3. Verify `_signalRService.SendOrderCreatedAsync` is called

## The Most Likely Issue

**🎯 99% of the time, the issue is:**

The seller is registered in SignalR with `UserProfile.Id` (e.g., 5), but the backend sends messages to `Seller.Id` (e.g., 3).

**Solution:**

Verify this code in `OrdersController.cs`:
```csharp
await _signalRService.SendOrderCreatedAsync(
    customerId: customer.UserProfile.Id,
    sellerId: seller.UserProfile.Id,  // ← MUST be UserProfile.Id, NOT seller.Id!
    orderData: completeOrder
);
```

And verify `getSellers()` API returns `userProfileId`:
```csharp
Select(s => new {
    s.Id,
    s.UserProfileId,  // ← MUST be included!
    s.StoreName
})
```

## Emergency Diagnostic

**If nothing works, add this to SellerDashboard.jsx:**

```javascript
useEffect(() => {
  console.log('🔍 DIAGNOSTIC:');
  console.log('   sellerId:', sellerId);
  console.log('   sellerUserProfileId:', sellerUserProfileId);
  console.log('   Equal?', sellerId === sellerUserProfileId);
  console.log('   Will register as: user_' + sellerUserProfileId);
  console.log('   Backend should send to: user_' + sellerUserProfileId);
}, [sellerId, sellerUserProfileId]);
```

## Quick Fix Checklist

If orders aren't showing in real-time:

1. [ ] Verify IDs match (Step 2 = Step 4)
2. [ ] Check `seller.UserProfile.Id` is used in backend
3. [ ] Check `userProfileId` is returned from `getSellers()` API
4. [ ] Verify `useSignalRNotifications` is called with `onOrderUpdate`
5. [ ] Check Orders component uses `externalOrders` prop
6. [ ] Check browser console for errors
7. [ ] Check backend console for exceptions
8. [ ] Verify WebSocket connection (Network tab → WS)

## Files to Check

### Frontend
- `SellerDashboard.jsx` - Lines 545, 593, 650-704, 1703
- `Orders.jsx` - Lines 46, 83-85, 92-111
- `SignalRContext.jsx` - Connection setup
- `useSignalRNotifications.js` - Event registration

### Backend
- `OrdersController.cs` - Lines 452-558 (PostOrder method)
- `SignalRService.cs` - Lines 42-69 (SendOrderCreatedAsync)
- `Class1.cs` - Lines 10-45 (RegisterUser), 157-180 (SendOrderUpdate)
- `SellersController.cs` - GET endpoint (must include UserProfileId)

## Success Output Example

**Backend:**
```
[OrdersController] 📤 Sending order created - OrderId: 123, SellerId: 5
[NotificationHub] 📊 Currently registered users: 2
[NotificationHub]    - User 5: 1 connection(s)  ✅
[SignalRService] 📤 Sending OrderReceived to seller group: user_5  ✅
```

**Frontend:**
```
[SellerDashboard] 🔔 Received order update
[SellerDashboard] ✅ Adding new order to list
[SellerDashboard] ✅ Updated orders count: 15 (was 14)  ✅
```

**Visual:** Green snackbar + Order in table + Red highlight ✅

---

**If you see all ✅ marks above → WORKING!**

**If any ❌ marks → See TROUBLESHOOTING_REALTIME_ORDERS.md**
