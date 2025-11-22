using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashboardController : ControllerBase
    {
        private readonly BeytiContext _context;

        public AdminDashboardController(BeytiContext context)
        {
            _context = context;
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
                if (!string.IsNullOrEmpty(newDisplayName))
                    user.DisplayName = newDisplayName;

                if (!string.IsNullOrEmpty(newStatus))
                    user.Status = newStatus;

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
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
                        _context.AdminProfiles.Add(new AdminProfile { UserProfileId = userProfile.Id, Title = userProfile.DisplayName, Permissions = "All" , CreatedAt = DateTime.UtcNow });
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

            user.Status = user.Status == "Active" ? "Inactive" : "Active";
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
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
                    businessName = p.ServiceProvider.BusinessName,
                    p.Status,
                    p.Notes,
                    p.CreatedAt
                })
                .Where(p => p.Status == "Pending") // Only pending requests
                .ToListAsync();

            return Ok(requests);
        }

        // PATCH: api/AdminDashboard/ServiceProviderRequests/5/approve
        [HttpPatch("ServiceProviderRequests/{id}/approve")]
        public async Task<IActionResult> ApproveServiceProviderRequest(int id)
        {
            var request = await _context.ProviderApplications
                .Include(p => p.ServiceProvider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (request == null) return NotFound();

            request.Status = "Approved";
            request.ServiceProvider.Status = "Active";
            request.ServiceProvider.VerifiedAt = DateTime.UtcNow;
            request.UpdatedAt = DateTime.UtcNow;
            request.ServiceProvider.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(request);
        }

        // PATCH: api/AdminDashboard/ServiceProviderRequests/5/reject
        [HttpPatch("ServiceProviderRequests/{id}/reject")]
        public async Task<IActionResult> RejectServiceProviderRequest(int id)
        {
            var request = await _context.ProviderApplications
                .Include(p => p.ServiceProvider)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (request == null) return NotFound();

            request.Status = "Rejected";
            request.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(request);
        }
    }
}