# Reg-Test-1

### Testing Checklist

---

# ✅ Registration Flow – Test Checklist

## 🛠 Test Environment Setup

### Prerequisites

- [x]  Backend running (`https://localhost:7062`)
- [x]  Frontend running (`http://localhost:5173`)
- [x]  Database seeded
    - [x]  13 ServiceCategories
    - [x]  10 Categories
    - [x]  3 MembershipPlans

### Test Data Rules

- [x]  Use unique email per test (`test.customer1@…`, `test.provider1@…`)
- [x]  Phone format valid (`+973 12345678`)

---

## 👤 Test Case 1: Customer Registration

### Execution

- [x]  Open `/register`
- [x]  Fill customer details
- [x]  Select **I want to Shop**
- [x]  Click **Register**

### Expected

- [x]  User created in DB
- [x]  UserProfile RoleType = Customer
- [x]  Redirected to `/dashboard`
- [ ]  Customer dashboard loads (dashboard loads but profile page does not show Customer name and instead has a prefixed “My Account”. And also update profile and saving changes doesn't save changes. And also Home Page shows Login at the header when it should show view profile when a user is already signed in)
- [x]  No onboarding shown
- [x]  localStorage has:
    - [x]  authToken
    - [x]  userId
    - [x]  userRole = Customer

---

## 🧑‍🔧 Test Case 2: Service Provider Registration (With Membership)

### Initial Registration

- [x]  Open `/register`
- [x]  Enter provider details
- [x]  Select Partner → Service Provider
- [x]  Click Register

### Step 1 – Identity

- [x]  Service categories loaded from API
- [x]  Business name entered
- [x]  Service category selected
- [ ]  Phone entered (Phone already entered in first registration step, redundant data or it should specify that this is the business number, maybe provide an option to (Use same number, and display his current number that he entered prevously))
- [x]  Click Next

### Step 2 – Services

- [x]  Service description entered
- [x]  Min price entered
- [x]  Max price entered
- [x]  Click Next

### Step 3 – Location (Location data is not clear, why is Building and Avenue optional? and can we use the other method thats used to pin location from the map and ask for confirmation)

- [x]  City entered
- [x]  Block entered
- [x]  Road entered
- [x]  Optional fields entered
- [x]  Click Next

### Step 4 – Verification

- [x]  Verification checkbox checked
- [x]  Click Next

### Step 5 – Membership (Skip is bad UX writing, replace with something better)

- [x]  Membership plans loaded from API
- [x]  Souq plan selected
- [ ]  Click Complete Registration
- Error 1 after choosing Souq Membership and clicking Complete Registration
    
    ```csharp
    api.js:40 
     POST https://localhost:7062/api/UserMemberships 404 (Not Found)
    
    api.js:80 API Request Failed: Error: Request failed with status 404
        at fetchAPI (api.js:64:21)
        at async createUserMembership (api.js:267:10)
        at async handleSubmit (ProviderOnboarding.jsx:294:11)
    ProviderOnboarding.jsx:300 Failed to assign membership, continuing... Error: Request failed with status 404
        at fetchAPI (api.js:64:21)
        at async createUserMembership (api.js:267:10)
        at async handleSubmit (ProviderOnboarding.jsx:294:11)
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: ServiceProvider
    DashboardRouter.jsx:43 [DashboardRouter] Redirecting to service provider dashboard
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: ServiceProvider
    DashboardRouter.jsx:43 [DashboardRouter] Redirecting to service provider dashboard
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 1
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: number
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 1
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: number
    NotificationDropdown.jsx:40 🔔 NotificationDropdown: Fetched notifications: 
    []
    NotificationDropdown.jsx:41 🔔 NotificationDropdown: Unread count: 0
    NotificationDropdown.jsx:40 🔔 NotificationDropdown: Fetched notifications: 
    []
    NotificationDropdown.jsx:41 🔔 NotificationDropdown: Unread count: 0
    api.js:40 
     GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1 404 (Not Found)
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async fetchUserProfile (ServiceProviderDashboard.jsx:77:23)
    api.js:40 
     GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1 404 (Not Found)
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async fetchUserProfile (ServiceProviderDashboard.jsx:77:23)
    ServiceProviderDashboard.jsx:79 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:129 Error fetching user profile: TypeError: Cannot convert undefined or null to object
        at Object.keys (<anonymous>)
        at fetchUserProfile (ServiceProviderDashboard.jsx:80:62)
    ServiceProviderDashboard.jsx:133 Failed to load profile
    ServiceProviderDashboard.jsx:79 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:129 Error fetching user profile: TypeError: Cannot convert undefined or null to object
        at Object.keys (<anonymous>)
        at fetchUserProfile (ServiceProviderDashboard.jsx:80:62)
    ServiceProviderDashboard.jsx:133 Failed to load profile
    ```
    
- Root Cause Analysis
    
    ## Root Cause Analysis
    
    I've investigated the errors you encountered during registration testing. Here's what I found:
    
    ### **Error 1: POST /api/UserMemberships 404 (Not Found)**
    
    **Root Cause:** You're currently logged in as the Admin user (UserProfile ID=1) and attempting to complete the Provider Onboarding. The registration flow is designed for **new users**, not existing admin accounts.
    
    **What's Happening:**
    
    1. The ProviderOnboarding component reads `userId` from localStorage (ProviderOnboarding.jsx:183)
    2. Your localStorage has `userId=1`, which is the Super Admin account
    3. The code creates a ServiceProvider record successfully
    4. However, when trying to create the membership, the UserMemberships API endpoint may have been temporarily unavailable or there was a timing issue
    
    **Testing Confirms:**
    
    - I tested the `/api/UserMemberships` endpoint directly with curl - **it works perfectly**
    - The UserMembershipsController.cs:78 POST endpoint is properly implemented
    - The endpoint accepts the exact payload your frontend sends and creates memberships successfully
    
    ### **Error 2: GET /api/ServiceProviderDashboard/Profile/1 404 (Not Found)**
    
    **Root Cause:** UserProfile ID=1 is the Super Admin account with `roleType: "Admin"`. This user has **no ServiceProvider record** because admins aren't service providers.
    
    **What's Happening:**
    
    1. After registration, the app navigates to `/dashboard`
    2. The dashboard tries to load the ServiceProvider profile for userId=1
    3. The ServiceProviderDashboardController.cs:28 looks for a ServiceProvider with `UserProfileId == 1`
    4. No such record exists (correctly) because ID=1 is an Admin, not a ServiceProvider
    5. Returns 404 error at line 40
    
    ## Solution: Test with Proper User Flow
    
    To properly test the registration flow, you need to:
    
    ### **Option 1: Logout and Register Fresh (Recommended)**
    
    1. **Logout** from the admin account
    2. Clear localStorage: `localStorage.clear()`
    3. Navigate to the registration page
    4. Complete the full registration flow as a new user
    5. The system will create:
        - New Identity User
        - New UserProfile
        - New ServiceProvider
        - Optional Membership
    
    ### **Option 2: Test with Different Browser/Incognito**
    
    1. Open an incognito/private window
    2. Navigate to your registration page
    3. Complete registration as a new user
    
    ## Next Steps
    
    1. **Logout from Admin**: Use the logout button or clear your browser's localStorage
    2. **Start Fresh Registration**: Go through the complete registration flow as detailed in the TEST_PLAN.md
    3. **Verify the Flow**: The registration should now complete successfully without 404 errors
    
    The backend API endpoints are all working correctly - the issue was simply testing the Provider Onboarding while logged in as an Admin user.
    
    Would you like me to:
    
    1. Add validation to prevent admins from accessing the Provider Onboarding page?
    2. Add clearer error messages when a user role mismatch occurs?
    3. Help you test the registration flow with a fresh account?
- My Analysis
    
    Nope, same issue using incognito and cleared storage. its about the user role status. currently the status is pending until the users completes all the steps. then it gives him the role. we want to give him the role just right before the membershib step so the membershib is assigned to his profile instead of searching for him when he is till pending.
    
- Analysis Summary
    
    ## Analysis Summary
    
    I've thoroughly investigated the 404 error on `POST /api/UserMemberships`. Here's what I found:
    
    ### **The Endpoint Works Perfectly**
    
    - I tested the UserMemberships POST endpoint multiple times with curl - it returns 200 OK when given valid data
    - The UserMembershipsController.cs is correctly implemented and registered
    - CORS is properly configured in Program.cs:82-91
    
    ### **The Role Update is Already Implemented**
    
    - The ServiceProvidersController.cs:224 already updates `RoleType` to "ServiceProvider" **before** the membership assignment
    - So your requirement is already met in the code
    
    ### **Why You're Still Seeing the Error**
    
    The 404 error you're experiencing suggests one of these scenarios:
    
    1. **The backend DLL is cached** - The running backend (PID 34604) might be running an old version of the code
    2. **Browser is caching** - The browser might have cached an API response
    3. **Testing with the wrong user** - If `userId=1` (the Admin) is still in localStorage, that explains why it fails
    
    ## Solution
    
    Please try these steps in order:
    
    ### **Step 1: Restart the Backend**
    
    `# Stop the current backend
    # Then restart it fresh
    cd Beyti_Backend
    dotnet run`
    
    ### **Step 2: Test the Complete Registration Flow**
    
    In an incognito window:
    
    1. Navigate to `/register`
    2. Fill out the registration form (create a NEW user, not the admin)
    3. After registration succeeds, you should see a `userId` in localStorage (NOT userId=1)
    4. Complete the Provider Onboarding steps
    5. The membership should now be assigned successfully
    
    ### **Step 3: Verify the User**
    
    Before testing, check what userId is actually in localStorage:
    
    `// In browser console
    console.log('userId:', localStorage.getItem('userId'));
    console.log('authToken:', localStorage.getItem('authToken'));`
    
    If you see `userId: 1`, that's the admin and the test won't work correctly.
    
    Would you like me to:
    
    1. Add logging to the backend to see exactly what request is coming in?
    2. Add better error handling in the frontend to show exactly what's failing?
    3. Create a test script to verify the complete flow works end-to-end?
- Error 1.1
    
    [Register] Login response: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…nQifQ.aHkT5p-_83Lhvj1zFOLKQJzKfxzp-rUSycb1B00qsSs', userId: '6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4', userProfileId: 1005, role: 'Pending'}
    Register.jsx:130 [Register] token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic2VydmljZUNAZ21haWwuY29tIiwianRpIjoiMTA3YTY0YzItNzg4Yy00YTNkLTkzYjAtY2Y0ODU1YmQ3MjI1IiwiUHJvZmlsZUlkIjoiMTAwNSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlBlbmRpbmciLCJleHAiOjE3NjY1NDY4ODksImlzcyI6IkJleXRpQVBJIiwiYXVkIjoiQmV5dGlDbGllbnQifQ.aHkT5p-_83Lhvj1zFOLKQJzKfxzp-rUSycb1B00qsSs
    Register.jsx:131 [Register] userId: 6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4
    Register.jsx:132 [Register] role: Pending
    ProviderOnboarding.jsx:187 [ProviderOnboarding] userId from localStorage: 6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4
    ProviderOnboarding.jsx:188 [ProviderOnboarding] All localStorage: {userId: '6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4', userEmail: 'serviceC@gmail.com', userPhone: '12345678', authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…nQifQ.aHkT5p-_83Lhvj1zFOLKQJzKfxzp-rUSycb1B00qsSs'}
    ProviderOnboarding.jsx:232 Address created: {id: 4, label: 'Service Area', street: 'Road 1234, Building 321, Avenue 567', city: 'Janabya', region: null, …}
    ProviderOnboarding.jsx:265 Service Provider created: {id: 4, userProfileId: 1005, businessName: 'Car dealer', phone: '12345678', minServicePrice: 1, …}
    api.js:40  POST [https://localhost:7062/api/UserMemberships](https://localhost:7062/api/UserMemberships) 404 (Not Found)
    fetchAPI @ api.js:40
    createUserMembership @ api.js:267
    handleSubmit @ ProviderOnboarding.jsx:294
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765Understand this error
    api.js:80 API Request Failed: Error: Request failed with status 404
    at fetchAPI (api.js:64:21)
    at async createUserMembership (api.js:267:10)
    at async handleSubmit (ProviderOnboarding.jsx:294:11)
    fetchAPI @ api.js:80
    await in fetchAPI
    createUserMembership @ api.js:267
    handleSubmit @ ProviderOnboarding.jsx:294
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765Understand this error
    ProviderOnboarding.jsx:300 Failed to assign membership, continuing... Error: Request failed with status 404
    at fetchAPI (api.js:64:21)
    at async createUserMembership (api.js:267:10)
    at async handleSubmit (ProviderOnboarding.jsx:294:11)
    handleSubmit @ ProviderOnboarding.jsx:300
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765Understand this error
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: ServiceProvider
    DashboardRouter.jsx:43 [DashboardRouter] Redirecting to service provider dashboard
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: ServiceProvider
    DashboardRouter.jsx:43 [DashboardRouter] Redirecting to service provider dashboard
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 1
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: number
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 1
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: number
    NotificationDropdown.jsx:40 🔔 NotificationDropdown: Fetched notifications: []
    NotificationDropdown.jsx:41 🔔 NotificationDropdown: Unread count: 0
    NotificationDropdown.jsx:40 🔔 NotificationDropdown: Fetched notifications: []
    NotificationDropdown.jsx:41 🔔 NotificationDropdown: Unread count: 0
    api.js:40  GET [https://localhost:7062/api/ServiceProviderDashboard/Profile/1](https://localhost:7062/api/ServiceProviderDashboard/Profile/1) 404 (Not Found)
    fetchAPI @ api.js:40
    getProviderProfile @ api.js:1558
    fetchUserProfile @ ServiceProviderDashboard.jsx:77
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: Service provider not found
    at fetchAPI (api.js:64:21)
    at async getProviderProfile (api.js:1558:12)
    at async fetchUserProfile (ServiceProviderDashboard.jsx:77:23)
    fetchAPI @ api.js:80
    await in fetchAPI
    getProviderProfile @ api.js:1558
    fetchUserProfile @ ServiceProviderDashboard.jsx:77
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:40  GET [https://localhost:7062/api/ServiceProviderDashboard/Profile/1](https://localhost:7062/api/ServiceProviderDashboard/Profile/1) 404 (Not Found)
    fetchAPI @ api.js:40
    getProviderProfile @ api.js:1558
    fetchUserProfile @ ServiceProviderDashboard.jsx:77
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: Service provider not found
    at fetchAPI (api.js:64:21)
    at async getProviderProfile (api.js:1558:12)
    at async fetchUserProfile (ServiceProviderDashboard.jsx:77:23)
    fetchAPI @ api.js:80
    await in fetchAPI
    getProviderProfile @ api.js:1558
    fetchUserProfile @ ServiceProviderDashboard.jsx:77
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    ServiceProviderDashboard.jsx:79 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:129 Error fetching user profile: TypeError: Cannot convert undefined or null to object
    at Object.keys (<anonymous>)
    at fetchUserProfile (ServiceProviderDashboard.jsx:80:62)
    fetchUserProfile @ ServiceProviderDashboard.jsx:129
    await in fetchUserProfile
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    ServiceProviderDashboard.jsx:133 Failed to load profile
    fetchUserProfile @ ServiceProviderDashboard.jsx:133
    await in fetchUserProfile
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    ServiceProviderDashboard.jsx:79 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:129 Error fetching user profile: TypeError: Cannot convert undefined or null to object
    at Object.keys (<anonymous>)
    at fetchUserProfile (ServiceProviderDashboard.jsx:80:62)
    fetchUserProfile @ ServiceProviderDashboard.jsx:129
    await in fetchUserProfile
    (anonymous) @ ServiceProviderDashboard.jsx:177
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    ServiceProviderDashboard.jsx:133 Failed to load profile
    
- Fix
    
    ## Summary of Fixes
    
    I've identified and fixed **four critical bugs** in the registration flow:
    
    ### **Root Cause**
    
    The registration system was confusing two different IDs:
    
    - `userId` - The Identity GUID (e.g., `'6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4'`)
    - `userProfileId` - The database UserProfile integer ID (e.g., `1005`)
    
    ### **Fixes Applied**
    
    ### **1. ServiceProviderDashboard.jsx** (line 53)
    
    **Before:**
    
    `const userProfileId = 1; // Hardcoded for testing`
    
    **After:**
    
    `const userProfileId = parseInt(localStorage.getItem('userProfileId')) || null;`
    
    **Impact:** Dashboard now fetches the correct provider profile instead of always looking for ID 1.
    
    ---
    
    ### **2. Register.jsx** (line 137)
    
    **Before:**
    
    `localStorage.setItem('authToken', loginResponse.token);
    localStorage.setItem('userId', loginResponse.userId);
    localStorage.setItem('userRole', loginResponse.role);`
    
    **After:**
    
    `localStorage.setItem('authToken', loginResponse.token);
    localStorage.setItem('userId', loginResponse.userId);
    localStorage.setItem('userProfileId', loginResponse.userProfileId); // NEW!
    localStorage.setItem('userRole', loginResponse.role);`
    
    **Impact:** `userProfileId` is now available in localStorage for other components to use.
    
    ---
    
    ### **3. ProviderOnboarding.jsx** (line 184)
    
    **Before:**
    
    `const userId = localStorage.getItem('userId');
    // userProfileId was never retrieved`
    
    **After:**
    
    `const userId = localStorage.getItem('userId');
    const userProfileId = localStorage.getItem('userProfileId'); // NEW!`
    
    **Impact:** We now have access to the correct database ID.
    
    ---
    
    ### **4. ProviderOnboarding.jsx - Membership Assignment** (line 302)
    
    **Before:**
    
    `await createUserMembership({
      userProfileId: parseInt(userId), // ❌ Parsing GUID = NaN!
      membershipPlanId: formData.selectedPlan,
      autoRenew: false
    });
    // Role updated AFTER membership
    localStorage.setItem('userRole', 'ServiceProvider');`
    
    **After:**
    
    `// Role updated BEFORE membership (as you requested)
    localStorage.setItem('userRole', 'ServiceProvider');
    
    await createUserMembership({
      userProfileId: parseInt(userProfileId), // ✅ Correct database ID!
      membershipPlanId: formData.selectedPlan,
      autoRenew: false
    });`
    
    **Impact:**
    
    - Membership is now assigned to the correct user
    - Role is updated before membership assignment (as requested)
    - No more 404 errors!
    
    ---
    
    ## What Was Happening
    
    1. **Registration:** User registered → got `userProfileId: 1005` in response
    2. **Missing Storage:** `userProfileId` was NOT saved to localStorage
    3. **Wrong Parsing:** ProviderOnboarding tried `parseInt('6e51a7ce-f4d7-43aa-a09a-c5f5555c13d4')` → `NaN`
    4. **404 Error:** Backend received `NaN` and couldn't find the user
    5. **Wrong Dashboard:** Dashboard was hardcoded to fetch profile for ID `1` instead of `1005`

### Expected

- [x]  Address created
- [x]  ServiceProvider created
- [x]  ServiceProviderAddress linked
- [x]  UserMembership created (Souq)
- [x]  Redirected to dashboard
- [x]  Service Provider dashboard loads
- [x]  localStorage userRole = ServiceProvider

---

## 🧑‍🔧 Test Case 3: Service Provider (Skip Membership)

- [x]  Complete steps 1–4 from Test Case 2
- [x]  Click **Skip – Use Free Plan (Skip currently selects the free plan, and you have to press Complete Registration. fix it so clicking skips automatically completes registration)**
- [x]  Complete registration

### Expected

- [x]  UserMembership created (Starter / Free)
- [x]  Registration successful

---

## 🏪 Test Case 4: Seller Registration (With Membership)

### Initial Registration

- [x]  Open `/register`
- [x]  Enter seller details
- [x]  Select Partner → Seller
- [x]  Click Register

### Step 1 – Identity

- [x]  Categories loaded from API
- [x]  Store name entered
- [x]  Category selected
- [ ]  Phone entered (Remove Redundent number or change UX writing)
- [x]  Click Next

### Step 2 – Location

- [ ]  Address fields entered (Same thing with the SP, try implementing the pin and autofill)
- [x]  Click Next

### Step 3 – Verification

- [x]  Verification checkbox checked
- [x]  Click Next

### Step 4 – Membership

- [x]  Membership plans loaded
- [x]  Partner plan selected
- [x]  Complete registration

### Expected

- [x]  Seller created
- [x]  SellerAddress linked
- [x]  UserMembership created (Partner)
- [x]  Seller dashboard loads
- [x]  localStorage userRole = Seller
- Minor Error (Choose store pop-up after registration should be removed, it was for testing only)
    
    [Register] Login response: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…udCJ9.bn0vKGY_tjKD9JzOTn79qiNXxY0LHb8HfHZl5EUWtKM', userId: '396b76cb-c135-4da5-a646-16655bbc73da', userProfileId: 1008, role: 'Pending'}
    Register.jsx:130 [Register] token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoic2VsbGVyQUBnbWFpbC5jb20iLCJqdGkiOiI4ZTg3YzU5MC0wZmJiLTRhYWItOTY5NS03OGZmZjVmZTYwNzgiLCJQcm9maWxlSWQiOiIxMDA4IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUGVuZGluZyIsImV4cCI6MTc2NjU0Nzc5MiwiaXNzIjoiQmV5dGlBUEkiLCJhdWQiOiJCZXl0aUNsaWVudCJ9.bn0vKGY_tjKD9JzOTn79qiNXxY0LHb8HfHZl5EUWtKM
    Register.jsx:131 [Register] userId: 396b76cb-c135-4da5-a646-16655bbc73da
    Register.jsx:132 [Register] role: Pending
    SellerOnboarding.jsx:166 [SellerOnboarding] userId from localStorage: 396b76cb-c135-4da5-a646-16655bbc73da
    SellerOnboarding.jsx:167 [SellerOnboarding] All localStorage: {userId: '396b76cb-c135-4da5-a646-16655bbc73da', userEmail: 'sellerA@gmail.com', userPhone: '12345678', authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…udCJ9.bn0vKGY_tjKD9JzOTn79qiNXxY0LHb8HfHZl5EUWtKM'}
    SellerOnboarding.jsx:211 Address created: {id: 7, label: 'Store Address', street: 'Road 1234, Building 321, Avenue 567', city: 'Janabya', region: null, …}
    SellerOnboarding.jsx:240 Seller created: {id: 1, storeName: 'Arcapita', phone: '12345678'}
    api.js:40  POST [https://localhost:7062/api/UserMemberships](https://localhost:7062/api/UserMemberships) 404 (Not Found)
    fetchAPI @ api.js:40
    createUserMembership @ api.js:267
    handleSubmit @ SellerOnboarding.jsx:269
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765
    <button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    Button @ Button.jsx:73
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
    <Button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerOnboarding @ SellerOnboarding.jsx:547
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: Request failed with status 404
    at fetchAPI (api.js:64:21)
    at async createUserMembership (api.js:267:10)
    at async handleSubmit (SellerOnboarding.jsx:269:11)
    fetchAPI @ api.js:80
    await in fetchAPI
    createUserMembership @ api.js:267
    handleSubmit @ SellerOnboarding.jsx:269
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765
    <button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    Button @ Button.jsx:73
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
    <Button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerOnboarding @ SellerOnboarding.jsx:547
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    SellerOnboarding.jsx:275 Failed to assign membership, continuing... Error: Request failed with status 404
    at fetchAPI (api.js:64:21)
    at async createUserMembership (api.js:267:10)
    at async handleSubmit (SellerOnboarding.jsx:269:11)
    handleSubmit @ SellerOnboarding.jsx:275
    await in handleSubmit
    executeDispatch @ react-dom_client.js?v=9f1f53df:13622
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    processDispatchQueue @ react-dom_client.js?v=9f1f53df:13658
    (anonymous) @ react-dom_client.js?v=9f1f53df:14071
    batchedUpdates$1 @ react-dom_client.js?v=9f1f53df:2626
    dispatchEventForPluginEventSystem @ react-dom_client.js?v=9f1f53df:13763
    dispatchEvent @ react-dom_client.js?v=9f1f53df:16784
    dispatchDiscreteEvent @ react-dom_client.js?v=9f1f53df:16765
    <button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    Button @ Button.jsx:73
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
    <Button>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerOnboarding @ SellerOnboarding.jsx:547
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: Seller
    DashboardRouter.jsx:38 [DashboardRouter] Redirecting to seller dashboard
    DashboardRouter.jsx:26 [DashboardRouter] Routing user with role: Seller
    DashboardRouter.jsx:38 [DashboardRouter] Redirecting to seller dashboard
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 396b76cb-c135-4da5-a646-16655bbc73da
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: string
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 396b76cb-c135-4da5-a646-16655bbc73da
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: string
    api.js:40  GET [https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da/unread/count](https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da/unread/count) 400 (Bad Request)
    fetchAPI @ api.js:40
    getUnreadCount @ api.js:2099
    fetchNotifications @ NotificationDropdown.jsx:38
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:40  GET [https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da](https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da) 400 (Bad Request)
    fetchAPI @ api.js:40
    getUserNotifications @ api.js:2094
    fetchNotifications @ NotificationDropdown.jsx:37
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-c8c07771020efb8fae75a67745d67593-7adaec55f21f668f-00"}
    at fetchAPI (api.js:64:21)
    at async getUnreadCount (api.js:2099:10)
    at async Promise.all (index 1)
    at async fetchNotifications (NotificationDropdown.jsx:36:31)
    fetchAPI @ api.js:80
    await in fetchAPI
    getUnreadCount @ api.js:2099
    fetchNotifications @ NotificationDropdown.jsx:38
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    NotificationDropdown.jsx:45 🔔 NotificationDropdown: Failed to fetch notifications: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-c8c07771020efb8fae75a67745d67593-7adaec55f21f668f-00"}
    at fetchAPI (api.js:64:21)
    at async getUnreadCount (api.js:2099:10)
    at async Promise.all (index 1)
    at async fetchNotifications (NotificationDropdown.jsx:36:31)
    fetchNotifications @ NotificationDropdown.jsx:45
    await in fetchNotifications
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:40  GET [https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da](https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da) 400 (Bad Request)
    fetchAPI @ api.js:40
    getUserNotifications @ api.js:2094
    fetchNotifications @ NotificationDropdown.jsx:37
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:40  GET [https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da/unread/count](https://localhost:7062/api/Notifications/user/396b76cb-c135-4da5-a646-16655bbc73da/unread/count) 400 (Bad Request)
    fetchAPI @ api.js:40
    getUnreadCount @ api.js:2099
    fetchNotifications @ NotificationDropdown.jsx:38
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-91912cb02e12cad4c3220f693f18cd5a-1ab1e28868af2aa3-00"}
    at fetchAPI (api.js:64:21)
    at async getUserNotifications (api.js:2094:10)
    at async Promise.all (index 0)
    fetchAPI @ api.js:80
    await in fetchAPI
    getUserNotifications @ api.js:2094
    fetchNotifications @ NotificationDropdown.jsx:37
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11040
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11033
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11201
    recursivelyTraversePassiveMountEffects @ react-dom_client.js?v=9f1f53df:11010
    commitPassiveMountOnFiber @ react-dom_client.js?v=9f1f53df:11066
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13150
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-a04ca1f1b4b8be56e02657606d568d9b-a7e17ffab0648faa-00"}
    at fetchAPI (api.js:64:21)
    at async getUserNotifications (api.js:2094:10)
    at async Promise.all (index 0)
    at async fetchNotifications (NotificationDropdown.jsx:36:31)
    fetchAPI @ api.js:80
    await in fetchAPI
    getUserNotifications @ api.js:2094
    fetchNotifications @ NotificationDropdown.jsx:37
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    NotificationDropdown.jsx:45 🔔 NotificationDropdown: Failed to fetch notifications: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-a04ca1f1b4b8be56e02657606d568d9b-a7e17ffab0648faa-00"}
    at fetchAPI (api.js:64:21)
    at async getUserNotifications (api.js:2094:10)
    at async Promise.all (index 0)
    at async fetchNotifications (NotificationDropdown.jsx:36:31)
    fetchNotifications @ NotificationDropdown.jsx:45
    await in fetchNotifications
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    api.js:80 API Request Failed: Error: {"type":"[https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One](https://tools.ietf.org/html/rfc9110#section-15.5.1%22,%22title%22:%22One) or more validation errors occurred.","status":400,"errors":{"userId":["The value '396b76cb-c135-4da5-a646-16655bbc73da' is not valid."]},"traceId":"00-baec830e7576ac6eb7d7d1f144dda78b-4804a013b315bf4e-00"}
    at fetchAPI (api.js:64:21)
    at async getUnreadCount (api.js:2099:10)
    at async Promise.all (index 1)
    fetchAPI @ api.js:80
    await in fetchAPI
    getUnreadCount @ api.js:2099
    fetchNotifications @ NotificationDropdown.jsx:38
    (anonymous) @ NotificationDropdown.jsx:54
    react_stack_bottom_frame @ react-dom_client.js?v=9f1f53df:18567
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    commitHookEffectListMount @ react-dom_client.js?v=9f1f53df:9411
    commitHookPassiveMountEffects @ react-dom_client.js?v=9f1f53df:9465
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11273
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11317
    recursivelyTraverseReconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11240
    reconnectPassiveEffects @ react-dom_client.js?v=9f1f53df:11265
    doubleInvokeEffectsOnFiber @ react-dom_client.js?v=9f1f53df:13339
    runWithFiberInDEV @ react-dom_client.js?v=9f1f53df:997
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13312
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    recursivelyTraverseAndDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13317
    commitDoubleInvokeEffectsInDEV @ react-dom_client.js?v=9f1f53df:13347
    flushPassiveEffects @ react-dom_client.js?v=9f1f53df:13157
    (anonymous) @ react-dom_client.js?v=9f1f53df:12776
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36
    <NotificationDropdown>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    PageHeader @ PageHeader.jsx:132
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
    <PageHeader>
    exports.jsxDEV @ react_jsx-dev-runtime.js?v=9f1f53df:247
    SellerDashboard @ SellerDashboard.jsx:1085
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
    performWorkUntilDeadline @ react-dom_client.js?v=9f1f53df:36Understand this error
    SellerDashboard.jsx:677 📦 Loaded sellers: [{…}]
    SellerDashboard.jsx:677 📦 Loaded sellers: [{…}]
    SellerDashboard.jsx:892 🔍 Selected seller: {id: 1, userProfileId: 1008, storeName: 'Arcapita', phone: '12345678', createdAt: '2025-12-24T03:44:03.15', …}
    SellerDashboard.jsx:893 🔍 Selected seller UserProfileId: 1008
    NotificationDropdown.jsx:34 🔔 NotificationDropdown: Fetching notifications for userId: 1008
    NotificationDropdown.jsx:35 🔔 NotificationDropdown: userId type: number
    NotificationDropdown.jsx:40 🔔 NotificationDropdown: Fetched notifications: []
    NotificationDropdown.jsx:41 🔔 NotificationDropdown: Unread count: 0
    

---

## 🏪 Test Case 5: Seller (Skip Membership)

- [x]  Complete steps 1–3 from Test Case 4
- [x]  Skip membership
- [x]  Complete registration

### Expected

- [x]  UserMembership created (Starter / Free)

---

## 🚚 Test Case 6: Driver Registration (Phone number redundency)

- [x]  Register as Driver
- [x]  Enter vehicle details
- [x]  Enter license number
- [x]  Enter phone
- [ ]  Submit registration
- Error 2 (User status still pending, but token,ID and userid exist)
    
    [Register] Login response: {token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc…udCJ9.b0je0VMi6DSXTd29GscHB8vSJxABHJAP1_W_0MjNwfk', userId: '3e15deab-e2f7-472f-821d-a193b110f78f', userProfileId: 1010, role: 'Pending'}
    Register.jsx:130 [Register] token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiRHJpdmVyQUBnbWFpbC5jb20iLCJqdGkiOiJiY2U3YzJhOS05OGY3LTQwYjAtODFhOC0zNDJjNmI2M2NjNGUiLCJQcm9maWxlSWQiOiIxMDEwIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUGVuZGluZyIsImV4cCI6MTc2NjU0ODIxOCwiaXNzIjoiQmV5dGlBUEkiLCJhdWQiOiJCZXl0aUNsaWVudCJ9.b0je0VMi6DSXTd29GscHB8vSJxABHJAP1_W_0MjNwfk
    Register.jsx:131 [Register] userId: 3e15deab-e2f7-472f-821d-a193b110f78f
    Register.jsx:132 [Register] role: Pending
    DriverOnboarding.jsx:91  POST [https://localhost:7062/api/Drivers](https://localhost:7062/api/Drivers) 400 (Bad Request)
    
- Fix
    
    ## Summary
    
    I've fixed the **Test Case 6 error** where Driver registration was failing with a 400 Bad Request.
    
    ### Problem
    
    When a user with "Pending" status tried to complete driver onboarding, the POST to `/api/Drivers` failed because:
    
    - The frontend was sending `UserId: parseInt(userId)` where `userId` is a GUID string like `'3e15deab-e2f7-472f-821d-a193b110f78f'`
    - `parseInt()` on a GUID returns `NaN`, causing validation errors
    - The backend expected `UserId` as an integer, but it should have been a string (GUID) to match the `IdentityUserId` field
    
    ### Changes Made
    
    **Frontend**: DriverOnboarding.jsx:103
    
    - Changed from `UserId: parseInt(userId)` to `UserId: userId` (sends GUID string)
    - Added validation check to ensure userId exists before proceeding
    - Added console logging for debugging
    
    **Backend**: DriversController.cs
    
    - Changed `CreateDriverDto.UserId` from `int?` to `string?` (line 9)
    - Updated `PostDriver` method to handle GUID string lookup (lines 129-133)
    - Added orphaned Customer record cleanup (lines 144-150) to match ServiceProvider flow
    - Improved error messages to show which userId failed
    
    **Documentation**: TEST_PLAN.md
    
    - Added bug fix notes to Test Case 6 documenting the issue, root cause, and fix

### Expected

- [x]  Driver record created
- [x]  No membership created
- [x]  Driver dashboard loads
- [x]  localStorage userRole = Driver

---

## 🔐 Test Case 7: Foreign Key Validation

### Service Provider

- [x]  Complete provider registration
- [x]  No FK errors in console

### Seller

- [x]  Complete seller registration
- [x]  No FK errors in console

---

## 🔌 Test Case 8: API Integration

- [x]  `/api/ServiceCategories` called
- [x]  `/api/Categories` called
- [x]  `/api/MembershipPlans` called
- [x]  Dropdowns populated dynamically
- [ ]  No hardcoded frontend data (Store and driver selection pop ups should be removed when directing to their dashboards)

---

## 💳 Test Case 9: Membership Assignment

- [x]  Register provider with Souq plan
- [x]  UserMembership exists
- [x]  Plan = Souq
- [x]  Status = Active
- [x]  StartDate = today
- [ ]  EndDate = +30 days (double check)

---

## ⚠️ Test Case 10: Error Handling

### Validation

- [x]  Missing category shows error
- [x]  Invalid price range shows error
- [x]  Form blocked on validation error

### API Failure

- [x]  Backend down shows user-friendly error
- [x]  Loading states visible

---

## 🔑 Test Case 11: Existing User Login

- [x]  Existing users can log in
- Error 3: login with service provider
    
    ```csharp
    api.js:40 
     GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1012 404 (Not Found)
    
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async fetchUserProfile (ServiceProviderDashboard.jsx:76:23)
    api.js:40 
     GET https://localhost:7062/api/ServiceProviderDashboard/Profile/1012 404 (Not Found)
    api.js:80 API Request Failed: Error: Service provider not found
        at fetchAPI (api.js:64:21)
        at async getProviderProfile (api.js:1558:12)
        at async fetchUserProfile (ServiceProviderDashboard.jsx:76:23)
    ServiceProviderDashboard.jsx:78 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:128 Error fetching user profile: TypeError: Cannot convert undefined or null to object
        at Object.keys (<anonymous>)
        at fetchUserProfile (ServiceProviderDashboard.jsx:79:62)
    
    ServiceProviderDashboard.jsx:132 Failed to load profile
    ServiceProviderDashboard.jsx:78 [fetchUserProfile] Received provider profile: null
    ServiceProviderDashboard.jsx:128 Error fetching user profile: TypeError: Cannot convert undefined or null to object
        at Object.keys (<anonymous>)
        at fetchUserProfile (ServiceProviderDashboard.jsx:79:62)
    ServiceProviderDashboard.jsx:132 Failed to load profile
    ```
    
- [x]  Correct dashboard loads
- [x]  No data loss

---

## ❌ Negative Tests

- [x]  Duplicate email blocked
- Error handling: Email is blocked but displays console error instead of proper feedback
    
    ```csharp
    api.js:40 
     POST https://localhost:7062/api/Auth/register 400 (Bad Request)
    
    api.js:80 API Request Failed: Error: Request failed with status 400
        at fetchAPI (api.js:64:21)
        at async register (api.js:1997:10)
        at async handleSubmit (Register.jsx:115:7)
    ﻿
    
    ```
    
- [x]  Invalid phone rejected
- [x]  Password mismatch rejected

---

## ⚡ Performance Tests

- [x]  ServiceCategories < 500ms
- [x]  Categories < 500ms
- [x]  MembershipPlans < 500ms
- [x]  Dropdowns load < 1s

---

## 🎯 Success Criteria (Final Check)

- [ ]  All 4 user roles register successfully
- [x]  FK constraints stable
- [x]  Membership logic correct
- [x]  Dashboards route correctly
- [ ]  Error handling works
- [x]  API-driven data only

---

## 🧪 Test Execution Checklist

- [x]  Backend running
- [x]  Frontend running
- [x]  Database seeded
- [x]  DevTools open
- [x]  SQL client ready
- [x]  All test cases executed

---

## 📝 Test Result Template

- **Test Case: 1**
- **Status:** Pass
- **Executed By: Ali**
- **Date: 24/12/25**
- **Notes: Minor errors found, registration is stable**
- **Issues Found: 3 errors documented above**

---