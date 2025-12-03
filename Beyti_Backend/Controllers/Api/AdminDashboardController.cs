using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;
using Beyti_Backend.Services;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashboardController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly INotificationService _notificationService;

        public AdminDashboardController(BeytiContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("Users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role = null)
        {
            var query = _context.UserProfiles.AsQueryable();
            
            // Apply role filter if provided and not "All"
            if (!string.IsNullOrEmpty(role) && role != "All")
            {
                query = query.Where(u => u.RoleType == role);
            }

            var users = await query
                .Select(u => new
                {
                    u.Id,
                    u.DisplayName,
                    u.RoleType,
                    u.Status,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // PUT: api/AdminDashboard/Users/5
        [HttpPut("Users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, JsonElement body)
        {
            var user = await _context.UserProfiles.FindAsync(id);
            if (user == null) return NotFound();

            string? newDisplayName = null;
            string? newRoleType = null;
            string? newStatus = null;

            if (body.TryGetProperty("displayName", out var displayNameProp))
                newDisplayName = displayNameProp.GetString();

            if (body.TryGetProperty("roleType", out var roleTypeProp))
                newRoleType = roleTypeProp.GetString();

            if (body.TryGetProperty("status", out var statusProp))
                newStatus = statusProp.GetString();

            // Check if role is being changed
            if (!string.IsNullOrEmpty(newRoleType) && newRoleType != user.RoleType)
            {
                // Mark current user as "Role Changed"
                user.Status = "Role Changed";
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Create new UserProfile with the new role
                var newUser = new UserProfile
                {
                    IdentityUserId = Guid.NewGuid().ToString(),
                    DisplayName = newDisplayName ?? user.DisplayName,
                    RoleType = newRoleType,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.UserProfiles.Add(newUser);
                await _context.SaveChangesAsync();

                // Add role-specific child record for the new user
                switch (newRoleType)
                {
                    case "Seller":
                        _context.Sellers.Add(new Seller { UserProfileId = newUser.Id, StoreName = "Default Store", Phone = "N/A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Customer":
                        _context.Customers.Add(new Customer { UserProfileId = newUser.Id, Phone = "N/A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Driver":
                        _context.Drivers.Add(new Driver { UserProfileId = newUser.Id, Phone = "N/A", Status = "Active", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "ServiceProvider":
                        _context.ServiceProviders.Add(new BeytiDB.Data.ServiceProvider { UserProfileId = newUser.Id, BusinessName = "Default Business", Phone = "N/A", Status = "Available", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Admin":
                        _context.AdminProfiles.Add(new AdminProfile { UserProfileId = newUser.Id, Title = newUser.DisplayName, Permissions = "All", CreatedAt = DateTime.UtcNow });
                        break;
                    default:
                        return BadRequest("Invalid RoleType");
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Role changed. New user created.",
                    oldUser = new { user.Id, user.DisplayName, user.RoleType, user.Status },
                    newUser = new { newUser.Id, newUser.DisplayName, newUser.RoleType, newUser.Status }
                });
            }
            else
            {
                // Normal update (no role change)
                bool statusChanged = false;
                string oldStatus = user.Status;

                if (!string.IsNullOrEmpty(newDisplayName))
                    user.DisplayName = newDisplayName;

                if (!string.IsNullOrEmpty(newStatus) && newStatus != user.Status)
                {
                    user.Status = newStatus;
                    statusChanged = true;
                }

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send notification if status changed
                if (statusChanged && newStatus != null)
                {
                    string notificationTitle = "Account Status Updated";
                    string notificationBody = $"Your account status has been changed from {oldStatus} to {newStatus} by an administrator.";
                    string notificationType = newStatus.ToLower() switch
                    {
                        "active" => "status_activated",
                        "inactive" => "status_deactivated",
                        "suspended" => "status_suspended",
                        _ => "status_changed"
                    };

                    await _notificationService.SendNotificationAsync(
                        recipientUserId: user.Id,
                        senderUserId: null,
                        type: notificationType,
                        title: notificationTitle,
                        body: notificationBody,
                        relatedEntityType: "UserProfile",
                        relatedEntityId: user.Id
                    );
                }

                return Ok(user);
            }
        }

        [HttpPost("Users")]
        public async Task<ActionResult> AddUser([FromBody] UserProfile userProfile)
        {
            try
            {
                if (string.IsNullOrEmpty(userProfile.IdentityUserId))
                    userProfile.IdentityUserId = Guid.NewGuid().ToString();

                userProfile.CreatedAt = DateTime.UtcNow;
                userProfile.UpdatedAt = DateTime.UtcNow;
                if (string.IsNullOrEmpty(userProfile.Status))
                    userProfile.Status = "Active";

                _context.UserProfiles.Add(userProfile);
                await _context.SaveChangesAsync();

                // Add role-specific child records
                switch (userProfile.RoleType)
                {
                    case "Seller":
                        _context.Sellers.Add(new Seller { UserProfileId = userProfile.Id, StoreName = "Default Store", Phone = "N/A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Customer":
                        _context.Customers.Add(new Customer { UserProfileId = userProfile.Id, Phone = "N/A", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Driver":
                        _context.Drivers.Add(new Driver { UserProfileId = userProfile.Id, Phone = "N/A", Status = "Active", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "ServiceProvider":
                        _context.ServiceProviders.Add(new BeytiDB.Data.ServiceProvider { UserProfileId = userProfile.Id, BusinessName = "Default Business", Phone = "N/A", Status = "Available", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
                        break;
                    case "Admin":
                        _context.AdminProfiles.Add(new AdminProfile { UserProfileId = userProfile.Id, Title = userProfile.DisplayName, Permissions = "All", CreatedAt = DateTime.UtcNow });
                        break;
                    default:
                        return BadRequest("Invalid RoleType");
                }

                await _context.SaveChangesAsync();

                // Return minimal user data to avoid serialization issues
                return CreatedAtAction(nameof(GetUsers), new { id = userProfile.Id }, new
                {
                    userProfile.Id,
                    userProfile.DisplayName,
                    userProfile.RoleType,
                    userProfile.Status,
                    userProfile.CreatedAt,
                    userProfile.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error adding user: {ex.Message}");
            }
        }

        // PATCH: api/AdminDashboard/Users/5/toggle
        [HttpPatch("Users/{id}/toggle")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.UserProfiles.FindAsync(id);
            if (user == null) return NotFound();

            string oldStatus = user.Status;
            user.Status = user.Status == "Active" ? "Inactive" : "Active";
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Send notification about status toggle
            string notificationTitle = user.Status == "Active" ? "Account Activated" : "Account Deactivated";
            string notificationBody = $"Your account has been {(user.Status == "Active" ? "activated" : "deactivated")} by an administrator.";
            string notificationType = user.Status == "Active" ? "status_activated" : "status_deactivated";

            await _notificationService.SendNotificationAsync(
                recipientUserId: user.Id,
                senderUserId: null,
                type: notificationType,
                title: notificationTitle,
                body: notificationBody,
                relatedEntityType: "UserProfile",
                relatedEntityId: user.Id
            );

            return Ok(user);
        }


        // GET: api/AdminDashboard/ServiceProviderRequests
        [HttpGet("ServiceProviderRequests")]
        public async Task<IActionResult> GetServiceProviderRequests()
        {
            var requests = await _context.ProviderApplications
                .Include(p => p.ServiceProvider)
                    .ThenInclude(s => s.UserProfile)
                .Select(p => new
                {
                    p.Id,
                    p.ServiceProviderId,
                    userDisplayName = p.ServiceProvider.UserProfile.DisplayName,
                    userRoleType = p.ServiceProvider.UserProfile.RoleType,
                    businessName = p.ServiceProvider.BusinessName,
                    p.Status,
                    p.Notes,
                    p.CreatedAt,
                    p.UpdatedAt
                })
                .ToListAsync();

            return Ok(requests);
        }

        // PATCH: api/AdminDashboard/ServiceProviderRequests/5/approve
        [HttpPatch("ServiceProviderRequests/{id}/approve")]
        public async Task<IActionResult> ApproveServiceProviderRequest(int id)
        {
            try
            {
                var request = await _context.ProviderApplications
                    .Include(p => p.ServiceProvider)
                        .ThenInclude(sp => sp.UserProfile)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (request == null) return NotFound();

                // Update application status
                request.Status = "Approved";
                request.UpdatedAt = DateTime.UtcNow;

                // Update service provider
                request.ServiceProvider.Status = "Available"; // Set to Available (not Active)
                request.ServiceProvider.VerifiedAt = DateTime.UtcNow;
                request.ServiceProvider.UpdatedAt = DateTime.UtcNow;

                // Update user profile status (for account activation)
                request.ServiceProvider.UserProfile.Status = "Active";
                request.ServiceProvider.UserProfile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send notification to the service provider
                await _notificationService.SendNotificationAsync(
                    recipientUserId: request.ServiceProvider.UserProfileId,
                    senderUserId: null,
                    type: "application_approved",
                    title: "Application Approved",
                    body: "Congratulations! Your service provider application has been approved. You can now start accepting service requests.",
                    relatedEntityType: "ProviderApplication",
                    relatedEntityId: request.Id
                );

                return Ok(new
                {
                    message = "Request approved successfully",
                    applicationId = request.Id,
                    serviceProviderId = request.ServiceProviderId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // PATCH: api/AdminDashboard/ServiceProviderRequests/5/reject
        [HttpPatch("ServiceProviderRequests/{id}/reject")]
        public async Task<IActionResult> RejectServiceProviderRequest(int id)
        {
            try
            {
                var request = await _context.ProviderApplications
                    .Include(p => p.ServiceProvider)
                        .ThenInclude(sp => sp.UserProfile)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (request == null) return NotFound();

                // Update application status
                request.Status = "Rejected";
                request.UpdatedAt = DateTime.UtcNow;

                // Optionally set service provider as unavailable
                request.ServiceProvider.Status = "Unavailable";
                request.ServiceProvider.UpdatedAt = DateTime.UtcNow;

                // Optionally deactivate user profile
                request.ServiceProvider.UserProfile.Status = "Inactive";
                request.ServiceProvider.UserProfile.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send notification to the service provider
                await _notificationService.SendNotificationAsync(
                    recipientUserId: request.ServiceProvider.UserProfileId,
                    senderUserId: null,
                    type: "application_rejected",
                    title: "Application Rejected",
                    body: "Your service provider application has been reviewed and unfortunately was not approved at this time. Please contact support for more information.",
                    relatedEntityType: "ProviderApplication",
                    relatedEntityId: request.Id
                );

                return Ok(new
                {
                    message = "Request rejected successfully",
                    applicationId = request.Id,
                    serviceProviderId = request.ServiceProviderId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // GET: api/AdminDashboard/Statistics
        [HttpGet("Statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                // Total Users (Active)
                var totalUsers = await _context.UserProfiles
                    .CountAsync(u => u.Status == "Active");

                // Users by Role
                var customers = await _context.UserProfiles
                    .CountAsync(u => u.RoleType == "Customer" && u.Status == "Active");

                var sellers = await _context.UserProfiles
                    .CountAsync(u => u.RoleType == "Seller" && u.Status == "Active");

                var drivers = await _context.UserProfiles
                    .CountAsync(u => u.RoleType == "Driver" && u.Status == "Active");

                var serviceProviders = await _context.UserProfiles
                    .CountAsync(u => u.RoleType == "ServiceProvider" && u.Status == "Active");

                var admins = await _context.UserProfiles
                    .CountAsync(u => u.RoleType == "Admin" && u.Status == "Active");

                // Total Sales (from Orders)
                var completedStatuses = new[] { "Completed", "Delivered" };
                var totalSales = await _context.Orders
                    .Where(o => completedStatuses.Contains(o.Status))
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                var totalOrders = await _context.Orders
                    .Where(o => completedStatuses.Contains(o.Status))
                    .CountAsync();

                // Pending Orders
                var pendingOrders = await _context.Orders
                    .CountAsync(o => o.Status == "Pending" || o.Status == "Processing");

                // Active Listings (Products)
                var activeListings = await _context.Products
                    .CountAsync(p => p.IsActive);

                // Total Products
                var totalProducts = await _context.Products.CountAsync();

                // Available Service Providers
                var availableServiceProviders = await _context.ServiceProviders
                    .CountAsync(sp => sp.Status == "Available");

                // Recent Activities (last 7 days)
                var weekAgo = DateTime.UtcNow.AddDays(-7);
                var recentUsers = await _context.UserProfiles
                    .CountAsync(u => u.CreatedAt >= weekAgo);

                var recentOrders = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= weekAgo);

                // Pending Service Provider Requests
                var pendingRequests = await _context.ProviderApplications
                    .CountAsync(p => p.Status == "Pending");

                // Membership Statistics
                var activeMemberships = await _context.UserMemberships
                    .Where(m => m.Status == "Active")
                    .GroupBy(m => m.UserProfile.RoleType)
                    .Select(g => new { Role = g.Key, Count = g.Count() })
                    .ToListAsync();

                var sellerMemberships = activeMemberships.FirstOrDefault(m => m.Role == "Seller")?.Count ?? 0;
                var serviceProviderMemberships = activeMemberships.FirstOrDefault(m => m.Role == "ServiceProvider")?.Count ?? 0;
                var driverMemberships = activeMemberships.FirstOrDefault(m => m.Role == "Driver")?.Count ?? 0;

                // Monthly revenue (last 30 days)
                var monthAgo = DateTime.UtcNow.AddDays(-30);
                var monthlyRevenue = await _context.Orders
                    .Where(o => completedStatuses.Contains(o.Status) && o.CreatedAt >= monthAgo)
                    .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

                return Ok(new
                {
                    totalUsers,
                    usersByRole = new
                    {
                        customers,
                        sellers,
                        drivers,
                        serviceProviders,
                        admins
                    },
                    sales = new
                    {
                        total = totalSales,
                        totalOrders,
                        pendingOrders,
                        monthlyRevenue,
                        recentOrders
                    },
                    listings = new
                    {
                        active = activeListings,
                        total = totalProducts
                    },
                    serviceProviders = new
                    {
                        available = availableServiceProviders,
                        pendingRequests
                    },
                    memberships = new
                    {
                        sellers = sellerMemberships,
                        serviceProviders = serviceProviderMemberships,
                        drivers = driverMemberships,
                        total = activeMemberships.Sum(m => m.Count)
                    },
                    recentActivity = new
                    {
                        newUsers = recentUsers,
                        newOrders = recentOrders
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error fetching statistics: {ex.Message}");
            }
        }
        // GET: api/AdminDashboard/FlaggedUsers
        [HttpGet("FlaggedUsers")]
        public async Task<IActionResult> GetFlaggedUsers()
        {
            try
            {
                // Prohibited keywords for content moderation
                var prohibitedKeywords = new[]
                {
            "drug", "drugs", "cocaine", "heroin", "marijuana", "weed", "cannabis", "meth",
            "cigarette", "cigar", "tobacco", "vape", "e-cigarette", "smoking",
            "weapon", "gun", "rifle", "pistol", "ammunition", "firearm", "knife",
            "alcohol", "beer", "wine", "vodka", "whiskey", "liquor",
            "porn", "adult", "xxx", "explicit", "sex"
        };

                // Get ALL suspended users (across all roles)
                var suspendedUsers = await _context.UserProfiles
                    .Where(u => u.Status == "Suspended" || u.Status == "Inactive")
                    .Select(u => new
                    {
                        userId = u.Id,
                        name = u.DisplayName,
                        roleType = u.RoleType,
                        status = u.Status,
                        createdAt = u.CreatedAt,
                        updatedAt = u.UpdatedAt,
                        suspensionType = "Account Suspended"
                    })
                    .ToListAsync();

                // Flag sellers with violations (NOT suspended)
                var flaggedSellers = await _context.Sellers
                    .Include(s => s.UserProfile)
                    .Include(s => s.Products)
                    .Where(s =>
                        s.UserProfile.Status == "Active" && ( // Only active accounts (not suspended)
                            s.Products.Any(p => !p.IsActive) || // Has inactive products
                            s.Products.Any(p =>
                                prohibitedKeywords.Any(keyword =>
                                    p.Name.ToLower().Contains(keyword) ||
                                    (p.Description != null && p.Description.ToLower().Contains(keyword))
                                )
                            ) // Has products with prohibited keywords
                        )
                    )
                    .Select(s => new
                    {
                        userId = s.UserProfileId,
                        sellerId = s.Id,
                        type = "Seller",
                        name = s.UserProfile.DisplayName,
                        storeName = s.StoreName,
                        phone = s.Phone,
                        userStatus = s.UserProfile.Status,
                        totalProducts = s.Products.Count,
                        inactiveProducts = s.Products.Count(p => !p.IsActive),
                        activeProducts = s.Products.Count(p => p.IsActive),
                        inappropriateProducts = s.Products.Count(p =>
                            prohibitedKeywords.Any(keyword =>
                                p.Name.ToLower().Contains(keyword) ||
                                (p.Description != null && p.Description.ToLower().Contains(keyword))
                            )
                        ),
                        createdAt = s.CreatedAt,
                        updatedAt = s.UpdatedAt,
                        flagReason = s.Products.Any(p =>
                            prohibitedKeywords.Any(keyword =>
                                p.Name.ToLower().Contains(keyword) ||
                                (p.Description != null && p.Description.ToLower().Contains(keyword))
                            )
                        ) ? "Inappropriate Content" : "Inactive Products"
                    })
                    .ToListAsync();

                // Flag service providers with issues (NOT suspended)
                var flaggedServiceProviders = await _context.ServiceProviders
                    .Include(sp => sp.UserProfile)
                    .Where(sp =>
                        sp.UserProfile.Status == "Active" && // Only active accounts
                        sp.Status == "Unavailable" // Provider marked as unavailable
                    )
                    .Select(sp => new
                    {
                        userId = sp.UserProfileId,
                        serviceProviderId = sp.Id,
                        type = "ServiceProvider",
                        name = sp.UserProfile.DisplayName,
                        businessName = sp.BusinessName,
                        phone = sp.Phone,
                        availabilityStatus = sp.Status,
                        userStatus = sp.UserProfile.Status,
                        createdAt = sp.CreatedAt,
                        updatedAt = sp.UpdatedAt,
                        verifiedAt = sp.VerifiedAt,
                        flagReason = "Marked as Unavailable"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    suspendedUsers,
                    sellers = flaggedSellers,
                    serviceProviders = flaggedServiceProviders,
                    totalSuspended = suspendedUsers.Count,
                    totalFlagged = flaggedSellers.Count + flaggedServiceProviders.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/AdminDashboard/UserViolations/5 - Updated to show inappropriate content
        [HttpGet("UserViolations/{userId}")]
        public async Task<IActionResult> GetUserViolations(int userId)
        {
            try
            {
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null) return NotFound();

                var violations = new List<object>();

                // Prohibited keywords
                var prohibitedKeywords = new[]
                {
            "drug", "drugs", "cocaine", "heroin", "marijuana", "weed", "cannabis", "meth",
            "cigarette", "cigar", "tobacco", "vape", "e-cigarette", "smoking",
            "weapon", "gun", "rifle", "pistol", "ammunition", "firearm", "knife",
            "alcohol", "beer", "wine", "vodka", "whiskey", "liquor",
            "porn", "adult", "xxx", "explicit", "sex"
        };

                // Check if user is a seller
                var seller = await _context.Sellers
                    .Include(s => s.Products)
                    .FirstOrDefaultAsync(s => s.UserProfileId == userId);

                if (seller != null)
                {
                    // Get inactive products
                    var inactiveProducts = seller.Products
                        .Where(p => !p.IsActive)
                        .Select(p => new
                        {
                            p.Id,
                            p.Name,
                            p.Description,
                            p.BasePrice,
                            p.IsActive,
                            p.CreatedAt,
                            p.UpdatedAt,
                            violationType = "Inactive Product",
                            flaggedKeywords = new List<string>()
                        })
                        .ToList();

                    violations.AddRange(inactiveProducts);

                    // Get products with inappropriate content
                    var inappropriateProducts = seller.Products
                        .Where(p =>
                            prohibitedKeywords.Any(keyword =>
                                p.Name.ToLower().Contains(keyword) ||
                                (p.Description != null && p.Description.ToLower().Contains(keyword))
                            )
                        )
                        .Select(p => new
                        {
                            p.Id,
                            p.Name,
                            p.Description,
                            p.BasePrice,
                            p.IsActive,
                            p.CreatedAt,
                            p.UpdatedAt,
                            violationType = p.IsActive ? "Inappropriate Content (Active)" : "Inappropriate Content (Inactive)",
                            flaggedKeywords = prohibitedKeywords
                                .Where(keyword =>
                                    p.Name.ToLower().Contains(keyword) ||
                                    (p.Description != null && p.Description.ToLower().Contains(keyword))
                                )
                                .ToList()
                        })
                        .ToList();

                    violations.AddRange(inappropriateProducts);
                }

                // Check if user is a service provider
                var serviceProvider = await _context.ServiceProviders
                    .FirstOrDefaultAsync(sp => sp.UserProfileId == userId);

                if (serviceProvider != null)
                {
                    if (serviceProvider.Status == "Unavailable")
                    {
                        violations.Add(new
                        {
                            id = serviceProvider.Id,
                            name = serviceProvider.BusinessName,
                            description = "Service provider marked as unavailable",
                            status = serviceProvider.Status,
                            createdAt = serviceProvider.CreatedAt,
                            updatedAt = serviceProvider.UpdatedAt,
                            violationType = "Unavailable Service",
                            flaggedKeywords = new List<string>()
                        });
                    }

                    if (user.Status == "Inactive")
                    {
                        violations.Add(new
                        {
                            id = serviceProvider.Id,
                            name = serviceProvider.BusinessName,
                            description = "Service provider account is inactive",
                            status = user.Status,
                            createdAt = serviceProvider.CreatedAt,
                            updatedAt = serviceProvider.UpdatedAt,
                            violationType = "Inactive Account",
                            flaggedKeywords = new List<string>()
                        });
                    }
                }

                return Ok(new
                {
                    userId,
                    userName = user.DisplayName,
                    roleType = user.RoleType,
                    userStatus = user.Status,
                    totalViolations = violations.Count,
                    violations
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/AdminDashboard/SuspendUser/5
        [HttpPut("SuspendUser/{userId}")]
        public async Task<IActionResult> SuspendUser(int userId, [FromBody] JsonElement body)
        {
            try
            {
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null) return NotFound();

                string? reason = null;
                if (body.TryGetProperty("reason", out var reasonProp))
                    reason = reasonProp.GetString();

                // Suspend the UserProfile (account level)
                user.Status = "Suspended"; // Changed from "Inactive" to "Suspended"
                user.UpdatedAt = DateTime.UtcNow;

                // Handle role-specific suspensions
                if (user.RoleType == "Seller")
                {
                    var seller = await _context.Sellers
                        .Include(s => s.Products)
                        .FirstOrDefaultAsync(s => s.UserProfileId == userId);

                    if (seller != null)
                    {
                        seller.UpdatedAt = DateTime.UtcNow;

                        // Deactivate all their products
                        foreach (var product in seller.Products)
                        {
                            product.IsActive = false;
                            product.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }
                else if (user.RoleType == "ServiceProvider")
                {
                    var serviceProvider = await _context.ServiceProviders
                        .FirstOrDefaultAsync(sp => sp.UserProfileId == userId);

                    if (serviceProvider != null)
                    {
                        // Keep availability status separate - mark as Suspended in a note
                        // Or you could add a IsSuspended boolean field
                        serviceProvider.Status = "Unavailable";
                        serviceProvider.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else if (user.RoleType == "Driver")
                {
                    var driver = await _context.Drivers
                        .FirstOrDefaultAsync(d => d.UserProfileId == userId);

                    if (driver != null)
                    {
                        driver.Status = "Suspended"; // Changed from "Inactive"
                        driver.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                // Send notification to the suspended user
                await _notificationService.SendNotificationAsync(
                    recipientUserId: userId,
                    senderUserId: null,
                    type: "account_suspended",
                    title: "Account Suspended",
                    body: reason ?? "Your account has been suspended by an administrator. Please contact support for more information.",
                    relatedEntityType: "UserProfile",
                    relatedEntityId: userId
                );

                return Ok(new
                {
                    message = "User suspended successfully",
                    userId,
                    reason,
                    userStatus = user.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/AdminDashboard/ReactivateUser/5
        [HttpPut("ReactivateUser/{userId}")]
        public async Task<IActionResult> ReactivateUser(int userId)
        {
            try
            {
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null) return NotFound();

                // Reactivate the UserProfile
                user.Status = "Active";
                user.UpdatedAt = DateTime.UtcNow;

                // Handle role-specific reactivations
                if (user.RoleType == "ServiceProvider")
                {
                    var serviceProvider = await _context.ServiceProviders
                        .FirstOrDefaultAsync(sp => sp.UserProfileId == userId);

                    if (serviceProvider != null)
                    {
                        // Set back to Available
                        serviceProvider.Status = "Available";
                        serviceProvider.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else if (user.RoleType == "Driver")
                {
                    var driver = await _context.Drivers
                        .FirstOrDefaultAsync(d => d.UserProfileId == userId);

                    if (driver != null)
                    {
                        driver.Status = "Active";
                        driver.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();

                // Send notification to the reactivated user
                await _notificationService.SendNotificationAsync(
                    recipientUserId: userId,
                    senderUserId: null,
                    type: "account_reactivated",
                    title: "Account Reactivated",
                    body: "Your account has been reactivated by an administrator. You can now access all features.",
                    relatedEntityType: "UserProfile",
                    relatedEntityId: userId
                );

                return Ok(new
                {
                    message = "User reactivated successfully",
                    userId,
                    userStatus = user.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
