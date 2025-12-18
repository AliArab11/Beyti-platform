using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceProvidersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceProvidersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceProviders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServiceProviders()
        {
            var providers = await _context.ServiceProviders
                .Include(sp => sp.UserProfile)
                .Include(sp => sp.ServiceReviews)
                .Where(sp => sp.UserProfile.Status == "Active" && sp.UserProfile.RoleType == "ServiceProvider")
                .Select(sp => new
                {
                    sp.Id,
                    sp.UserProfileId,
                    sp.ServiceCategoryId,
                    sp.BusinessName,
                    sp.Phone,
                    sp.MinServicePrice,
                    sp.MaxServicePrice,
                    sp.Status,
                    sp.CreatedAt,
                    sp.UpdatedAt,
                    sp.VerifiedAt,
                    DisplayName = sp.UserProfile != null && !string.IsNullOrEmpty(sp.UserProfile.DisplayName)
                        ? sp.UserProfile.DisplayName
                        : sp.BusinessName,
                    AverageRating = sp.ServiceReviews.Any(r => !r.IsHidden)
                        ? sp.ServiceReviews.Where(r => !r.IsHidden).Average(r => (double)r.OverallRating)
                        : 0,
                    ReviewCount = sp.ServiceReviews.Count(r => !r.IsHidden)
                })
                .ToListAsync();

            return Ok(providers);
        }

        // GET: api/ServiceProviders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BeytiDB.Data.ServiceProvider>> GetServiceProvider(int id)
        {
            var provider = await _context.ServiceProviders.FindAsync(id);
            if (provider == null)
                return NotFound();
            return provider;
        }

        // GET: api/ServiceProviders/5/services
        [HttpGet("{id}/services")]
        public async Task<ActionResult<IEnumerable<object>>> GetServiceProviderServices(int id)
        {
            var provider = await _context.ServiceProviders.FindAsync(id);
            if (provider == null)
                return NotFound("Service provider not found");

            Console.WriteLine($"[GetServiceProviderServices] Fetching services for provider ID: {id}");

            // First check if Service table has any data at all
            var totalServices = await _context.Services.CountAsync();
            Console.WriteLine($"[GetServiceProviderServices] Total services in database: {totalServices}");

            // Check services for this specific provider
            var providerServiceCount = await _context.Services
                .Where(s => s.ServiceProviderId == id)
                .CountAsync();
            Console.WriteLine($"[GetServiceProviderServices] Services for provider {id}: {providerServiceCount}");

            var services = await _context.Services
                .Include(s => s.ServiceCatalog)
                    .ThenInclude(sc => sc.ServiceCategory)
                .Include(s => s.ServiceBookings)
                    .ThenInclude(sb => sb.ServiceReviews)
                .Where(s => s.ServiceProviderId == id)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.MinPrice,
                    s.MaxPrice,
                    s.EstimatedDuration,
                    s.IsActive,
                    ServiceCatalogId = s.ServiceCatalogId,
                    ServiceCatalogName = s.ServiceCatalog.Name,
                    ServiceCategoryId = s.ServiceCatalog.ServiceCategoryId,
                    ServiceCategoryName = s.ServiceCatalog.ServiceCategory.Name,
                    // Calculate average rating from service reviews
                    AverageRating = s.ServiceBookings
                        .SelectMany(sb => sb.ServiceReviews)
                        .Where(sr => !sr.IsHidden)
                        .Average(sr => (double?)sr.OverallRating) ?? 0,
                    ReviewCount = s.ServiceBookings
                        .SelectMany(sb => sb.ServiceReviews)
                        .Count(sr => !sr.IsHidden),
                    s.CreatedAt
                })
                .ToListAsync();

            Console.WriteLine($"[GetServiceProviderServices] Returning {services.Count} services");
            return Ok(services);
        }

        // PUT: api/ServiceProviders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceProvider(int id, JsonElement body)
        {
            var provider = await _context.ServiceProviders.FindAsync(id);
            if (provider == null) return NotFound();

            if (body.TryGetProperty("businessName", out var businessNameProp))
                provider.BusinessName = businessNameProp.GetString() ?? provider.BusinessName;

            if (body.TryGetProperty("phone", out var phoneProp))
                provider.Phone = phoneProp.GetString();

            if (body.TryGetProperty("minServicePrice", out var minPriceProp))
                provider.MinServicePrice = minPriceProp.GetDecimal();

            if (body.TryGetProperty("maxServicePrice", out var maxPriceProp))
                provider.MaxServicePrice = maxPriceProp.GetDecimal();

            if (body.TryGetProperty("status", out var statusProp))
            {
                var status = statusProp.GetString();
                if (status == "Available" || status == "Busy" || status == "Unavailable")
                    provider.Status = status;
            }

            provider.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(provider);
        }

        // POST: api/ServiceProviders
        [HttpPost]
        public async Task<ActionResult> PostServiceProvider(JsonElement body)
        {
            // Extract required field
            if (!body.TryGetProperty("businessName", out var businessNameProp))
                return BadRequest("businessName is required");

            string businessName = businessNameProp.GetString() ?? "";
            if (string.IsNullOrEmpty(businessName))
                return BadRequest("businessName cannot be empty");

            // Extract optional fields
            string? phone = null;
            decimal? minServicePrice = null;
            decimal? maxServicePrice = null;
            string? displayName = null;
            string status = "Available"; // default
            string? userId = null; // For onboarding flow

            if (body.TryGetProperty("phone", out var phoneProp))
                phone = phoneProp.GetString();

            if (body.TryGetProperty("minServicePrice", out var minPriceProp))
                minServicePrice = minPriceProp.GetDecimal();

            if (body.TryGetProperty("maxServicePrice", out var maxPriceProp))
                maxServicePrice = maxPriceProp.GetDecimal();

            if (body.TryGetProperty("displayName", out var displayNameProp))
                displayName = displayNameProp.GetString();

            if (body.TryGetProperty("status", out var statusProp))
            {
                var s = statusProp.GetString();
                if (s == "Available" || s == "Busy" || s == "Unavailable")
                    status = s;
            }

            // NEW: Extract userId for onboarding flow
            if (body.TryGetProperty("userId", out var userIdProp))
                userId = userIdProp.GetString();

            var now = DateTime.Now;
            UserProfile profile;

            // Check if this is onboarding (userId provided) or admin creation
            if (!string.IsNullOrEmpty(userId))
            {
                // ONBOARDING FLOW: Update existing UserProfile
                profile = await _context.UserProfiles
                    .FirstOrDefaultAsync(up => up.IdentityUserId == userId);

                if (profile == null)
                    return BadRequest(new { error = "User profile not found for userId: " + userId });

                // Update existing profile to ServiceProvider role
                profile.RoleType = "ServiceProvider";
                profile.DisplayName = displayName ?? businessName;
                profile.UpdatedAt = now;

                // Delete orphaned Customer record if exists
                var existingCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.UserProfileId == profile.Id);
                if (existingCustomer != null)
                {
                    _context.Customers.Remove(existingCustomer);
                }

                await _context.SaveChangesAsync();
            }
            else
            {
                // ADMIN CREATION FLOW: Create new UserProfile (existing behavior)
                profile = new UserProfile
                {
                    IdentityUserId = Guid.NewGuid().ToString(),
                    DisplayName = displayName ?? businessName,
                    RoleType = "ServiceProvider",
                    Status = "Active",  // UserProfile status is for account activation
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.UserProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            // Create ServiceProvider - manually added providers are auto-verified
            var provider = new BeytiDB.Data.ServiceProvider
            {
                UserProfileId = profile.Id,
                BusinessName = businessName,
                Phone = phone,
                MinServicePrice = minServicePrice,
                MaxServicePrice = maxServicePrice,
                Status = status,  // Use status from request
                VerifiedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.ServiceProviders.Add(provider);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceProvider", new { id = provider.Id }, new
            {
                provider.Id,
                provider.UserProfileId,
                provider.BusinessName,
                provider.Phone,
                provider.MinServicePrice,
                provider.MaxServicePrice,
                provider.Status,
                provider.VerifiedAt,
                provider.CreatedAt,
                DisplayName = profile.DisplayName
            });
        }

        

        private bool ServiceProviderExists(int id)
        {
            return _context.ServiceProviders.Any(e => e.Id == id);
        }
    }
}