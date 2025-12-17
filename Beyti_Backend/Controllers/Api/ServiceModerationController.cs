using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;
using Beyti_Backend.Services;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceModerationController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly INotificationService _notificationService;

        public ServiceModerationController(BeytiContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/ServiceModeration/Statistics
        [HttpGet("Statistics")]
        public async Task<IActionResult> GetModerationStatistics()
        {
            try
            {
                var totalServices = await _context.Services.CountAsync();
                var activeServices = await _context.Services.CountAsync(s => s.IsActive);
                var inactiveServices = totalServices - activeServices;

                var recentServices = await _context.Services
                    .Where(s => s.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                    .CountAsync();

                return Ok(new
                {
                    totalServices,
                    activeServices,
                    inactiveServices,
                    recentServices
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ServiceModeration/Services
        [HttpGet("Services")]
        public async Task<IActionResult> GetServices(
            [FromQuery] bool? isActive = null,
            [FromQuery] string? search = null)
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

                var query = from s in _context.Services
                            join catalog in _context.ServiceCatalogs on s.ServiceCatalogId equals catalog.Id
                            join category in _context.ServiceCategories on catalog.ServiceCategoryId equals category.Id
                            join provider in _context.ServiceProviders on s.ServiceProviderId equals provider.Id
                            join userProfile in _context.UserProfiles on provider.UserProfileId equals userProfile.Id
                            select new {
                                Service = s,
                                CategoryName = category.Name,
                                SubCategoryName = catalog.Name,
                                ProviderName = userProfile.DisplayName,
                                ProviderId = provider.Id
                            };

                // Filter by active status
                if (isActive.HasValue)
                    query = query.Where(x => x.Service.IsActive == isActive.Value);

                // Search by name or description
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(x =>
                        x.Service.Name.Contains(search) ||
                        (x.Service.Description != null && x.Service.Description.Contains(search)) ||
                        x.ProviderName.Contains(search));

                var services = await query
                    .OrderByDescending(x => x.Service.CreatedAt)
                    .Select(x => new
                    {
                        id = x.Service.Id,
                        name = x.Service.Name,
                        description = x.Service.Description,
                        minPrice = x.Service.MinPrice,
                        maxPrice = x.Service.MaxPrice,
                        estimatedDuration = x.Service.EstimatedDuration,
                        isActive = x.Service.IsActive,
                        category = x.CategoryName,
                        subCategory = x.SubCategoryName,
                        providerName = x.ProviderName,
                        providerId = x.ProviderId,
                        createdAt = x.Service.CreatedAt,
                        flaggedKeywords = prohibitedKeywords
                            .Where(keyword =>
                                x.Service.Name.ToLower().Contains(keyword) ||
                                (x.Service.Description != null && x.Service.Description.ToLower().Contains(keyword))
                            )
                            .ToList()
                    })
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                // Log the full exception details for debugging
                Console.WriteLine($"Error in GetServices: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // GET: api/ServiceModeration/Services/5
        [HttpGet("Services/{id}")]
        public async Task<IActionResult> GetServiceDetails(int id)
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

                var service = await (from s in _context.Services
                                     join catalog in _context.ServiceCatalogs on s.ServiceCatalogId equals catalog.Id
                                     join category in _context.ServiceCategories on catalog.ServiceCategoryId equals category.Id
                                     join provider in _context.ServiceProviders on s.ServiceProviderId equals provider.Id
                                     join userProfile in _context.UserProfiles on provider.UserProfileId equals userProfile.Id
                                     where s.Id == id
                                     select new
                                     {
                                         id = s.Id,
                                         name = s.Name,
                                         description = s.Description,
                                         minPrice = s.MinPrice,
                                         maxPrice = s.MaxPrice,
                                         estimatedDuration = s.EstimatedDuration,
                                         isActive = s.IsActive,
                                         category = category.Name,
                                         subCategory = catalog.Name,
                                         providerName = userProfile.DisplayName,
                                         providerId = provider.Id,
                                         createdAt = s.CreatedAt,
                                         flaggedKeywords = prohibitedKeywords
                                             .Where(keyword =>
                                                 s.Name.ToLower().Contains(keyword) ||
                                                 (s.Description != null && s.Description.ToLower().Contains(keyword))
                                             )
                                             .ToList()
                                     }).FirstOrDefaultAsync();

                if (service == null)
                    return NotFound();

                return Ok(service);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetServiceDetails: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
            }
        }

        // PUT: api/ServiceModeration/Services/5/approve
        [HttpPut("Services/{id}/approve")]
        public async Task<IActionResult> ApproveService(int id, [FromQuery] int? adminUserProfileId)
        {
            try
            {
                var service = await _context.Services
                    .Include(s => s.ServiceProvider)
                        .ThenInclude(sp => sp.UserProfile)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (service == null) return NotFound();

                service.IsActive = true;

                await _context.SaveChangesAsync();

                // Get admin name for notification
                string adminInfo = "";
                if (adminUserProfileId.HasValue)
                {
                    var adminProfile = await _context.UserProfiles.FindAsync(adminUserProfileId.Value);
                    if (adminProfile != null)
                    {
                        adminInfo = $" by Administrator {adminProfile.DisplayName}";
                    }
                }

                // Send notification to the service provider
                await _notificationService.SendNotificationAsync(
                    recipientUserId: service.ServiceProvider.UserProfileId,
                    senderUserId: adminUserProfileId,
                    type: "service_approved",
                    title: "Service Approved",
                    body: $"Your service '{service.Name}' has been approved{adminInfo} and is now active. Customers can now book this service.",
                    relatedEntityType: "Service",
                    relatedEntityId: service.Id
                );

                return Ok(new { message = "Service approved successfully", service });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceModeration/Services/5/suspend
        [HttpPut("Services/{id}/suspend")]
        public async Task<IActionResult> SuspendService(int id, [FromQuery] int? adminUserProfileId, [FromBody] JsonElement body)
        {
            try
            {
                var service = await _context.Services
                    .Include(s => s.ServiceProvider)
                        .ThenInclude(sp => sp.UserProfile)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (service == null) return NotFound();

                service.IsActive = false;

                // You could add a reason field to track why it was suspended
                string? reason = null;
                if (body.TryGetProperty("reason", out var reasonProp))
                    reason = reasonProp.GetString();

                await _context.SaveChangesAsync();

                // Get admin name for notification
                string adminInfo = "";
                if (adminUserProfileId.HasValue)
                {
                    var adminProfile = await _context.UserProfiles.FindAsync(adminUserProfileId.Value);
                    if (adminProfile != null)
                    {
                        adminInfo = $" by Administrator {adminProfile.DisplayName}";
                    }
                }

                // Send notification to the service provider
                string notificationBody = $"Your service '{service.Name}' has been suspended{adminInfo} and is no longer available for booking.";
                if (!string.IsNullOrEmpty(reason))
                {
                    notificationBody += $" Reason: {reason}";
                }

                await _notificationService.SendNotificationAsync(
                    recipientUserId: service.ServiceProvider.UserProfileId,
                    senderUserId: adminUserProfileId,
                    type: "service_suspended",
                    title: "Service Suspended",
                    body: notificationBody,
                    relatedEntityType: "Service",
                    relatedEntityId: service.Id
                );

                return Ok(new
                {
                    message = "Service suspended successfully",
                    service,
                    reason
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/ServiceModeration/Services/5
        [HttpDelete("Services/{id}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            try
            {
                var service = await _context.Services.FindAsync(id);

                if (service == null) return NotFound();

                _context.Services.Remove(service);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Service deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
