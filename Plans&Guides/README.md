# Beyti Platform

**A Multi-Role E-Commerce and Service Booking Platform for Bahrain**

Beyti is a comprehensive digital platform connecting customers with sellers, service providers, and delivery drivers. Built with modern web technologies and designed for the Bahraini market.

---

## Features

### For Customers
- Browse products from multiple sellers and stores
- Book services from verified service providers
- Real-time order tracking and notifications
- Manage orders and service bookings
- Write reviews and ratings

### For Sellers
- Complete store management dashboard
- Product catalog management
- Order processing and fulfillment
- Analytics and revenue tracking
- Customer reviews management

### For Service Providers
- Service catalog and scheduling management
- Booking management system
- Real-time booking notifications
- Revenue analytics
- Customer reviews

### For Drivers
- Order assignment and tracking
- Route optimization
- Delivery management
- Earnings tracking

### For Administrators
- User management across all roles
- Membership plan management
- Service provider approval workflow
- Category and content moderation
- Platform-wide announcements
- Audit logs and monitoring

---

## Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom Beyti Design System
- **Icons**: Phosphor Icons
- **Real-time**: SignalR for live notifications

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server (local) / Azure SQL Database (production)
- **Authentication**: ASP.NET Identity with JWT
- **Real-time**: SignalR Hub
- **API**: RESTful APIs

### Database
- **Primary**: Beyti-V1 (products, orders, services)
- **Identity**: Beyti-Identity (users, authentication)

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- .NET 8.0 SDK
- SQL Server 2019+ or Azure SQL Database
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Beyti-platform.git
cd Beyti-platform
```

2. **Setup Backend**
```bash
cd Beyti_Backend
dotnet restore
dotnet run
```
Backend runs on: https://localhost:7062

3. **Setup Frontend**
```bash
cd beyti-frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

4. **Access the Platform**
- Customer/Seller/Provider: http://localhost:5173
- Admin Dashboard: http://localhost:5173/admin-view

### Default Admin Credentials
```
Email: admin@beyti.com
Password: Admin@123
```

---

## Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete setup instructions for local and Azure deployment
- **[User Guide](USER_GUIDE.md)** - Feature walkthroughs for all user roles
- **[Admin Guide](USER_GUIDE.md#administrator-guide)** - Admin dashboard and management features
- **[Azure Deployment](AZURE_DEPLOYMENT_GUIDE.md)** - Step-by-step Azure SQL Database deployment

---

## Project Structure

```
Beyti-platform/
├── beyti-frontend/          # React frontend application
│   ├── src/
│   │   ├── Beyti-Website/   # Main application pages
│   │   │   ├── Admin/       # Admin dashboard
│   │   │   ├── Customer/    # Customer features
│   │   │   ├── Seller/      # Seller dashboard
│   │   │   ├── ServiceProvider/ # Provider dashboard
│   │   │   ├── Driver/      # Driver features
│   │   │   ├── Store/       # Storefront & shopping
│   │   │   └── Registration/ # Auth flows
│   │   ├── components/      # Shared UI components
│   │   ├── contexts/        # React contexts (SignalR, Theme)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── Beyti_Backend/           # ASP.NET Core backend
│   ├── Controllers/         # API controllers
│   ├── Models/              # Data models
│   ├── Services/            # Business logic
│   └── Program.cs           # App configuration
├── BeytiV1.4.sql           # Main database schema
├── create_admin_user.sql   # Admin user setup
└── Documentation files
```

---

## Key Features Implementation

### Design System
Custom Beyti Design System with:
- **Colors**: Sage green, cream, charcoal palette
- **Typography**: Merriweather (headings), Inter (body)
- **Components**: Table, CRUDButton, StatusChip, AnalyticsCard, PageHeader
- **Accessibility**: WCAG AA compliant contrast ratios

### Real-time Notifications
- SignalR integration for live updates
- Order status changes
- New booking notifications
- Platform announcements

### Authentication & Authorization
- Role-based access control (Customer, Seller, ServiceProvider, Driver, Admin)
- JWT token authentication
- Protected routes
- Session management

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interfaces

---

## API Endpoints

### Authentication
- `POST /api/Auth/register` - User registration
- `POST /api/Auth/login` - User login
- `POST /api/Auth/logout` - User logout

### Products & Orders
- `GET /api/Products` - List products
- `POST /api/Orders` - Create order
- `GET /api/Orders/{id}` - Get order details
- `PUT /api/Orders/{id}/status` - Update order status

### Services & Bookings
- `GET /api/Services` - List services
- `POST /api/ServiceBookings` - Create booking
- `GET /api/ServiceBookings/{id}` - Get booking details

### Admin
- `GET /api/Users` - List all users
- `GET /api/MembershipPlans` - List membership plans
- `POST /api/Announcements` - Create announcement

---

## Environment Variables

### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "IdentityConnection": "Server=localhost;Database=Beyti-Identity;Trusted_Connection=True;",
    "BeytiConnection": "Server=localhost;Database=Beyti-V1;Trusted_Connection=True;"
  },
  "JWT": {
    "Secret": "your-secret-key-here",
    "Issuer": "BeytiAPI",
    "Audience": "BeytiUsers"
  }
}
```

### Frontend (.env)
```
VITE_API_URL=https://localhost:7062
```

---

## Testing

### Default Test Accounts
After running the database setup:

**Admin**
- Email: admin@beyti.com
- Password: Admin@123

**Test Customers/Sellers/Providers**
- Register through the UI at http://localhost:5173/register

### Testing Features
1. Register as a customer and browse products
2. Register as a seller and create a store
3. Register as a service provider (requires admin approval)
4. Login as admin to approve providers
5. Test order flow end-to-end
6. Test service booking flow

---

## Deployment

### Local Development
See **Quick Start** section above.

### Production (Azure)
See **[Azure Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)** for complete instructions:
1. Create Azure SQL Database
2. Deploy database schemas
3. Configure connection strings
4. Deploy backend to Azure App Service
5. Deploy frontend to Azure Static Web Apps or hosting service

---

## Design System

### Color Palette
- **Sage**: Primary brand color (#6B8E6F, #3C5243, #2A3830)
- **Cream**: Background and accents (#FFFEF9, #F5F1E8)
- **Charcoal**: Text and UI elements (#2C2C2C, #353535, #737373)
- **Success**: #10B981
- **Error**: #EF4444
- **Warning**: #F59E0B

### Typography
- **Display/Headings**: Merriweather (serif)
- **Body/UI**: Inter (sans-serif)

---


For technical issues or questions, refer to:
- [User Guide](USER_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

## Acknowledgments

- Phosphor Icons for the icon library
- Tailwind CSS for the styling framework
- Microsoft for .NET and SignalR technologies
- React community for excellent documentation and tools

---

