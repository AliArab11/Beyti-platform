# Beyti Platform - Azure SQL Database Deployment Guide

Complete step-by-step guide for deploying the Beyti-V1 and Beyti-Identity databases from SQL Server Management Studio (SSMS) to Microsoft Azure SQL Database.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Create Azure SQL Resources](#phase-1-create-azure-sql-resources)
3. [Phase 2: Deploy Schema from SSMS](#phase-2-deploy-schema-from-ssms)
4. [Phase 3: Update Connection Strings](#phase-3-update-connection-strings)
5. [Phase 4: Test Connection](#phase-4-test-connection)
6. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Cost Optimization](#cost-optimization)
9. [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before starting the deployment, ensure you have:

### Required Accounts & Tools
- ✅ **Active Azure subscription** with permissions to create SQL Database resources
- ✅ **SQL Server Management Studio (SSMS)** version 18.0 or later
- ✅ **Local SQL Server** with Beyti databases already created
- ✅ **Internet connection** for Azure connectivity

### Required Files
- ✅ `BeytiV1.4.sql` - Main application database schema (located in project root)
- ✅ `create_admin_user.sql` - Admin user seeding script (located in project root)
- ✅ Any additional seed data scripts for your environment

### Access Requirements
- ✅ Azure Portal access: [portal.azure.com](https://portal.azure.com)
- ✅ Permissions to create Azure SQL Server and databases
- ✅ Network access to configure firewall rules

---

## Phase 1: Create Azure SQL Resources

### Step 1: Create Azure SQL Server

1. **Sign in to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure account credentials

2. **Create SQL Server Resource**
   - Click **"+ Create a resource"** in the top-left corner
   - Search for **"SQL Server"** (not "SQL Database")
   - Click **"Create"**

3. **Configure SQL Server Settings**

   **Basics Tab:**
   ```
   Subscription: [Your Azure Subscription]
   Resource Group: [Create new or select existing]
                   Recommended: "beyti-platform-rg"

   Server Details:
   Server name: beyti-sql-server-[yourname]
                (must be globally unique, e.g., beyti-sql-server-ali)
   Location: [Choose closest region]
             Examples: "East US", "West Europe", "Southeast Asia"

   Authentication:
   Method: Use SQL authentication
   Server admin login: beyti_admin
   Password: [Create a strong password]
             Requirements:
             - At least 8 characters
             - Mix of uppercase, lowercase, numbers, special characters
   Confirm password: [Re-enter password]
   ```

   **⚠️ IMPORTANT**: Save your credentials securely!
   ```
   Server: beyti-sql-server-[yourname].database.windows.net
   Admin Login: beyti_admin
   Password: [your secure password]
   ```

4. **Configure Networking**
   - Click **"Next: Networking"**
   - **Allow Azure services**: Select **"Yes"**
   - **Add current client IP address**: Select **"Yes"** (allows your machine to connect)

5. **Review and Create**
   - Click **"Review + Create"**
   - Review all settings
   - Click **"Create"**
   - Wait for deployment (typically 2-3 minutes)

6. **Verify Deployment**
   - Once deployment completes, click **"Go to resource"**
   - Note the **Server name** (you'll need this for connections)

---

### Step 2: Create Beyti-V1 Database

1. **Navigate to Your SQL Server**
   - In Azure Portal, go to your SQL Server resource
   - Click **"+ Create database"** at the top

2. **Configure Beyti-V1 Database**

   **Basics:**
   ```
   Database name: Beyti-V1
   Server: [Your SQL Server from Step 1]
   Want to use SQL elastic pool?: No
   ```

   **Compute + Storage:**
   - Click **"Configure database"**

   **For Development Environment:**
   ```
   Service tier: Basic
   - DTUs: 5
   - Data max size: 2 GB
   - Estimated cost: ~$5/month
   ```

   **For Production Environment:**
   ```
   Service tier: Standard
   - Service level: S0 or S1
   - DTUs: 10-20
   - Data max size: 250 GB
   - Estimated cost: ~$15-30/month
   ```

   **Backup storage redundancy:**
   ```
   Locally-redundant backup storage (LRS)
   ```

3. **Review and Create**
   - Click **"Review + Create"**
   - Click **"Create"**
   - Wait for deployment (2-3 minutes)

---

### Step 3: Create Beyti-Identity Database

1. **Repeat Step 2 for Identity Database**
   - Navigate back to your SQL Server
   - Click **"+ Create database"**

2. **Configure Beyti-Identity Database**
   ```
   Database name: Beyti-Identity
   Compute + storage: Same as Beyti-V1 (Basic or Standard S0)
   Backup storage redundancy: Locally-redundant backup storage
   ```

3. **Review and Create**
   - Click **"Review + Create"**
   - Click **"Create"**
   - Wait for deployment

---

### Step 4: Configure Firewall Rules

1. **Navigate to SQL Server → Networking**
   - In Azure Portal, go to your SQL Server resource
   - Click **"Networking"** under Security section (left sidebar)

2. **Configure Public Network Access**
   ```
   Public network access: Selected networks
   ```

3. **Add Firewall Rules**

   **Your Development Machine:**
   - Under **Firewall rules**, verify your client IP is listed
   - If not, click **"+ Add client IP"**
   ```
   Rule name: Development-Machine
   Start IP: [Your current IP address]
   End IP: [Your current IP address]
   ```

   **Additional Team Members (Optional):**
   - Click **"+ Add firewall rule"**
   ```
   Rule name: TeamMember-[Name]
   Start IP: [Team member's IP]
   End IP: [Team member's IP]
   ```

4. **Allow Azure Services**
   - Check: **"Allow Azure services and resources to access this server"**
   - This enables Azure App Services to connect to your database

5. **Save Configuration**
   - Click **"Save"** at the top
   - Wait for confirmation

---

## Phase 2: Deploy Schema from SSMS

### Step 5: Connect SSMS to Azure SQL

1. **Open SQL Server Management Studio**
   - Launch SSMS on your local machine

2. **Create New Connection**
   - Click **"Connect"** → **"Database Engine"**

3. **Configure Connection Settings**
   ```
   Server type: Database Engine

   Server name: beyti-sql-server-[yourname].database.windows.net
                (Include the full .database.windows.net domain)

   Authentication: SQL Server Authentication

   Login: beyti_admin

   Password: [Your Azure SQL password from Step 1]

   Connection Security:
   Encryption: Mandatory (or check "Encrypt connection")
   Trust server certificate: No (leave unchecked)
   ```

4. **Connect to Server**
   - Click **"Connect"**
   - You should see your Azure SQL Server in Object Explorer

5. **Troubleshooting Connection Issues**

   If connection fails, verify:
   - ✅ Server name includes `.database.windows.net`
   - ✅ Your IP address is in the firewall rules
   - ✅ Username is `beyti_admin` (not `sa`)
   - ✅ SQL Authentication is enabled
   - ✅ Encryption is set to Mandatory

---

### Step 6: Modify BeytiV1.4.sql for Azure Compatibility

Azure SQL Database has different requirements than local SQL Server. You need to modify the script before deploying.

1. **Open BeytiV1.4.sql in a Text Editor**
   - Use Visual Studio Code, Notepad++, or SSMS

2. **Remove Unsupported Commands**

   **Delete these lines from the beginning of the file:**
   ```sql
   -- DELETE THESE (Lines 1-2 approximately):
   USE [master];
   GO

   -- DELETE THESE (Lines 3-4 approximately):
   CREATE DATABASE [Beyti-V1];
   GO
   ```

   **Delete all `ALTER DATABASE` statements:**
   ```sql
   -- DELETE ALL of these (Lines 5-68 approximately):
   ALTER DATABASE [Beyti-V1] SET COMPATIBILITY_LEVEL = 150;
   GO
   ALTER DATABASE [Beyti-V1] SET ANSI_NULL_DEFAULT OFF;
   GO
   -- ... (delete all ALTER DATABASE statements)
   ```

   **Reason**: Azure SQL manages these settings automatically through the portal.

3. **Add Database Context**

   **Add this at the very beginning of the script:**
   ```sql
   USE [Beyti-V1];
   GO
   ```

4. **Save Modified Script**
   - Save as `BeytiV1.4_Azure.sql` (keep original as backup)

---

### Step 7: Deploy Beyti-V1 Schema

1. **Open Modified Script in SSMS**
   - In SSMS connected to Azure SQL
   - File → Open → `BeytiV1.4_Azure.sql`

2. **Select Target Database**
   - In toolbar, select database: **Beyti-V1**
   - Or ensure script starts with `USE [Beyti-V1];`

3. **Execute Script**
   - Press **F5** or click **Execute**
   - Monitor the **Messages** tab for progress
   - Execution may take 2-5 minutes depending on schema size

4. **Review Results**
   - Check **Messages** tab for any errors
   - Common errors and fixes:
     ```
     Error: "Invalid object name..."
     Fix: Ensure script runs in correct order (tables before foreign keys)

     Error: "Syntax error near..."
     Fix: Check for unsupported T-SQL syntax
     ```

5. **Verify Tables Created**

   Run this verification query:
   ```sql
   USE [Beyti-V1];
   GO

   -- List all tables
   SELECT
       TABLE_SCHEMA,
       TABLE_NAME,
       TABLE_TYPE
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   ```

   **Expected tables include:**
   - AspNetUsers
   - Categories
   - Customers
   - Drivers
   - MembershipPlans
   - Orders
   - OrderItems
   - Products
   - Sellers
   - ServiceProviders
   - Services
   - UserProfiles
   - (and any other tables in your schema)

---

### Step 8: Deploy Beyti-Identity Schema

**Option A: Using SQL Script**

1. **If you have an Identity schema script:**
   - Modify it the same way as BeytiV1.4.sql (remove `USE [master]`, `CREATE DATABASE`, etc.)
   - Add `USE [Beyti-Identity];` at the beginning
   - Execute in SSMS connected to Azure SQL

**Option B: Using Entity Framework Migrations (Recommended)**

1. **Update Connection String** (see Phase 3 below first)

2. **Run EF Migrations**
   ```bash
   cd Beyti_Backend
   dotnet ef database update --context IdentityDbContext
   ```

3. **Verify Identity Tables**
   ```sql
   USE [Beyti-Identity];
   GO

   SELECT TABLE_NAME
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_TYPE = 'BASE TABLE'
   ORDER BY TABLE_NAME;
   ```

   **Expected tables:**
   - AspNetRoles
   - AspNetRoleClaims
   - AspNetUsers
   - AspNetUserClaims
   - AspNetUserLogins
   - AspNetUserRoles
   - AspNetUserTokens

---

### Step 9: Deploy Admin User

1. **Open create_admin_user.sql**
   - Locate the file in your project root

2. **Modify for Azure (if needed)**
   - Remove any `USE [master]` statements
   - Ensure it starts with:
     ```sql
     USE [Beyti-Identity];
     GO
     ```

3. **Execute Script**
   - In SSMS connected to Azure SQL
   - Select database: **Beyti-Identity**
   - Execute the script

4. **Verify Admin User Created**
   ```sql
   USE [Beyti-Identity];
   GO

   SELECT
       Id,
       UserName,
       Email,
       EmailConfirmed
   FROM AspNetUsers
   WHERE Email LIKE '%admin%';
   ```

---

## Phase 3: Update Connection Strings

### Step 10: Update Beyti_Backend Configuration

1. **Open appsettings.json**
   - Location: `Beyti_Backend/appsettings.json`

2. **Update IdentityConnection**

   **Before (Local):**
   ```json
   {
     "ConnectionStrings": {
       "IdentityConnection": "Server=(localdb)\\MSSQLLocalDB;Database=Beyti-Identity;Trusted_Connection=true;MultipleActiveResultSets=true"
     }
   }
   ```

   **After (Azure):**
   ```json
   {
     "ConnectionStrings": {
       "IdentityConnection": "Server=beyti-sql-server-[yourname].database.windows.net,1433;Initial Catalog=Beyti-Identity;Persist Security Info=False;User ID=beyti_admin;Password=[your-password];MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
     }
   }
   ```

   **⚠️ Replace:**
   - `[yourname]` with your actual server name
   - `[your-password]` with your actual password

---

### Step 11: Update Beyti-MVC Configuration

1. **Open appsettings.json**
   - Location: `Beyti-MVC/appsettings.json`

2. **Update BeytiConnection**

   **Before (Local):**
   ```json
   {
     "ConnectionStrings": {
       "BeytiConnection": "Server=(localdb)\\MSSQLLocalDB;Database=Beyti-V1;Trusted_Connection=True;"
     }
   }
   ```

   **After (Azure):**
   ```json
   {
     "ConnectionStrings": {
       "BeytiConnection": "Server=beyti-sql-server-[yourname].database.windows.net,1433;Initial Catalog=Beyti-V1;Persist Security Info=False;User ID=beyti_admin;Password=[your-password];MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
     }
   }
   ```

---

### Step 12: Secure Connection Strings (Production)

**⚠️ CRITICAL: Never commit passwords to Git!**

**Option 1: Use User Secrets (Development)**

```bash
cd Beyti_Backend

# Set connection string as user secret
dotnet user-secrets set "ConnectionStrings:IdentityConnection" "Server=beyti-sql-server-[name].database.windows.net,1433;..."

# Verify
dotnet user-secrets list
```

**Option 2: Use Environment Variables**

In `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "IdentityConnection": "#{AZURE_SQL_IDENTITY_CONNECTION}#"
  }
}
```

Set environment variable:
```bash
# Windows (PowerShell)
$env:AZURE_SQL_IDENTITY_CONNECTION="Server=..."

# Linux/Mac
export AZURE_SQL_IDENTITY_CONNECTION="Server=..."
```

**Option 3: Use Azure Key Vault (Production - Recommended)**

1. Create Azure Key Vault
2. Store connection strings as secrets
3. Configure App Service to reference Key Vault
4. Use managed identity for authentication

Example configuration:
```json
{
  "ConnectionStrings": {
    "IdentityConnection": "@Microsoft.KeyVault(SecretUri=https://beyti-keyvault.vault.azure.net/secrets/IdentityConnection/)"
  }
}
```

---

## Phase 4: Test Connection

### Step 13: Test Backend Connection

1. **Open Terminal in Backend Directory**
   ```bash
   cd Beyti_Backend
   ```

2. **Run the Application**
   ```bash
   dotnet run
   ```

3. **Watch for Connection Logs**
   ```
   info: Microsoft.EntityFrameworkCore.Database.Command[20101]
         Executed DbCommand (45ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
   ```

4. **Test API Endpoint**
   - Open browser or Postman
   - Navigate to: `https://localhost:7062/api/Categories`
   - Should return categories from Azure SQL database

5. **Success Indicators:**
   - ✅ No connection errors in console
   - ✅ API returns data successfully
   - ✅ Entity Framework logs show SQL commands executing

---

### Step 14: Test MVC Connection

1. **Open Terminal in MVC Directory**
   ```bash
   cd Beyti-MVC
   ```

2. **Run the Application**
   ```bash
   dotnet run
   ```

3. **Test in Browser**
   - Navigate to application URL (usually `https://localhost:5001`)
   - Test login functionality (uses Beyti-Identity)
   - Browse products/stores (uses Beyti-V1)

4. **Success Indicators:**
   - ✅ Login works with admin credentials
   - ✅ Data displays from database
   - ✅ No database connection errors

---

## Common Issues & Troubleshooting

### Issue 1: "Cannot open server requested by the login"

**Symptoms:**
```
A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible.
```

**Solutions:**
1. ✅ Verify server name includes `.database.windows.net`
2. ✅ Check firewall rules include your current IP address
3. ✅ Confirm public network access is enabled
4. ✅ Test connection from SSMS first before application

**Steps to Fix:**
```
1. Get your current IP: Visit https://www.whatismyip.com/
2. Azure Portal → SQL Server → Networking
3. Add your IP to firewall rules
4. Save and retry connection
```

---

### Issue 2: "Login failed for user 'beyti_admin'"

**Symptoms:**
```
Login failed for user 'beyti_admin'. (Microsoft SQL Server, Error: 18456)
```

**Solutions:**
1. ✅ Verify username is exactly `beyti_admin` (case-sensitive)
2. ✅ Check password is correct (no extra spaces)
3. ✅ Ensure SQL authentication is enabled
4. ✅ Confirm user has access to specific database

**Steps to Fix:**
```
1. Reset password in Azure Portal:
   SQL Server → Settings → SQL server admin
2. Use password reset option
3. Update connection strings with new password
4. Retry connection
```

---

### Issue 3: "CREATE DATABASE permission denied"

**Symptoms:**
```
CREATE DATABASE permission denied in database 'master'.
```

**Solutions:**
1. ✅ Don't try to create database via SQL script
2. ✅ Create databases through Azure Portal first
3. ✅ Remove `CREATE DATABASE` from all scripts
4. ✅ Use `USE [DatabaseName]` to switch context

---

### Issue 4: Backend Connection Timeout

**Symptoms:**
```
A connection was successfully established with the server, but then an error occurred during the login process.
```

**Solutions:**
1. ✅ Verify connection string format
2. ✅ Ensure port 1433 is specified
3. ✅ Confirm `Encrypt=True` is set
4. ✅ Check Azure services firewall rule is enabled

**Example Correct Connection String:**
```
Server=beyti-sql-server-ali.database.windows.net,1433;Initial Catalog=Beyti-V1;User ID=beyti_admin;Password=YourP@ssw0rd;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

---

### Issue 5: "Some features are not supported in Azure SQL Database"

**Unsupported Features:**

Azure SQL Database does NOT support:
- ❌ `USE [master]` for database creation
- ❌ `ALTER DATABASE ... SET ...` (most options)
- ❌ `FILESTREAM` and `FILETABLE`
- ❌ SQL Server Agent jobs (use Azure Automation instead)
- ❌ Linked servers
- ❌ Cross-database queries (use Elastic Query instead)
- ❌ `sp_configure` system stored procedure

**Workarounds:**
- Create databases through Azure Portal
- Let Azure manage database settings
- Use Azure Automation for scheduled jobs
- Use Elastic Query for cross-database operations

---

### Issue 6: Slow Performance

**Symptoms:**
- Queries taking longer than expected
- Timeouts during peak usage

**Solutions:**

1. **Check Service Tier:**
   ```
   Azure Portal → Database → Compute + storage
   Current tier: Basic (5 DTUs) - Upgrade if needed
   ```

2. **Monitor Query Performance:**
   ```
   Azure Portal → Database → Query Performance Insight
   Review slow queries and apply recommendations
   ```

3. **Add Missing Indexes:**
   ```sql
   -- Azure provides automatic index recommendations
   Azure Portal → Database → Performance recommendations
   Click "Apply" on recommended indexes
   ```

4. **Upgrade Service Tier:**
   ```
   Development: Basic (5 DTUs) → Standard S0 (10 DTUs)
   Production: Standard S1 (20 DTUs) → Standard S2 (50 DTUs)
   ```

---

## Monitoring & Maintenance

### Performance Monitoring

**Query Performance Insight:**
```
Azure Portal → Database → Query Performance Insight

Features:
- Top CPU consuming queries
- Top duration queries
- Top execution count queries
- Query execution timeline
```

**Metrics to Monitor:**
- DTU percentage (should stay below 80%)
- Storage percentage
- Failed connections
- Deadlocks
- Sessions count

---

### Backup Configuration

**Automatic Backups:**
- Azure SQL automatically backs up databases
- **Point-in-time restore**: 7 days (default)
- **Long-term retention**: Configure up to 10 years

**Configure Backup Retention:**
```
Azure Portal → Database → Data management → Backups
Set retention period: 7-35 days
Configure long-term retention if needed
```

**Test Restore Process:**
```
1. Azure Portal → Database → Overview
2. Click "Restore"
3. Select point in time
4. Specify target database name (test-restore)
5. Click "OK"
6. Verify restored data
7. Delete test database
```

---

### Scaling Strategy

**Manual Scaling:**
```
Azure Portal → Database → Compute + storage
1. Select service tier (Basic/Standard/Premium)
2. Adjust DTUs or vCores
3. Modify storage size
4. Click "Apply"
Note: Scaling typically takes 1-5 minutes
```

**Auto-Scaling (Serverless Tier):**
```
Consider for development environments:
- Automatically pauses when inactive
- Auto-resumes on first connection
- Saves costs during off-hours
```

---

### Security Features

**Enable Advanced Data Security:**
```
Azure Portal → SQL Server → Security → Microsoft Defender for SQL

Features:
- Vulnerability assessment
- Threat detection
- Data discovery & classification
- Security recommendations

Cost: ~$15/month per server
```

**Enable Auditing:**
```
Azure Portal → SQL Server → Security → Auditing

Configuration:
1. Enable auditing
2. Select storage account for logs
3. Configure retention (90+ days recommended)
4. Review audit logs regularly
```

**Transparent Data Encryption (TDE):**
- ✅ Enabled by default on all Azure SQL databases
- Encrypts data at rest
- No performance impact
- No application changes required

---

## Cost Optimization

### Development Environment

**Recommended Configuration:**
```
Service Tier: Basic
DTUs: 5
Storage: 2 GB
Estimated Cost: ~$5/month per database

Total for 2 databases (Beyti-V1 + Beyti-Identity): ~$10/month
```

**Cost Saving Tips:**
1. Use **Serverless** tier for dev/test
   - Auto-pause when inactive
   - Pay only for active time
   - Can save 50-70% vs. always-on

2. Delete test/staging databases when not in use

3. Use **Dev/Test pricing** (if eligible)
   - Requires Visual Studio subscription
   - Up to 55% savings

---

### Production Environment

**Recommended Starting Configuration:**
```
Service Tier: Standard S2
DTUs: 50
Storage: 250 GB
Estimated Cost: ~$75/month per database

Total for 2 databases: ~$150/month
```

**Scaling Based on Usage:**
```
0-1,000 users: Standard S1 (20 DTUs) - $30/month
1,000-5,000 users: Standard S2 (50 DTUs) - $75/month
5,000-10,000 users: Standard S3 (100 DTUs) - $150/month
10,000+ users: Premium P1+ or consider vCore model
```

---

### Cost Monitoring

**Set Up Budget Alerts:**
```
Azure Portal → Cost Management + Billing → Budgets
1. Create new budget
2. Set monthly limit (e.g., $200)
3. Configure alerts at 80% and 100%
4. Receive email notifications
```

**Use Azure Cost Management:**
```
Azure Portal → Cost Management + Billing → Cost analysis

Features:
- View spending by resource
- Forecast future costs
- Identify cost spikes
- Download cost reports
```

---

### Reserved Capacity (Long-Term Savings)

**For Production Workloads:**
```
Azure Portal → SQL Database → Reserved Capacity

Options:
- 1-year commitment: Up to 40% savings
- 3-year commitment: Up to 65% savings

Best for: Stable, predictable production workloads
Calculate savings at: Azure Pricing Calculator
```

---

## Security Best Practices

### Production Security Checklist

- ✅ **Never commit passwords to Git**
- ✅ Use Azure Key Vault for connection strings
- ✅ Enable Advanced Threat Protection
- ✅ Configure firewall to allow only specific IPs
- ✅ Enable auditing and review logs monthly
- ✅ Use managed identities instead of SQL auth (when possible)
- ✅ Rotate passwords every 90 days
- ✅ Enable multi-factor authentication for Azure Portal
- ✅ Use least-privilege access for database users
- ✅ Regularly review and remove unused firewall rules

---

### Connection String Security

**❌ BAD - Hardcoded in appsettings.json:**
```json
{
  "ConnectionStrings": {
    "BeytiConnection": "Server=...;Password=MyP@ssw0rd123;..."
  }
}
```

**✅ GOOD - Using Azure Key Vault:**
```json
{
  "ConnectionStrings": {
    "BeytiConnection": "@Microsoft.KeyVault(SecretUri=https://beyti-vault.vault.azure.net/secrets/BeytiConnection/)"
  }
}
```

**✅ GOOD - Using Environment Variables:**
```json
{
  "ConnectionStrings": {
    "BeytiConnection": "#{AZURE_SQL_CONNECTION}#"
  }
}
```

---

## Next Steps After Deployment

### 1. Deploy Backend to Azure App Service
```
Recommended:
- Use Azure App Service for .NET applications
- Configure continuous deployment from GitHub
- Set connection strings in App Service configuration
- Enable Application Insights for monitoring
```

### 2. Deploy Frontend to Azure Static Web Apps
```
Recommended:
- Use Azure Static Web Apps for React frontend
- Configure GitHub Actions for CI/CD
- Update API base URL to production backend
- Enable custom domain and SSL
```

### 3. Set Up CI/CD Pipeline
```
Options:
- Azure DevOps Pipelines
- GitHub Actions
- GitLab CI/CD

Include:
- Automated database migrations
- Integration tests before deployment
- Rollback procedures
```

### 4. Configure Monitoring
```
Enable:
- Application Insights (application telemetry)
- Azure Monitor (infrastructure metrics)
- Log Analytics (centralized logging)
- Alerts for critical errors and performance issues
```

---

## Support & Resources

### Official Documentation
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Connection Strings Reference](https://docs.microsoft.com/en-us/azure/azure-sql/database/connect-query-dotnet-core)
- [Security Best Practices](https://docs.microsoft.com/en-us/azure/azure-sql/database/security-best-practice)

### Azure Support
- **Azure Portal**: Built-in "Help + support" option
- **Community**: [Microsoft Q&A](https://docs.microsoft.com/en-us/answers/products/)
- **Stack Overflow**: Tag `azure-sql-database`

### Cost Calculators
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)
- [DTU Calculator](https://dtucalculator.azurewebsites.net/)

---

## Summary

You have successfully:
- ✅ Created Azure SQL Server and databases
- ✅ Configured firewall rules and networking
- ✅ Deployed database schemas from SSMS
- ✅ Updated backend connection strings
- ✅ Tested connections from applications
- ✅ Learned monitoring and maintenance best practices
- ✅ Understood cost optimization strategies
- ✅ Implemented security best practices

Your Beyti platform databases are now running on Microsoft Azure SQL Database with enterprise-grade security, automatic backups, and scalability!

---

**Document Version**: 1.0
**Last Updated**: 2025-12-26
**Maintained By**: Beyti Platform Team
