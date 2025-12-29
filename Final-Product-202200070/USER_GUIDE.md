# Beyti Platform - User Guide

Complete guide for using the Beyti Platform across all user roles.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Customer Guide](#customer-guide)
3. [Seller Guide](#seller-guide)
4. [Service Provider Guide](#service-provider-guide)
5. [Driver Guide](#driver-guide)
6. [Administrator Guide](#administrator-guide)
7. [Common Features](#common-features)
8. [FAQs](#faqs)

---

## Getting Started

### Accessing the Platform

Navigate to the Beyti Platform URL:
- **Local Development**: http://localhost:5173
- **Production**: [Your production URL]

### Registration

1. Click **"Sign Up"** in the navigation bar
2. Fill in your details:
   - Display Name
   - Email Address
   - Phone Number
   - Password (minimum 8 characters)
3. Click **"Create Account"**
4. You'll be redirected to role selection

### Role Selection

After registration, choose your role:

- **Customer**: Browse and purchase products, book services
- **Seller**: Sell products through your online store
- **Service Provider**: Offer services and manage bookings
- **Driver**: Deliver orders to customers

**Note**: Service Providers require admin approval before accessing their dashboard.

### Login

1. Click **"Login"** in the navigation bar
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be redirected based on your role

---

## Customer Guide

Customers can browse products, book services, and manage orders.

### Browsing Products

#### Homepage

After login, you'll see the main homepage with:
- **Featured Categories** (Bakery, Groceries, Restaurants, etc.)
- **Store Listings** with ratings and status (Open/Closed)
- **Search Bar** to find specific products or stores

#### Viewing Stores

1. Click on any store card
2. View store information:
   - Store name and description
   - Opening hours
   - Rating and reviews
   - Product catalog

#### Product Details

1. Click on a product card
2. View:
   - Product images
   - Price
   - Description
   - Available quantity
   - Customer reviews
3. Select quantity
4. Click **"Add to Cart"**

### Shopping Cart

#### Managing Your Cart

1. Click the **shopping cart icon** in the header
2. Review items:
   - Product name and image
   - Quantity (adjustable)
   - Price per item
   - Total price
3. Update quantities or remove items
4. Click **"Proceed to Checkout"**

#### Checkout Process

1. Review order summary:
   - Items list
   - Subtotal
   - Delivery fee
   - Total amount
2. Confirm delivery address
3. Select payment method (Cash on Delivery/Card)
4. Click **"Place Order"**
5. Order confirmation appears with order ID

### Service Bookings

#### Finding Services

1. Click **"Service Providers"** in navigation
2. Browse available service providers
3. View provider details:
   - Services offered
   - Pricing
   - Availability
   - Customer reviews

#### Booking a Service

1. Click **"Book Service"** on provider's page
2. Select:
   - Service type
   - Date and time slot
   - Additional notes (optional)
3. Review booking details
4. Click **"Confirm Booking"**
5. Receive booking confirmation

### Managing Orders

#### My Orders Dashboard

1. Click your profile icon → **"My Orders"**
2. View all orders with status:
   - **Pending**: Order received, awaiting processing
   - **Confirmed**: Seller confirmed the order
   - **In Transit**: Driver is delivering
   - **Delivered**: Order completed
   - **Cancelled**: Order cancelled

#### Order Details

1. Click on any order
2. View:
   - Order ID and date
   - Items ordered
   - Delivery address
   - Current status
   - Tracking information (if available)

#### Order Actions

- **Track Order**: View real-time delivery status
- **Contact Seller**: Send message to seller
- **Cancel Order**: Available for Pending orders only
- **Leave Review**: After delivery is complete

### Writing Reviews

1. Go to completed order
2. Click **"Write Review"**
3. Rate your experience (1-5 stars)
4. Write review comments
5. Click **"Submit Review"**

### Notifications

- Real-time notifications for:
  - Order status updates
  - Delivery arrival
  - Service booking confirmations
  - Platform announcements

---

## Seller Guide

Sellers can create stores, manage products, and process orders.

### First-Time Setup

#### Creating Your Store

1. After role selection, you'll see the onboarding screen
2. Fill in store details:
   - Business Name
   - Store Name
   - Description
   - Business Registration Number
   - Phone Number
   - Email
   - Address
3. Set operating hours:
   - Opening time
   - Closing time
   - Days of operation
4. Upload store logo/images
5. Click **"Create Store"**

### Seller Dashboard

Access your dashboard at `/seller-dashboard`

#### Dashboard Overview

View key metrics:
- **Total Revenue**: Earnings to date
- **Orders Today**: New orders count
- **Products**: Total products listed
- **Average Rating**: Customer satisfaction score

#### Sales Analytics

- Revenue trends (daily/weekly/monthly)
- Top-selling products
- Order statistics
- Customer demographics

### Product Management

#### Adding Products

1. Navigate to **"Products"** tab
2. Click **"Add New Product"**
3. Fill in product details:
   - Product Name
   - Description
   - Category and Subcategory
   - Price (in BHD)
   - Quantity Available
   - Unit of measure
4. Upload product images
5. Click **"Create Product"**

#### Managing Products

**Edit Product:**
1. Find product in list
2. Click **"Edit"** button
3. Update details
4. Click **"Save Changes"**

**Delete Product:**
1. Find product in list
2. Click **"Delete"** button
3. Confirm deletion

**Toggle Availability:**
- Use toggle switch to mark products as In Stock/Out of Stock

### Order Management

#### Viewing Orders

1. Navigate to **"Orders"** tab
2. View orders filtered by status:
   - **Pending**: New orders awaiting confirmation
   - **Confirmed**: Orders you've confirmed
   - **In Transit**: Out for delivery
   - **Delivered**: Completed orders
   - **Cancelled**: Cancelled orders

#### Processing Orders

**For Pending Orders:**
1. Review order details
2. Check product availability
3. Options:
   - **Accept**: Click "Confirm Order"
   - **Reject**: Click "Cancel" with reason

**For Confirmed Orders:**
1. Prepare items for delivery
2. Wait for driver assignment
3. Mark as "Ready for Pickup"

**Updating Order Status:**
- System automatically updates when driver picks up
- Mark as "Delivered" after customer confirmation

### Customer Communication

- View customer contact information
- Send order updates
- Respond to customer inquiries
- Handle delivery issues

### Reviews and Ratings

#### Managing Reviews

1. Navigate to **"Reviews"** tab
2. View customer reviews:
   - Rating (1-5 stars)
   - Review text
   - Customer name
   - Date submitted
3. Respond to reviews (optional)

#### Improving Ratings

- Respond professionally to negative reviews
- Address customer concerns promptly
- Maintain product quality
- Ensure accurate descriptions

### Store Settings

#### Updating Store Information

1. Click **"Profile"** or store settings
2. Update:
   - Store name and description
   - Operating hours
   - Contact information
   - Location/address
3. Upload new images
4. Click **"Save Changes"**

#### Operating Hours

- Set weekly schedule
- Mark special closure days
- System automatically shows Open/Closed status

---

## Service Provider Guide

Service providers offer services and manage bookings.

### First-Time Setup

#### Provider Onboarding

1. After role selection, complete onboarding form:
   - Business Name
   - Service Category
   - Business Registration
   - Contact Details
   - Service Area
   - Certifications (if applicable)
2. Submit for admin approval
3. Wait for approval notification

**Note**: You cannot access the dashboard until admin approves your account.

### Service Provider Dashboard

Access your dashboard at `/serviceprovider-dashboard`

#### Dashboard Overview

Key metrics:
- **Total Bookings**: All-time bookings
- **Today's Bookings**: Today's schedule
- **Revenue**: Earnings overview
- **Average Rating**: Customer satisfaction

#### Performance Analytics

- Booking trends
- Revenue by service type
- Peak booking times
- Customer retention

### Service Management

#### Adding Services

1. Navigate to **"Services"** tab
2. Click **"Add New Service"**
3. Fill in service details:
   - Service Name
   - Description
   - Category
   - Price
   - Duration (minutes)
   - Availability
4. Upload service images
5. Click **"Create Service"**

#### Managing Services

**Edit Service:**
1. Find service in list
2. Click **"Edit"**
3. Update details
4. Save changes

**Delete Service:**
1. Click **"Delete"**
2. Confirm deletion

**Service Availability:**
- Toggle to enable/disable bookings
- Set temporary unavailability

### Schedule Management

#### Setting Availability

1. Navigate to **"Schedule"** tab
2. Set working hours:
   - Days of the week
   - Start and end times
   - Break times
3. Block specific dates:
   - Holidays
   - Personal time off
   - Maintenance days

#### Time Slot Management

- System automatically generates slots based on:
  - Service duration
  - Your working hours
  - Existing bookings
- Manual override available for special cases

### Booking Management

#### Viewing Bookings

Filter bookings by status:
- **Pending**: New booking requests
- **Confirmed**: Accepted bookings
- **In Progress**: Active service sessions
- **Completed**: Finished services
- **Cancelled**: Cancelled bookings

#### Processing Bookings

**For Pending Bookings:**
1. Review booking details:
   - Customer information
   - Service requested
   - Date and time
   - Special requests
2. Options:
   - **Accept**: Confirm booking
   - **Reject**: Decline with reason

**Day-of Service:**
1. View today's schedule
2. Check-in customer on arrival
3. Start service session
4. Mark as completed when done

#### Handling Changes

- Reschedule if needed (with customer approval)
- Cancel with valid reason
- Update status in real-time

### Customer Management

#### Customer History

- View customer profiles
- See booking history
- Note preferences
- Track loyalty

#### Communication

- Send booking confirmations
- Reminder notifications
- Follow-up messages
- Handle inquiries

### Reviews and Ratings

1. View customer reviews
2. Respond professionally
3. Address concerns
4. Request reviews from satisfied customers

### Notifications

Real-time alerts for:
- New booking requests
- Booking confirmations
- Schedule changes
- Customer arrivals
- Payment confirmations

---

## Driver Guide

Drivers deliver orders from sellers to customers.

### Driver Dashboard

Access at `/driver-dashboard`

#### Dashboard Overview

- **Active Deliveries**: Current assignments
- **Today's Earnings**: Revenue earned today
- **Completed Deliveries**: Today's completed orders
- **Rating**: Average customer rating

### Order Assignment

#### Receiving Orders

1. System assigns orders based on:
   - Location proximity
   - Current availability
   - Performance rating
2. Receive notification for new assignment
3. Review order details:
   - Pickup location (seller)
   - Delivery location (customer)
   - Items to deliver
   - Estimated distance
   - Delivery fee

#### Accepting Orders

1. Review order details
2. Options:
   - **Accept**: Confirm assignment
   - **Reject**: Decline (affects rating)

### Delivery Process

#### Step-by-Step Workflow

**1. En Route to Pickup:**
- Navigate to seller location
- Update status: "Heading to Seller"
- Estimated arrival time shown

**2. Pickup:**
- Arrive at seller location
- Verify order items
- Mark as "Picked Up"
- Update status: "En Route to Customer"

**3. Delivery:**
- Navigate to customer location
- Contact customer if needed
- Deliver order
- Collect payment (if Cash on Delivery)
- Mark as "Delivered"

**4. Completion:**
- Confirm delivery with customer
- Upload proof of delivery (optional)
- Receive payment confirmation

### Navigation

- Integrated maps (if available)
- Turn-by-turn directions
- Estimated time of arrival
- Traffic updates

### Earnings

#### Tracking Income

- View daily earnings
- Weekly summaries
- Monthly totals
- Payment history

#### Payment Methods

- Direct deposit
- Mobile wallet
- Bank transfer
- Weekly/bi-weekly payouts

### Managing Availability

#### Setting Status

- **Available**: Ready for assignments
- **Busy**: Currently on delivery
- **Offline**: Not accepting orders

#### Working Hours

- Set preferred working hours
- Mark days off
- Schedule breaks

---

## Administrator Guide

Administrators manage the entire platform.

### Admin Dashboard

Access at `/admin-view`

Login with admin credentials:
```
Email: admin@beyti.com
Password: Admin@123
```

**Important**: Change the default password immediately after first login.

#### Dashboard Overview

Key metrics:
- **Total Users**: All registered users
- **Platform Revenue**: Total earnings
- **Pending Approvals**: Awaiting admin action
- **Flagged Users**: Users requiring attention

#### Growth Analytics

- User growth by type (Customers, Sellers, Providers, Drivers)
- Revenue trends
- Activity metrics
- Platform health indicators

### User Management

#### Viewing All Users

1. Navigate to **"User Management"**
2. View user list with:
   - Name and email
   - Role
   - Registration date
   - Status (Active/Suspended)
   - Actions

#### Filtering Users

- Filter by role
- Filter by status
- Search by name/email
- Sort by date, name, etc.

#### User Actions

**View User Details:**
1. Click on user row
2. View complete profile:
   - Personal information
   - Activity history
   - Associated entities (stores, services)
   - Performance metrics

**Suspend User:**
1. Click **"Suspend"** button
2. Provide reason
3. Confirm suspension
- User cannot login while suspended
- Can be reactivated later

**Activate User:**
1. For suspended users
2. Click **"Activate"**
3. User can login again

**Delete User:**
1. Click **"Delete"** (use with caution)
2. Confirm permanent deletion
3. Associated data handling options

### Service Provider Approvals

#### Approval Workflow

1. Navigate to **"Request Approvals"**
2. View pending provider applications
3. Review application details:
   - Business information
   - Certifications
   - Service category
   - Contact details

#### Approving Providers

1. Verify business registration
2. Check certifications
3. Review service offerings
4. Options:
   - **Approve**: Grant access to dashboard
   - **Reject**: Decline with reason
   - **Request More Info**: Ask for additional documentation

#### Post-Approval

- Provider receives email notification
- Dashboard access granted
- Can start adding services

### Membership Plan Management

#### Viewing Plans

1. Navigate to **"Membership Plans"**
2. View all subscription plans:
   - Plan Name
   - Description
   - Monthly Price
   - Duration (days)
   - Status (Active/Inactive)

#### Creating New Plan

1. Click **"Add New Plan"**
2. Fill in details:
   - Plan Name (e.g., "Beyti Premium")
   - Description (features and benefits)
   - Monthly Price (in BHD)
   - Duration (30, 60, 90 days, etc.)
3. Click **"Create Plan"**

#### Editing Plans

1. Find plan in table
2. Click **"Edit"**
3. Update details:
   - Change price
   - Modify description
   - Update duration
4. Click **"Update Plan"**

#### Managing Plan Status

- **Activate**: Make plan available for subscription
- **Deactivate**: Hide from users (existing subscribers unaffected)

**Note**: Cannot delete plans with active subscribers.

### Category Moderation

#### Managing Categories

1. Navigate to **"Category Moderation"**
2. View product categories:
   - Bakery
   - Groceries
   - Restaurants
   - Electronics
   - etc.

#### Adding Categories

1. Click **"Add Category"**
2. Enter:
   - Category Name
   - Description
   - Icon/Image
3. Save category

#### Managing Subcategories

1. Select parent category
2. View subcategories
3. Add/Edit/Delete as needed

### Flagged Users

#### Monitoring User Behavior

1. Navigate to **"User Moderation"**
2. View flagged users:
   - Multiple failed payments
   - Customer complaints
   - Suspicious activity
   - Policy violations

#### Taking Action

Review each case:
1. View incident details
2. Check user history
3. Options:
   - **Warning**: Send warning message
   - **Temporary Suspension**: Time-limited ban
   - **Permanent Ban**: Remove from platform
   - **Clear Flag**: Resolve issue

### Platform Announcements

#### Sending Announcements

1. Navigate to **"Announcements"** or click **"Send Announcement"** on dashboard
2. Fill in announcement form:
   - **Title**: Brief headline
   - **Message**: Detailed announcement text
   - **Recipients**: Select user groups
     - Customers
     - Sellers
     - Service Providers
     - Drivers
     - (Can select multiple)
3. Click **"Send Announcement"**

#### Announcement Delivery

- Sent via real-time notifications
- Appears in user notification dropdown
- Stored in announcement history

#### Viewing Past Announcements

1. Navigate to **"Announcements"** tab
2. View history:
   - Date sent
   - Title
   - Recipients
   - Message content

### Audit Logs

#### Viewing System Activity

1. Navigate to **"Audit Logs"**
2. View all system events:
   - User actions
   - Admin actions
   - System events
   - Data changes

#### Log Details

Each log entry shows:
- **Event Type**: Action performed
- **Description**: Details of the action
- **Actor**: User who performed action
- **Timestamp**: When it occurred
- **Affected Table**: Database table impacted
- **Severity**: Critical/High/Medium/Low

#### Filtering Logs

- Filter by event type
- Filter by user
- Filter by date range
- Filter by severity
- Search by description

#### Using Logs

- Security auditing
- Troubleshooting issues
- Tracking changes
- Compliance reporting

### Notifications

#### Admin Notifications

Receive alerts for:
- New service provider applications
- Flagged user incidents
- System errors
- Critical events
- Revenue milestones

#### Notification Center

1. Click bell icon in header
2. View unread notifications
3. Click to view details
4. Mark as read

---

## Common Features

### Profile Management

#### Updating Your Profile

1. Click profile icon/avatar
2. Select **"My Profile"**
3. Update information:
   - Display Name
   - Phone Number
   - Address
   - Profile Picture
4. Click **"Save Changes"**

#### Changing Password

1. Go to profile settings
2. Click **"Change Password"**
3. Enter:
   - Current password
   - New password
   - Confirm new password
4. Click **"Update Password"**

### Notifications

#### Notification Types

- **Order Updates**: Status changes
- **Booking Confirmations**: Service bookings
- **Messages**: User communications
- **Announcements**: Platform news
- **Alerts**: Important system messages

#### Managing Notifications

1. Click notification bell icon
2. View recent notifications
3. Click to open details
4. Mark as read/unread

#### Notification Settings

- Enable/disable notification types
- Choose notification methods:
  - In-app notifications
  - Email notifications
  - SMS (if configured)

### Search Functionality

#### Global Search

Available on most pages:
- Products
- Stores
- Services
- Users (admin only)
- Orders (sellers/drivers)

#### Search Tips

- Use specific keywords
- Filter by category
- Sort results (price, rating, date)
- Use advanced filters when available

### Dark Mode (if available)

1. Click theme toggle icon
2. Switch between Light/Dark mode
3. Preference saved automatically

---

## FAQs

### General Questions

**Q: How do I reset my password?**
A: Click "Forgot Password" on login page, enter your email, and follow the reset link sent to your email.

**Q: Can I have multiple roles?**
A: No, each account is assigned one role. Create separate accounts for different roles.

**Q: Is my payment information secure?**
A: Yes, all payment transactions are encrypted and secure. We never store full credit card details.

### Customer FAQs

**Q: How do I track my order?**
A: Go to "My Orders," select your order, and view real-time tracking information.

**Q: Can I cancel an order?**
A: Yes, orders can be cancelled if they are still in "Pending" status. Contact the seller for later cancellations.

**Q: How do I return a product?**
A: Contact the seller through the order details page to initiate a return.

**Q: What payment methods are accepted?**
A: Cash on Delivery and major credit/debit cards.

### Seller FAQs

**Q: How long does it take to set up my store?**
A: Store creation is immediate. You can start adding products right away.

**Q: When do I receive payment?**
A: Payments are processed after successful delivery confirmation, with payouts every week.

**Q: Can I offer discounts?**
A: Yes, use the product discount feature to create percentage or fixed amount discounts.

**Q: How do I handle returns?**
A: Coordinate with the customer directly. Update order status accordingly.

### Service Provider FAQs

**Q: Why hasn't my account been approved?**
A: Admin reviews typically take 1-3 business days. Ensure all required documents are submitted.

**Q: Can I set different prices for different time slots?**
A: Not currently. Pricing is per service type.

**Q: How do I handle no-shows?**
A: Mark the booking as "No Show" in your dashboard. This helps track customer reliability.

**Q: Can customers book multiple services at once?**
A: Yes, customers can select multiple services. Total time is calculated automatically.

### Driver FAQs

**Q: How are delivery fees calculated?**
A: Based on distance, order value, and current demand.

**Q: Can I reject an order?**
A: Yes, but frequent rejections may affect your assignment priority.

**Q: What if the customer isn't available?**
A: Contact the customer via phone. If unavailable after reasonable attempts, follow return-to-sender protocol.

**Q: How do I report issues?**
A: Use the in-app support or contact admin through the help section.

### Admin FAQs

**Q: How do I add other admin users?**
A: Currently through direct database access. Contact system administrator for multi-admin setup.

**Q: Can I export user data?**
A: Yes, use the export feature in User Management for CSV export.

**Q: How do I handle disputed transactions?**
A: Review the audit logs, check both parties' accounts, and make a fair decision based on platform policies.

**Q: Can I customize the platform appearance?**
A: Basic customization (colors, logo) can be done through settings. Advanced customization requires developer access.

---

## Getting Help

### Support Resources

- **In-App Help**: Click "Help" in navigation
- **Documentation**: [Deployment Guide](DEPLOYMENT_GUIDE.md)
- **Technical Issues**: Contact system administrator
- **Feature Requests**: Submit through feedback form

### Contact

For urgent issues:
- Admin Support: admin@beyti.com
- Technical Support: support@beyti.com
- Business Inquiries: business@beyti.com

---

## Best Practices

### For Customers
- Keep your profile information up to date
- Read product descriptions carefully
- Leave honest reviews
- Contact sellers for questions before ordering

### For Sellers
- Upload high-quality product images
- Write detailed product descriptions
- Respond to customer inquiries promptly
- Maintain accurate inventory
- Honor your operating hours

### For Service Providers
- Keep your schedule updated
- Respond to booking requests quickly
- Maintain professionalism
- Collect customer reviews
- Update service prices regularly

### For Drivers
- Maintain good customer communication
- Verify orders before pickup
- Handle deliveries with care
- Keep your status updated
- Maintain professional conduct

### For Administrators
- Regular monitoring of flagged users
- Timely approval of provider applications
- Keep an eye on platform metrics
- Address user concerns promptly
- Regular security audits

---

**Last Updated**: January 2025

For the latest updates and features, check the platform announcement section regularly.
