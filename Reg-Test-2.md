# Testing Plan

## **Testing Plan**

### **5.1. Authentication Testing**

**Test Case 1: Admin Login**

- [ ]  Navigate to `/login`
- [ ]  Enter admin credentials
- [ ]  Verify redirect to `/dashboard`
- [ ]  Verify DashboardRouter redirects to `/admin-view`
- [ ]  Verify AdminView loads with logged admin's data (not hardcoded)

**Test Case 2: Seller Login (Logging out in homePage doesnt clear local storage)**

- [x]  Navigate to `/login`
- [x]  Enter seller credentials
- [x]  Verify redirect to `/seller-dashboard`
- [x]  Verify seller data loads correctly

**Test Case 3: Driver Login**

- [x]  Navigate to `/login`
- [x]  Enter driver credentials
- [x]  Verify redirect to `/driver-dashboard`

**Test Case 4: ServiceProvider Login**

- [x]  Navigate to `/login`
- [x]  Enter service provider credentials
- [x]  Verify redirect to `/serviceprovider-dashboard`
- [x]  Verify account suspension check works

**Test Case 5: Customer Login**

- Error 1: this error appears and customer dashboard shows Service provider name at the top.
    
    ```csharp
    api.js:40 
     GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1002 404 (Not Found)
    
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async handleSubmit (Login.jsx:154:43)
    Login.jsx:155 [Login] ServiceProvider check result: null
    api.js:40 
     GET https://localhost:7062/api/Sellers/Profile/1002 404 (Not Found)
    api.js:80 API Request Failed: Error: Seller not found
        at fetchAPI (api.js:64:21)
        at async getSellerByUserProfileId (api.js:484:12)
        at async handleSubmit (Login.jsx:170:41)
    api.js:486 [API] Error fetching seller profile: Error: Seller not found
        at fetchAPI (api.js:64:21)
        at async getSellerByUserProfileId (api.js:484:12)
        at async handleSubmit (Login.jsx:170:41)
    ```
    
- [x]  Navigate to `/login`
- [x]  Enter customer credentials
- [x]  Verify redirect to `/customer-dashboard` or `/stores` based on implementation

### **5.2. Authorization Testing**

**Test Case 6: Route Protection - Unauthorized Access**

- [x]  Not logged in → Try to access `/admin-view` → Redirect to `/login`
- [x]  Not logged in → Try to access `/seller-dashboard` → Redirect to `/login`
- [ ]  Not logged in → Try to access `/checkout` → Redirect to `/login`

**Test Case 7: Route Protection - Wrong Role**

- [x]  Login as Customer → Try to access `/admin-view` → Redirect to `/dashboard` (customer dashboard)
- [x]  Login as Seller → Try to access `/admin-view` → Redirect to `/seller-dashboard`
- [ ]  Login as Admin → Try to access `/seller-dashboard` → Redirect to `/admin-view`

**Test Case 8: Multi-Role Access**

- [ ]  Login as Admin → Access `/stores` → Should work (browsing allowed)
- [x]  Login as Seller → Access `/stores` → Should work (browsing allowed)
- [x]  Login as Driver → Access `/stores` → Should work (browsing allowed)

### **5.3. Landing Page Testing**

**Test Case 9: Default Landing Page - Not Authenticated**

- [x]  Navigate to `/` → Show HomePage (store view)
- [x]  Browse products → Should work
- [ ]  Try to add to cart → Redirect to `/login` or show login prompt

**Test Case 10: Default Landing Page - Authenticated Customer**

- [x]  Login as Customer
- [x]  Navigate to `/` → Show HomePage with personalized content
- [x]  User info displayed automatically (no customer selection modal)
- [ ]  Can add to cart and checkout

**Test Case 11: Default Landing Page - Authenticated Non-Customer**

- [x]  Login as Admin/Seller/Driver
- [x]  Navigate to `/` → Show HomePage with browse-only banner
- [ ]  Can browse but cannot add to cart or checkout
- [x]  Banner shows "Create Customer Profile" option

### **5.4. Customer Selection Removal Testing**

**Test Case 12: HomePage - Logged User Auto-Display**

- [x]  Login as any user type
- [x]  Navigate to `/stores`
- [x]  Verify NO customer selection modal appears
- [x]  Verify logged user's name displayed in header
- [x]  Verify user info loaded from localStorage (not fetched from API)

**Test Case 13: MainStoreView - Logged User Auto-Display**

- [x]  Login as Customer
- [x]  Navigate to `/mainStore`
- [x]  Verify NO customer selection modal
- [ ]  Verify user's favorites, addresses, cart loaded correctly
- [x]  Verify sessionStorage uses logged user's ID

**Test Case 14: Cart and Orders - Customer Only**

- [ ]  Login as Customer → Can add to cart → Can checkout ✓
- [ ]  Login as Seller → Cannot add to cart → See browse-only message
- [ ]  Login as Admin → Cannot checkout → Prompted to create Customer profile

### **5.5. Logout and Session Testing**

**Test Case 15: Logout Behavior**

- [ ]  Login as any user → Click logout → Redirect to `/login`
- [ ]  Verify localStorage cleared (authToken, userId, userRole, etc.)
- [ ]  Verify sessionStorage cleared (customer data)
- [x]  Try to access protected route → Redirect to `/login`

**Test Case 16: Session Persistence**

- [x]  Login → Refresh page → Still logged in ✓
- [ ]  Login → Close tab → Reopen → Navigate to protected route → Should redirect to login (no session)

Note: After closing tab and reopneing website, session and local storage persist.

### **5.6. Role Detection Testing**

**Test Case 17: Multi-Role Users**

- [x]  User with both Customer and Seller profiles
- [ ]  Login → Verify role detected as Seller (partner role priority)

Note: Tried to “create customer profile” as a seller, it worked, directed to customer dash, but when logging out and signing back in. it froze

- Error
    
    ```csharp
    [Auth] Logging out user
    auth.js:22 [Auth] User data cleared from localStorage
    Login.jsx:67 [Login] API Response: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…50In0.HQoHr2Kmihqo7DmQLcX1Qu268xyXrVe2xQ60TmZ3yE0', userId: '86162778-bc06-4348-bf6d-35e716a1f635', userProfileId: 1014, role: 'Customer'}
    Login.jsx:103 [Login] Setting role from API: Customer
    Login.jsx:110 [Login] User Profile Response: {UserProfileId: 1014, DisplayName: 'GG gMES', RoleType: 'Customer', Status: 'Active', CreatedAt: '2025-12-24T04:54:08.759', …}
    Login.jsx:126 [Login] Checking partner role: Customer
    Login.jsx:132 [Login] Profile shows Customer role
    Login.jsx:145 [Login] No partner profile found in basic profile, checking partner endpoints...
    api.js:40  GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1014 404 (Not Found)
    fetchAPI @ api.js:40
    getProviderProfile @ api.js:1558
    handleSubmit @ Login.jsx:154
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765
    <form>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    Login @ Login.jsx:261
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18509
    renderWithHooksAgain @ react-dom_client.js?v=9f1f53df:5729
    renderWithHooks @ react-dom_client.js?v=9f1f53df:5665
    updateFunctionComponent @ react-dom_client.js?v=9f1f53df:7475
    beginWork @ react-dom_client.js?v=9f1f53df:8525
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    performUnitOfWork @ react-dom_client.js?v=9f1f53df:12561
    workLoopConcurrentByScheduler @ react-dom_client.js?v=9f1f53df:12557
    renderRootConcurrent @ react-dom_client.js?v=9f1f53df:12539
    performWorkOnRoot @ react-dom_client.js?v=9f1f53df:11766
    performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=9f1f53df:13505
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <Login>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    App @ App.jsx:202
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18509
    renderWithHooksAgain @ react-dom_client.js?v=9f1f53df:5729
    renderWithHooks @ react-dom_client.js?v=9f1f53df:5665
    updateFunctionComponent @ react-dom_client.js?v=9f1f53df:7475
    beginWork @ react-dom_client.js?v=9f1f53df:8525
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    performUnitOfWork @ react-dom_client.js?v=9f1f53df:12561
    workLoopSync @ react-dom_client.js?v=9f1f53df:12424
    renderRootSync @ react-dom_client.js?v=9f1f53df:12408
    performWorkOnRoot @ react-dom_client.js?v=9f1f53df:11766
    performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=9f1f53df:13505
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async handleSubmit (Login.jsx:154:43)
    fetchAPI @ api.js:80
    await in fetchAPI
    getProviderProfile @ api.js:1558
    handleSubmit @ Login.jsx:154
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765
    <form>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    Login @ Login.jsx:261
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18509
    renderWithHooksAgain @ react-dom_client.js?v=9f1f53df:5729
    renderWithHooks @ react-dom_client.js?v=9f1f53df:5665
    updateFunctionComponent @ react-dom_client.js?v=9f1f53df:7475
    beginWork @ react-dom_client.js?v=9f1f53df:8525
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    performUnitOfWork @ react-dom_client.js?v=9f1f53df:12561
    workLoopConcurrentByScheduler @ react-dom_client.js?v=9f1f53df:12557
    renderRootConcurrent @ react-dom_client.js?v=9f1f53df:12539
    performWorkOnRoot @ react-dom_client.js?v=9f1f53df:11766
    performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=9f1f53df:13505
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <Login>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    App @ App.jsx:202
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18509
    renderWithHooksAgain @ react-dom_client.js?v=9f1f53df:5729
    renderWithHooks @ react-dom_client.js?v=9f1f53df:5665
    updateFunctionComponent @ react-dom_client.js?v=9f1f53df:7475
    beginWork @ react-dom_client.js?v=9f1f53df:8525
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    performUnitOfWork @ react-dom_client.js?v=9f1f53df:12561
    workLoopSync @ react-dom_client.js?v=9f1f53df:12424
    renderRootSync @ react-dom_client.js?v=9f1f53df:12408
    performWorkOnRoot @ react-dom_client.js?v=9f1f53df:11766
    performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=9f1f53df:13505
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    Login.jsx:155 [Login] ServiceProvider check result: null
    Login.jsx:171 [Login] Seller check result: {sellerId: 3, id: 3, userProfileId: 1014, storeName: 'GG gMES', phone: '12345678', …}
    Login.jsx:173 [Login] ✅ Seller profile found! Updating role to Seller
    ```
    
- [ ]  Access seller dashboard → Works
- [ ]  Access store → Browse-only (unless also has Customer role active)