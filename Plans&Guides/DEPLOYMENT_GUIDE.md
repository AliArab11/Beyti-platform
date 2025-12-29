# Beyti Platform - Complete Deployment Guide

This guide covers both **local development** and **production deployment to Azure**.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Configuration](#frontend-configuration)
6. [Running the Application](#running-the-application)
7. [Azure Deployment](#azure-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

#### For Local Development:
- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **.NET SDK** 8.0 or higher ([Download](https://dotnet.microsoft.com/download))
- **SQL Server** 2019 or higher ([Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads))
  - Or **SQL Server Express** (free edition)
- **SQL Server Management Studio (SSMS)** 18.0+ ([Download](https://aka.ms/ssmsfullsetup))
- **Git** ([Download](https://git-scm.com/downloads))
- **Visual Studio Code** (recommended) or any code editor

#### For Azure Deployment:
- Active **Microsoft Azure** subscription ([Sign up](https://azure.microsoft.com/free/))
- **Azure CLI** (optional but recommended) ([Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli))

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check .NET SDK version
dotnet --version

# Check Git version
git --version
```

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/Beyti-platform.git
cd Beyti-platform
```

### Step 2: Project Structure Overview

```
Beyti-platform/
├── beyti-frontend/          # React frontend
├── Beyti_Backend/           # ASP.NET Core backend
├── Beyti-MVC/               # MVC application
├── BeytiV1.4.sql           # Database schema
└── create_admin_user.sql   # Admin user script
```

---

## Database Setup

### Option 1: Using SQL Server (Local)

#### 1.1 Create Databases

Open **SQL Server Management Studio (SSMS)** and connect to your local SQL Server instance.

```sql
-- Create main database
CREATE DATABASE [Beyti-V1];
GO

-- Create identity database
CREATE DATABASE [Beyti-Identity];
GO
```

#### 1.2 Execute Schema Script

1. Open `BeytiV1.4.sql` in SSMS
2. Ensure you're connected to the `Beyti-V1` database:
   ```sql
   USE [Beyti-V1];
   GO
   ```
3. Execute the script (F5)
4. Verify tables are created:
   ```sql
   SELECT TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   ```

Expected tables:
- Categories
- SubCategories
- Products
- Orders
- OrderItems
- Stores
- Sellers
- ServiceProviders
- Services
- ServiceBookings
- Drivers
- MembershipPlans
- Reviews
- Announcements
- AuditLogs

#### 1.3 Create Admin User

1. Open `create_admin_user.sql` in SSMS
2. Connect to the `Beyti-Identity` database:
   ```sql
   USE [Beyti-Identity];
   GO
   ```
3. Execute the script
4. Verify admin user created:
   ```sql
   SELECT * FROM AspNetUsers WHERE Email = 'admin@beyti.com';
   ```

### Option 2: Using Azure SQL Database

For Azure deployment, see the **[Azure Deployment](#azure-deployment)** section below.

---

## Backend Configuration

### Step 1: Navigate to Backend Directory

```bash
cd Beyti_Backend
```

### Step 2: Configure Connection Strings

Open `appsettings.json` and update the connection strings:

```json
{
  "ConnectionStrings": {
    "IdentityConnection": "Server=localhost;Database=Beyti-Identity;Trusted_Connection=True;TrustServerCertificate=True;",
    "BeytiConnection": "Server=localhost;Database=Beyti-V1;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JWT": {
    "Secret": "YourSuperSecretKeyForJWTTokenGeneration123!",
    "Issuer": "BeytiAPI",
    "Audience": "BeytiUsers",
    "ExpiryInHours": 24
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

**Connection String Format:**
- **Trusted_Connection=True**: Uses Windows Authentication (local development)
- **TrustServerCertificate=True**: Accepts self-signed certificates

**Alternative (SQL Server Authentication):**
```json
"IdentityConnection": "Server=localhost;Database=Beyti-Identity;User ID=your_username;Password=your_password;TrustServerCertificate=True;"
```

### Step 3: Restore NuGet Packages

```bash
dotnet restore
```

### Step 4: Build the Project

```bash
dotnet build
```

Expected output: `Build succeeded. 0 Warning(s). 0 Error(s).`

---

## Frontend Configuration

### Step 1: Navigate to Frontend Directory

```bash
cd ../beyti-frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- React 18
- React Router v6
- Tailwind CSS
- Phosphor Icons
- SignalR Client
- Other dependencies

### Step 3: Configure Environment Variables

Create a `.env` file in the `beyti-frontend/` directory:

```env
VITE_API_URL=https://localhost:7062
```

This tells the frontend where to find the backend API.

### Step 4: Verify Tailwind Configuration

Check `tailwind.config.js` includes your custom colors:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          100: '#E8F0E9',
          500: '#6B8E6F',
          700: '#3C5243',
          900: '#2A3830',
        },
        cream: {
          50: '#FFFEF9',
          100: '#F5F1E8',
          200: '#EBE6DC',
        },
        charcoal: {
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#353535',
          700: '#2C2C2C',
        },
        // ... other colors
      }
    }
  }
}
```

---

## Running the Application

### Step 1: Start the Backend

```bash
cd Beyti_Backend
dotnet run
```

Expected output:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:7062
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5062
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

Backend is now running on:
- HTTPS: https://localhost:7062
- HTTP: http://localhost:5062

### Step 2: Start the Frontend (New Terminal)

Open a new terminal window:

```bash
cd beyti-frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Frontend is now running on: http://localhost:5173

### Step 3: Access the Application

Open your browser and navigate to:

- **Customer/Seller/Provider Portal**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin-view
- **Login Page**: http://localhost:5173/login
- **Registration**: http://localhost:5173/register

### Step 4: Login as Admin

Use the default admin credentials:
```
Email: admin@beyti.com
Password: Admin@123
```

---

## Testing the Setup

### 1. Test Backend API

Open a browser or use curl:

```bash
# Test if API is running
curl https://localhost:7062/api/Categories

# Should return JSON array of categories
```

### 2. Test Frontend

1. Navigate to http://localhost:5173
2. You should see the Beyti homepage
3. Click "Login" - should navigate to login page
4. Click "Sign Up" - should navigate to registration page

### 3. Test End-to-End Flow

**Customer Registration:**
1. Go to http://localhost:5173/register
2. Fill in registration form
3. After registration, should redirect to home page

**Admin Login:**
1. Go to http://localhost:5173/login
2. Login with admin credentials
3. Should redirect to admin dashboard
4. Test navigation to different sections:
   - User Management
   - Membership Plans
   - Approvals
   - Category Moderation

---

## Azure Deployment

For production deployment to Microsoft Azure, follow the comprehensive guide:

**[Azure SQL Database Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)**

This guide covers:
1. Creating Azure SQL Server and databases
2. Deploying database schemas to Azure
3. Updating connection strings for Azure
4. Deploying backend to Azure App Service
5. Deploying frontend to Azure Static Web Apps
6. Security configuration
7. Cost optimization
8. Monitoring and maintenance

### Quick Azure Setup Summary

#### 1. Create Azure Resources

```bash
# Login to Azure CLI
az login

# Create resource group
az group create --name beyti-rg --location "East US"

# Create SQL Server
az sql server create \
  --name beyti-sql-server \
  --resource-group beyti-rg \
  --location "East US" \
  --admin-user beyti_admin \
  --admin-password <YourSecurePassword>

# Create databases
az sql db create \
  --resource-group beyti-rg \
  --server beyti-sql-server \
  --name Beyti-V1 \
  --service-objective S0

az sql db create \
  --resource-group beyti-rg \
  --server beyti-sql-server \
  --name Beyti-Identity \
  --service-objective S0
```

#### 2. Update Backend Connection Strings

```json
{
  "ConnectionStrings": {
    "IdentityConnection": "Server=beyti-sql-server.database.windows.net,1433;Initial Catalog=Beyti-Identity;User ID=beyti_admin;Password=<YourPassword>;Encrypt=True;TrustServerCertificate=False;",
    "BeytiConnection": "Server=beyti-sql-server.database.windows.net,1433;Initial Catalog=Beyti-V1;User ID=beyti_admin;Password=<YourPassword>;Encrypt=True;TrustServerCertificate=False;"
  }
}
```

#### 3. Deploy Backend to Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name beyti-plan \
  --resource-group beyti-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group beyti-rg \
  --plan beyti-plan \
  --name beyti-api \
  --runtime "DOTNET|8.0"

# Deploy backend
cd Beyti_Backend
dotnet publish -c Release -o ./publish
cd publish
zip -r ../deploy.zip .
cd ..

az webapp deployment source config-zip \
  --resource-group beyti-rg \
  --name beyti-api \
  --src deploy.zip
```

#### 4. Deploy Frontend to Azure Static Web Apps

```bash
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Build frontend
cd beyti-frontend
npm run build

# Deploy to Azure Static Web Apps
az staticwebapp create \
  --name beyti-web \
  --resource-group beyti-rg \
  --source ./dist \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start

**Error**: `Unable to connect to database`

**Solution**:
- Verify SQL Server is running
- Check connection strings in `appsettings.json`
- Ensure databases exist
- Test connection in SSMS

**Error**: `Port 7062 already in use`

**Solution**:
```bash
# Find process using port
netstat -ano | findstr :7062

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Or change the port in launchSettings.json
```

#### 2. Frontend Won't Start

**Error**: `Cannot find module`

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error**: `CORS policy error`

**Solution**:
- Ensure backend CORS is configured in `Program.cs`
- Check `VITE_API_URL` in `.env` file
- Verify backend is running

#### 3. Database Connection Issues

**Error**: `Login failed for user`

**Solution**:
- Check SQL Server authentication mode (Windows/Mixed)
- Verify username and password
- Ensure user has permissions on database

**Error**: `A network-related or instance-specific error`

**Solution**:
- Verify SQL Server is running
- Check SQL Server TCP/IP is enabled
- Verify firewall allows SQL Server connections
- Check server name is correct

#### 4. Authentication Not Working

**Error**: `401 Unauthorized`

**Solution**:
- Verify JWT configuration in `appsettings.json`
- Check token is being sent in request headers
- Ensure token hasn't expired
- Verify admin user exists in database

#### 5. Real-time Notifications Not Working

**Error**: `SignalR connection failed`

**Solution**:
- Ensure backend SignalR hub is configured
- Check SignalRContext is properly wrapped around app
- Verify WebSocket support in hosting environment
- Check browser console for specific errors

---

## Environment-Specific Configuration

### Development
```json
{
  "ConnectionStrings": {
    "IdentityConnection": "Server=localhost;Database=Beyti-Identity;Trusted_Connection=True;",
    "BeytiConnection": "Server=localhost;Database=Beyti-V1;Trusted_Connection=True;"
  }
}
```

### Staging/Production (Azure)
```json
{
  "ConnectionStrings": {
    "IdentityConnection": "Server=beyti-sql-server.database.windows.net;Database=Beyti-Identity;User ID=beyti_admin;Password=<password>;Encrypt=True;",
    "BeytiConnection": "Server=beyti-sql-server.database.windows.net;Database=Beyti-V1;User ID=beyti_admin;Password=<password>;Encrypt=True;"
  }
}
```

**Security Best Practice**: Use Azure Key Vault for production secrets.

---

## Performance Optimization

### Backend
- Enable response caching
- Use async/await for database operations
- Implement pagination for large data sets
- Add database indexes on frequently queried columns

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Lazy loading for images and components
- Minimize bundle size

### Database
- Add indexes on foreign keys
- Optimize complex queries
- Regular database maintenance
- Monitor query performance

---

## Monitoring and Logging

### Backend Logging
Logs are written to:
- Console (development)
- Azure Application Insights (production)

View logs:
```bash
# Development
# Logs appear in terminal

# Azure
az webapp log tail --name beyti-api --resource-group beyti-rg
```

### Frontend Error Tracking
Consider integrating:
- Sentry for error tracking
- Google Analytics for usage tracking
- Azure Application Insights

---

## Security Checklist

- [ ] Change default admin password
- [ ] Use HTTPS in production
- [ ] Store secrets in Azure Key Vault
- [ ] Enable Azure SQL firewall
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Enable CORS only for trusted domains
- [ ] Use strong JWT secrets
- [ ] Regular database backups
- [ ] Enable Azure DDoS protection

---

## Next Steps

1. **Review** the [User Guide](USER_GUIDE.md) for feature documentation
2. **Test** all user flows (customer, seller, provider, admin)
3. **Configure** production environment variables
4. **Deploy** to Azure following the [Azure Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)
5. **Monitor** application performance and logs
6. **Set up** automated backups

---

## Support

For additional help:
- Check the main [README.md](README.md)
- Review [Azure Deployment Guide](AZURE_DEPLOYMENT_GUIDE.md)
- Contact the development team

---

**Last Updated**: January 2025
