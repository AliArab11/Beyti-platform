using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;
using Beyti_Backend.Authorization;
using Beyti_Backend.Services;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    // TODO: Uncomment these when proper authentication is implemented
    // [Authorize] // Require authentication
    // [NotSuspended] // Require account not suspended
    public class ServiceProviderDashboardController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly INotificationService _notificationService;

        public ServiceProviderDashboardController(BeytiContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // ==================== PROFILE MANAGEMENT ====================

        // GET: api/ServiceProviderDashboard/Profile/5
        [HttpGet("Profile/{userProfileId}")]
        public async Task<IActionResult> GetProviderProfile(int userProfileId)
        {
            try
            {
                var provider = await _context.ServiceProviders
                    .Include(sp => sp.UserProfile)
                    .Include(sp => sp.ServiceProviderAddresses)
                        .ThenInclude(spa => spa.Address)
                    .FirstOrDefaultAsync(sp => sp.UserProfileId == userProfileId);

                if (provider == null)
                    return NotFound("Service provider not found");

                // Get primary address if available
                var primaryAddress = provider.ServiceProviderAddresses
                    .Select(spa => spa.Address)
                    .FirstOrDefault();

                // Build formatted address from available parts
                string formattedAddress = null;
                if (primaryAddress != null)
                {
                    var addressParts = new List<string>();
                    if (!string.IsNullOrEmpty(primaryAddress.Street)) addressParts.Add(primaryAddress.Street);
                    if (!string.IsNullOrEmpty(primaryAddress.City)) addressParts.Add(primaryAddress.City);
                    if (!string.IsNullOrEmpty(primaryAddress.Region)) addressParts.Add(primaryAddress.Region);
                    if (!string.IsNullOrEmpty(primaryAddress.PostalCode)) addressParts.Add(primaryAddress.PostalCode);
                    if (!string.IsNullOrEmpty(primaryAddress.Country)) addressParts.Add(primaryAddress.Country);

                    if (addressParts.Count > 0)
                    {
                        formattedAddress = string.Join(", ", addressParts);
                    }
                }

                return Ok(new
                {
                    provider.Id,
                    provider.UserProfileId,
                    provider.BusinessName,
                    provider.Phone,
                    provider.MinServicePrice,
                    provider.MaxServicePrice,
                    provider.Status,
                    provider.VerifiedAt,
                    DisplayName = provider.UserProfile.DisplayName,
                    RoleType = provider.UserProfile.RoleType,
                    Address = formattedAddress,
                    Street = primaryAddress?.Street,
                    City = primaryAddress?.City,
                    Region = primaryAddress?.Region,
                    PostalCode = primaryAddress?.PostalCode,
                    Country = primaryAddress?.Country,
                    CreatedAt = provider.UserProfile.CreatedAt,
                    UpdatedAt = provider.UserProfile.UpdatedAt,
                    Addresses = provider.ServiceProviderAddresses.Select(spa => new
                    {
                        spa.Address.Id,
                        spa.Address.Label,
                        spa.Address.Street,
                        spa.Address.City,
                        spa.Address.Region,
                        spa.Address.PostalCode,
                        spa.Address.Country,
                        spa.Address.Latitude,
                        spa.Address.Longitude
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceProviderDashboard/UpdateProfile/5
        [HttpPut("UpdateProfile/{userProfileId}")]
        public async Task<IActionResult> UpdateProfile(int userProfileId, JsonElement body)
        {
            try
            {
                var userProfile = await _context.UserProfiles.FindAsync(userProfileId);
                if (userProfile == null)
                    return NotFound("User profile not found");

                // Update display name
                if (body.TryGetProperty("DisplayName", out var displayName) && displayName.ValueKind != JsonValueKind.Null)
                    userProfile.DisplayName = displayName.GetString();

                // Update phone and business name (stored in ServiceProvider table)
                var provider = await _context.ServiceProviders.FirstOrDefaultAsync(sp => sp.UserProfileId == userProfileId);
                if (provider != null)
                {
                    if (body.TryGetProperty("Phone", out var phone) && phone.ValueKind != JsonValueKind.Null)
                    {
                        provider.Phone = phone.GetString();
                    }

                    if (body.TryGetProperty("BusinessName", out var businessName) && businessName.ValueKind != JsonValueKind.Null)
                    {
                        var businessNameValue = businessName.GetString();
                        if (!string.IsNullOrWhiteSpace(businessNameValue))
                        {
                            provider.BusinessName = businessNameValue;
                            provider.UpdatedAt = DateTime.UtcNow;
                        }
                        else
                        {
                            return BadRequest("Business name cannot be empty");
                        }
                    }
                }

                // Note: Email and Address updates would require schema changes
                // UserProfile table doesn't have Email or DateOfBirth fields
                // Address is managed in separate Address table via ServiceProviderAddress

                userProfile.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Profile updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceProviderDashboard/UpdateStatus/5
        [HttpPut("UpdateStatus/{serviceProviderId}")]
        public async Task<IActionResult> UpdateStatus(int serviceProviderId, JsonElement body)
        {
            try
            {
                var provider = await _context.ServiceProviders.FindAsync(serviceProviderId);
                if (provider == null)
                    return NotFound("Service provider not found");

                if (body.TryGetProperty("Status", out var status) && status.ValueKind != JsonValueKind.Null)
                {
                    var statusValue = status.GetString();
                    // Validate status
                    if (statusValue != "Available" && statusValue != "Busy" && statusValue != "Unavailable")
                        return BadRequest("Invalid status. Must be: Available, Busy, or Unavailable");

                    Console.WriteLine($"[UpdateStatus] Updating ServiceProvider {serviceProviderId} from '{provider.Status}' to '{statusValue}'");
                    provider.Status = statusValue;
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"[UpdateStatus] Successfully saved. Current status: '{provider.Status}'");

                return Ok(new { message = "Status updated successfully", status = provider.Status });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateStatus] Error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceProviderDashboard/UpdateAddress/5
        [HttpPut("UpdateAddress/{serviceProviderId}")]
        public async Task<IActionResult> UpdateAddress(int serviceProviderId, JsonElement body)
        {
            try
            {
                // Get the provider with their addresses
                var provider = await _context.ServiceProviders
                    .Include(sp => sp.ServiceProviderAddresses)
                        .ThenInclude(spa => spa.Address)
                    .FirstOrDefaultAsync(sp => sp.Id == serviceProviderId);

                if (provider == null)
                    return NotFound("Service provider not found");

                // Get the primary address (first one)
                var providerAddress = provider.ServiceProviderAddresses.FirstOrDefault();
                Address address;

                // Extract required fields first
                string street = "Not Provided";
                string city = "Not Provided";
                string country = "Bahrain";

                if (body.TryGetProperty("Street", out var streetProp) && streetProp.ValueKind != JsonValueKind.Null)
                    street = streetProp.GetString() ?? "Not Provided";

                if (body.TryGetProperty("City", out var cityProp) && cityProp.ValueKind != JsonValueKind.Null)
                    city = cityProp.GetString() ?? "Not Provided";

                if (body.TryGetProperty("Country", out var countryProp) && countryProp.ValueKind != JsonValueKind.Null)
                    country = countryProp.GetString() ?? "Bahrain";

                if (providerAddress == null)
                {
                    // Create new address if none exists
                    address = new Address
                    {
                        Street = street,
                        City = city,
                        Country = country,
                        IsDefault = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Addresses.Add(address);
                    await _context.SaveChangesAsync();

                    // Link to service provider
                    var newProviderAddress = new ServiceProviderAddress
                    {
                        ServiceProviderId = serviceProviderId,
                        AddressId = address.Id
                    };
                    _context.ServiceProviderAddresses.Add(newProviderAddress);
                }
                else
                {
                    address = providerAddress.Address;
                    // Update required fields
                    address.Street = street;
                    address.City = city;
                    address.Country = country;
                }

                // Update optional fields
                if (body.TryGetProperty("Region", out var region) && region.ValueKind != JsonValueKind.Null)
                    address.Region = region.GetString();

                if (body.TryGetProperty("PostalCode", out var postalCode) && postalCode.ValueKind != JsonValueKind.Null)
                    address.PostalCode = postalCode.GetString();

                if (body.TryGetProperty("Label", out var label) && label.ValueKind != JsonValueKind.Null)
                    address.Label = label.GetString();

                address.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Address updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ==================== CATEGORIES & SERVICES ====================

        // GET: api/ServiceProviderDashboard/Categories
        [HttpGet("Categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _context.ServiceCategories
                    .Include(c => c.ServiceCatalogs)
                    .Where(c => c.IsActive)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Description,
                        ServiceCatalogs = c.ServiceCatalogs
                            .Where(sc => sc.IsActive)
                            .Select(sc => new { sc.Id, sc.Name, sc.Description })
                    })
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ServiceProviderDashboard/MyServices/5
        [HttpGet("MyServices/{serviceProviderId}")]
        public async Task<IActionResult> GetMyServices(int serviceProviderId)
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

                // Get services from Service table
                var services = await _context.Services
                    .Include(s => s.ServiceCatalog)
                        .ThenInclude(sc => sc.ServiceCategory)
                    .Where(s => s.ServiceProviderId == serviceProviderId)
                    .Select(s => new
                    {
                        ServiceId = s.Id,
                        s.Name,
                        s.Description,
                        s.MinPrice,
                        s.MaxPrice,
                        s.EstimatedDuration,
                        s.IsActive,
                        Category = s.ServiceCatalog.ServiceCategory.Name,
                        SubCategory = s.ServiceCatalog.Name,
                        CategoryId = s.ServiceCatalog.ServiceCategoryId,
                        ServiceCatalogId = s.ServiceCatalogId,
                        FlaggedKeywords = prohibitedKeywords
                            .Where(keyword =>
                                s.Name.ToLower().Contains(keyword) ||
                                (s.Description != null && s.Description.ToLower().Contains(keyword))
                            )
                            .ToList()
                    })
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/ServiceProviderDashboard/AddService
        [HttpPost("AddService")]
        public async Task<IActionResult> AddService(JsonElement body)
        {
            try
            {
                int serviceProviderId = body.GetProperty("serviceProviderId").GetInt32();
                int serviceCatalogId = body.GetProperty("serviceCategoryId").GetInt32(); // Frontend sends serviceCategoryId but it's actually serviceCatalogId
                string name = body.GetProperty("name").GetString()!;

                string? description = null;
                if (body.TryGetProperty("description", out var desc) && desc.ValueKind != JsonValueKind.Null)
                    description = desc.GetString();

                // Handle minPrice - can be null, number, or empty string
                decimal? minPrice = null;
                if (body.TryGetProperty("minPrice", out var minP))
                {
                    if (minP.ValueKind == JsonValueKind.Number)
                    {
                        minPrice = minP.GetDecimal();
                    }
                    else if (minP.ValueKind == JsonValueKind.String)
                    {
                        var minPriceStr = minP.GetString();
                        if (!string.IsNullOrEmpty(minPriceStr) && decimal.TryParse(minPriceStr, out var parsedMinPrice))
                        {
                            minPrice = parsedMinPrice;
                        }
                    }
                }

                // Handle maxPrice - can be null, number, or empty string
                decimal? maxPrice = null;
                if (body.TryGetProperty("maxPrice", out var maxP))
                {
                    if (maxP.ValueKind == JsonValueKind.Number)
                    {
                        maxPrice = maxP.GetDecimal();
                    }
                    else if (maxP.ValueKind == JsonValueKind.String)
                    {
                        var maxPriceStr = maxP.GetString();
                        if (!string.IsNullOrEmpty(maxPriceStr) && decimal.TryParse(maxPriceStr, out var parsedMaxPrice))
                        {
                            maxPrice = parsedMaxPrice;
                        }
                    }
                }

                // Handle estimatedDuration - can be null, number, or empty string
                int? estimatedDuration = null;
                if (body.TryGetProperty("estimatedDuration", out var dur))
                {
                    if (dur.ValueKind == JsonValueKind.Number)
                    {
                        estimatedDuration = dur.GetInt32();
                    }
                    else if (dur.ValueKind == JsonValueKind.String)
                    {
                        var durationStr = dur.GetString();
                        if (!string.IsNullOrEmpty(durationStr) && int.TryParse(durationStr, out var parsedDuration))
                        {
                            estimatedDuration = parsedDuration;
                        }
                    }
                }

                var now = DateTime.Now;

                // Create service in Service table
                var service = new Service
                {
                    ServiceProviderId = serviceProviderId,
                    ServiceCatalogId = serviceCatalogId,
                    Name = name,
                    Description = description,
                    MinPrice = minPrice,
                    MaxPrice = maxPrice,
                    EstimatedDuration = estimatedDuration,
                    IsActive = true,
                    CreatedAt = now
                };

                _context.Services.Add(service);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Service added successfully",
                    serviceId = service.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // PUT: api/ServiceProviderDashboard/UpdateService/5
        [HttpPut("UpdateService/{serviceId}")]
        public async Task<IActionResult> UpdateService(int serviceId, JsonElement body)
        {
            try
            {
                var service = await _context.Services.FindAsync(serviceId);
                if (service == null)
                    return NotFound("Service not found");

                // Update ServiceCatalogId if provided (frontend sends this as serviceCategoryId)
                if (body.TryGetProperty("serviceCategoryId", out var catProp))
                {
                    if (catProp.ValueKind == JsonValueKind.Number)
                    {
                        service.ServiceCatalogId = catProp.GetInt32();
                    }
                    else if (catProp.ValueKind == JsonValueKind.String)
                    {
                        service.ServiceCatalogId = int.Parse(catProp.GetString()!);
                    }
                }

                if (body.TryGetProperty("name", out var name))
                    service.Name = name.GetString()!;

                if (body.TryGetProperty("description", out var desc))
                    service.Description = desc.GetString();

                // Handle minPrice
                if (body.TryGetProperty("minPrice", out var minP))
                {
                    if (minP.ValueKind == JsonValueKind.Null || (minP.ValueKind == JsonValueKind.String && string.IsNullOrEmpty(minP.GetString())))
                    {
                        service.MinPrice = null;
                    }
                    else if (minP.ValueKind == JsonValueKind.Number)
                    {
                        service.MinPrice = minP.GetDecimal();
                    }
                    else if (minP.ValueKind == JsonValueKind.String)
                    {
                        if (decimal.TryParse(minP.GetString(), out var parsedMinPrice))
                            service.MinPrice = parsedMinPrice;
                    }
                }

                // Handle maxPrice
                if (body.TryGetProperty("maxPrice", out var maxP))
                {
                    if (maxP.ValueKind == JsonValueKind.Null || (maxP.ValueKind == JsonValueKind.String && string.IsNullOrEmpty(maxP.GetString())))
                    {
                        service.MaxPrice = null;
                    }
                    else if (maxP.ValueKind == JsonValueKind.Number)
                    {
                        service.MaxPrice = maxP.GetDecimal();
                    }
                    else if (maxP.ValueKind == JsonValueKind.String)
                    {
                        if (decimal.TryParse(maxP.GetString(), out var parsedMaxPrice))
                            service.MaxPrice = parsedMaxPrice;
                    }
                }

                // Handle estimatedDuration
                if (body.TryGetProperty("estimatedDuration", out var dur))
                {
                    if (dur.ValueKind == JsonValueKind.Null || (dur.ValueKind == JsonValueKind.String && string.IsNullOrEmpty(dur.GetString())))
                    {
                        service.EstimatedDuration = null;
                    }
                    else if (dur.ValueKind == JsonValueKind.Number)
                    {
                        service.EstimatedDuration = dur.GetInt32();
                    }
                    else if (dur.ValueKind == JsonValueKind.String)
                    {
                        if (int.TryParse(dur.GetString(), out var parsedDuration))
                            service.EstimatedDuration = parsedDuration;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Service updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // PUT: api/ServiceProviderDashboard/ToggleService/5
        [HttpPut("ToggleService/{serviceId}")]
        public async Task<IActionResult> ToggleServiceStatus(int serviceId)
        {
            try
            {
                var service = await _context.Services.FindAsync(serviceId);
                if (service == null)
                    return NotFound("Service not found");

                service.IsActive = !service.IsActive;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Service {(service.IsActive ? "activated" : "deactivated")} successfully",
                    isActive = service.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ==================== TIME SLOTS / SCHEDULE ====================

        // POST: api/ServiceProviderDashboard/AddTimeSlot
        [HttpPost("AddTimeSlot")]
        public async Task<IActionResult> AddTimeSlot(JsonElement body)
        {
            try
            {
                int serviceProviderId = body.GetProperty("serviceProviderId").GetInt32();
                byte dayOfWeek = body.GetProperty("dayOfWeek").GetByte();

                // Parse as TimeOnly instead of TimeSpan
                TimeOnly startTime = TimeOnly.Parse(body.GetProperty("startTime").GetString()!);
                TimeOnly endTime = TimeOnly.Parse(body.GetProperty("endTime").GetString()!);

                // Validate
                if (dayOfWeek > 6)
                    return BadRequest("DayOfWeek must be between 0 (Sunday) and 6 (Saturday)");

                if (startTime >= endTime)
                    return BadRequest("Start time must be before end time");

                // Check for overlaps
                var hasOverlap = await _context.TimeSlots
                    .AnyAsync(ts =>
                        ts.ServiceProviderId == serviceProviderId &&
                        ts.DayOfWeek == dayOfWeek &&
                        ts.IsActive &&
                        ((startTime >= ts.StartTime && startTime < ts.EndTime) ||
                         (endTime > ts.StartTime && endTime <= ts.EndTime) ||
                         (startTime <= ts.StartTime && endTime >= ts.EndTime))
                    );

                if (hasOverlap)
                    return BadRequest("Time slot overlaps with existing schedule");

                var timeSlot = new TimeSlot
                {
                    ServiceProviderId = serviceProviderId,
                    DayOfWeek = dayOfWeek,
                    StartTime = startTime,
                    EndTime = endTime,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.TimeSlots.Add(timeSlot);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Time slot added successfully", timeSlotId = timeSlot.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ServiceProviderDashboard/TimeSlots/5
        [HttpGet("TimeSlots/{serviceProviderId}")]
        public async Task<IActionResult> GetTimeSlots(int serviceProviderId)
        {
            try
            {
                var timeSlots = await _context.TimeSlots
                    .Where(ts => ts.ServiceProviderId == serviceProviderId)
                    .OrderBy(ts => ts.DayOfWeek)
                    .ThenBy(ts => ts.StartTime)
                    .Select(ts => new
                    {
                        ts.Id,
                        ts.DayOfWeek,
                        DayName = ts.DayOfWeek == 0 ? "Sunday" :
                                  ts.DayOfWeek == 1 ? "Monday" :
                                  ts.DayOfWeek == 2 ? "Tuesday" :
                                  ts.DayOfWeek == 3 ? "Wednesday" :
                                  ts.DayOfWeek == 4 ? "Thursday" :
                                  ts.DayOfWeek == 5 ? "Friday" : "Saturday",
                        StartTime = ts.StartTime.ToString("HH:mm"), // Convert TimeOnly to string
                        EndTime = ts.EndTime.ToString("HH:mm"),     // Convert TimeOnly to string
                        ts.IsActive
                    })
                    .ToListAsync();

                return Ok(timeSlots);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceProviderDashboard/ToggleTimeSlot/5
        [HttpPut("ToggleTimeSlot/{timeSlotId}")]
        public async Task<IActionResult> ToggleTimeSlot(int timeSlotId)
        {
            try
            {
                var timeSlot = await _context.TimeSlots.FindAsync(timeSlotId);
                if (timeSlot == null)
                    return NotFound("Time slot not found");

                timeSlot.IsActive = !timeSlot.IsActive;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Time slot {(timeSlot.IsActive ? "activated" : "deactivated")} successfully",
                    isActive = timeSlot.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/ServiceProviderDashboard/DeleteTimeSlot/5
        [HttpDelete("DeleteTimeSlot/{timeSlotId}")]
        public async Task<IActionResult> DeleteTimeSlot(int timeSlotId)
        {
            try
            {
                var timeSlot = await _context.TimeSlots
                    .Include(ts => ts.ServiceBookings)
                    .FirstOrDefaultAsync(ts => ts.Id == timeSlotId);

                if (timeSlot == null)
                    return NotFound("Time slot not found");

                // Check if there are any active/pending bookings (exclude completed/canceled)
                var activeBookings = timeSlot.ServiceBookings
                    .Where(sb => sb.Status != "Completed" && sb.Status != "Canceled")
                    .ToList();

                if (activeBookings.Any())
                {
                    return BadRequest(new {
                        error = "Cannot delete time slot with active bookings",
                        message = "This time slot has active bookings and cannot be deleted. Please cancel or complete the bookings first."
                    });
                }

                _context.TimeSlots.Remove(timeSlot);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Time slot deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ==================== BOOKINGS ====================

        // GET: api/ServiceProviderDashboard/Bookings/5
        [HttpGet("Bookings/{serviceProviderId}")]
        public async Task<IActionResult> GetBookings(int serviceProviderId, [FromQuery] string? status = null)
        {
            try
            {
                var query = _context.ServiceBookings
                    .Include(sb => sb.Customer)
                        .ThenInclude(c => c.UserProfile)
                    .Include(sb => sb.ServiceCatalog)
                        .ThenInclude(sc => sc.ServiceCategory)
                    .Include(sb => sb.ServiceAddress)
                    .Where(sb => sb.ServiceProviderId == serviceProviderId);

                if (!string.IsNullOrEmpty(status))
                    query = query.Where(sb => sb.Status == status);

                var bookings = await query
                    .OrderByDescending(sb => sb.BookingDateTime)
                    .Select(sb => new
                    {
                        sb.Id,
                        sb.BookingDateTime,
                        sb.Status,
                        sb.ServiceType,
                        sb.QuotedPrice,
                        sb.DepositAmount,
                        sb.FinalAmount,
                        sb.Notes,
                        CustomerName = sb.Customer.UserProfile.DisplayName,
                        CustomerPhone = sb.Customer.Phone,
                        ServiceName = sb.ServiceCatalog.Name,
                        Category = sb.ServiceCatalog.ServiceCategory.Name,
                        Address = sb.ServiceAddress != null ? new
                        {
                            sb.ServiceAddress.Street,
                            sb.ServiceAddress.City,
                            sb.ServiceAddress.Latitude,
                            sb.ServiceAddress.Longitude
                        } : null,
                        sb.CreatedAt
                    })
                    .ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceProviderDashboard/UpdateBookingStatus/5
        [HttpPut("UpdateBookingStatus/{bookingId}")]
        public async Task<IActionResult> UpdateBookingStatus(int bookingId, JsonElement body)
        {
            try
            {
                var booking = await _context.ServiceBookings
                    .Include(sb => sb.Customer)
                        .ThenInclude(c => c.UserProfile)
                    .Include(sb => sb.ServiceCatalog)
                    .Include(sb => sb.ServiceProvider)
                    .FirstOrDefaultAsync(sb => sb.Id == bookingId);

                if (booking == null)
                    return NotFound("Booking not found");

                string? newStatus = null;
                if (body.TryGetProperty("status", out var statusProp))
                {
                    newStatus = statusProp.GetString()!;
                    booking.Status = newStatus;
                }

                if (body.TryGetProperty("quotedPrice", out var priceProp))
                {
                    booking.QuotedPrice = priceProp.GetDecimal();
                    // Calculate deposit and final amount (50% split)
                    booking.DepositAmount = booking.QuotedPrice * 0.5m;
                    booking.FinalAmount = booking.QuotedPrice * 0.5m;
                }

                booking.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Update TimeSlot IsActive based on booking status
                await UpdateTimeSlotAvailability(booking.TimeSlotId, booking.Status);

                // Send notification to customer about the status change
                if (!string.IsNullOrEmpty(newStatus) && booking.Customer?.UserProfile != null)
                {
                    var serviceName = booking.ServiceCatalog?.Name ?? "service";
                    var notificationMessage = GetBookingStatusNotificationMessage(newStatus, serviceName);

                    await _notificationService.SendNotificationAsync(
                        recipientUserId: booking.Customer.UserProfile.Id,
                        senderUserId: booking.ServiceProvider?.UserProfileId,
                        type: "BookingUpdate",
                        title: "Booking Status Update",
                        body: notificationMessage,
                        relatedEntityType: "ServiceBooking",
                        relatedEntityId: bookingId
                    );
                }

                return Ok(new { message = "Booking updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private string GetBookingStatusNotificationMessage(string status, string serviceName)
        {
            return status switch
            {
                "Confirmed" => $"Your booking for \"{serviceName}\" has been confirmed! The service provider will contact you soon.",
                "InProgress" => $"Your service \"{serviceName}\" is now in progress.",
                "Completed" => $"Your service \"{serviceName}\" has been completed. Please leave a review!",
                "Rejected" => $"Unfortunately, your booking for \"{serviceName}\" has been rejected. Please contact us for more information.",
                "Canceled" => $"Your booking for \"{serviceName}\" has been canceled.",
                "DepositPending" => $"Your quote for \"{serviceName}\" is ready! Please pay the deposit to confirm your booking.",
                _ => $"Your booking status has been updated to {status}."
            };
        }

        /// <summary>
        /// Updates the TimeSlot IsActive status based on associated ServiceBooking statuses.
        /// TimeSlot.IsActive = false when there's an active booking (Pending, Confirmed, InProgress)
        /// TimeSlot.IsActive = true when there are no active bookings
        /// </summary>
        private async Task UpdateTimeSlotAvailability(int? timeSlotId, string? currentStatus)
        {
            if (!timeSlotId.HasValue)
            {
                return;
            }

            var timeSlot = await _context.TimeSlots.FindAsync(timeSlotId.Value);
            if (timeSlot == null)
            {
                return;
            }

            // Define active statuses that should block the time slot
            var activeStatuses = new[] { "Pending", "Confirmed", "InProgress" };

            // Check if there are any active bookings for this time slot
            var hasActiveBooking = await _context.ServiceBookings
                .AnyAsync(b => b.TimeSlotId == timeSlotId.Value &&
                              activeStatuses.Contains(b.Status));

            // Update IsActive: false if there's an active booking, true otherwise
            timeSlot.IsActive = !hasActiveBooking;

            await _context.SaveChangesAsync();
        }

        // ==================== STATISTICS ====================

        // GET: api/ServiceProviderDashboard/Statistics/5
       
        [HttpGet("Statistics/{serviceProviderId}")]
        public async Task<IActionResult> GetStatistics(int serviceProviderId)
        {
            try
            {
                var totalBookings = await _context.ServiceBookings
                    .CountAsync(sb => sb.ServiceProviderId == serviceProviderId);

                // Count only Pending bookings (simple flow - no quote needed)
                var pendingBookings = await _context.ServiceBookings
                    .CountAsync(sb => sb.ServiceProviderId == serviceProviderId &&
                                     sb.Status == "Pending");

                var completedBookings = await _context.ServiceBookings
                    .CountAsync(sb => sb.ServiceProviderId == serviceProviderId &&
                                     sb.Status == "Completed");

                // Get all completed bookings and calculate total earnings
                var completedBookingsList = await _context.ServiceBookings
                    .Where(sb => sb.ServiceProviderId == serviceProviderId &&
                                sb.Status == "Completed")
                    .Select(sb => new
                    {
                        sb.QuotedPrice,
                        sb.FinalAmount,
                        sb.DepositAmount
                    })
                    .ToListAsync();

                // Sum up all the prices from completed bookings
                decimal totalEarnings = 0;
                foreach (var booking in completedBookingsList)
                {
                    // Use FinalAmount if available, otherwise QuotedPrice, otherwise 0
                    totalEarnings += booking.FinalAmount ?? booking.QuotedPrice ?? 0;
                }

                // Query the Services table for active services count
                var activeServices = await _context.Services
                    .CountAsync(s => s.ServiceProviderId == serviceProviderId &&
                                    s.IsActive);

                return Ok(new
                {
                    totalBookings,
                    pendingBookings,      // Only Pending status (no PendingQuote)
                    completedBookings,
                    totalEarnings,
                    activeServices
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}