using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateDriverDto
    {
        public int? UserId { get; set; }
        public string? FullName { get; set; }
        public string? VehicleType { get; set; }
        public string? LicenseNumber { get; set; }
        public string PhoneNumber { get; set; }
        public string? Email { get; set; }
        public bool? IsAvailable { get; set; }
        public string Status { get; set; } = "Active";
    }

    [Route("api/[controller]")]
    [ApiController]
    public class DriversController : ControllerBase
    {
        private readonly BeytiContext _context;

        public DriversController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDrivers()
        {
            return await _context.Drivers
                .Include(d => d.UserProfile)
                .Select(d => new
                {
                    d.Id,
                    d.UserProfileId,
                    fullName = d.UserProfile.DisplayName,
                    d.Phone,
                    d.Status,
                    isOnline = d.Status == "Active",
                    d.CreatedAt
                })
                .ToListAsync();
        }

        // GET: api/Drivers/Profile/{userProfileId} - Get driver by UserProfileId
        [HttpGet("Profile/{userProfileId}")]
        public async Task<ActionResult<object>> GetDriverByUserProfileId(int userProfileId)
        {
            try
            {
                var driver = await _context.Drivers
                    .Include(d => d.UserProfile)
                    .FirstOrDefaultAsync(d => d.UserProfileId == userProfileId);

                if (driver == null)
                    return NotFound("Driver not found");

                // ✅ ASSIGN RANDOM BAHRAIN LOCATION IF NOT SET
                if (driver.CurrentLat == null || driver.CurrentLng == null)
                {
                    var random = new Random();

                    // Bahrain land bounds (tight - avoids sea)
                    driver.CurrentLat = (decimal)(26.05 + random.NextDouble() * 0.20); // 26.05 to 26.25
                    driver.CurrentLng = (decimal)(50.45 + random.NextDouble() * 0.15); // 50.45 to 50.60
                    driver.UpdatedAt = DateTime.Now;

                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    DriverId = driver.Id,
                    Id = driver.Id,
                    UserProfileId = driver.UserProfileId,
                    FullName = driver.UserProfile.DisplayName,
                    Phone = driver.Phone,
                    Status = driver.Status,
                    IsOnline = driver.Status == "Active",
                    CreatedAt = driver.CreatedAt,
                    DisplayName = driver.UserProfile.DisplayName,
                    RoleType = driver.UserProfile.RoleType,
                    CurrentLat = driver.CurrentLat,
                    CurrentLng = driver.CurrentLng
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching driver profile",
                    error = ex.Message
                });
            }
        }

        // GET: api/Drivers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDriver(int id)
        {
            var driver = await _context.Drivers
                .Include(d => d.UserProfile)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
                return NotFound();

            return new
            {
                driver.Id,
                fullName = driver.UserProfile.DisplayName,
                driver.Phone,
                driver.Status,
                driver.CreatedAt
            };
        }

        // POST: api/Drivers
        [HttpPost]
        public async Task<IActionResult> PostDriver(CreateDriverDto dto)
        {
            try
            {
                // Check if UserId is provided (for onboarding flow)
                UserProfile profile;

                if (dto.UserId.HasValue)
                {
                    // Find existing UserProfile by IdentityUserId
                    profile = await _context.UserProfiles
                        .FirstOrDefaultAsync(up => up.IdentityUserId == dto.UserId.Value.ToString());

                    if (profile == null)
                    {
                        return BadRequest(new { error = "User profile not found" });
                    }

                    // Update profile to Driver role
                    profile.RoleType = "Driver";
                    profile.UpdatedAt = DateTime.Now;
                }
                else
                {
                    // Create new UserProfile (for admin creating drivers)
                    profile = new UserProfile
                    {
                        DisplayName = dto.FullName ?? dto.Email ?? "Driver",
                        RoleType = "Driver",
                        Status = dto.Status,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    _context.UserProfiles.Add(profile);
                    await _context.SaveChangesAsync();
                }

                var driver = new Driver
                {
                    UserProfileId = profile.Id,
                    Phone = dto.PhoneNumber,
                    Status = dto.Status,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = driver.Id,
                    fullName = profile.DisplayName,
                    phone = driver.Phone,
                    status = driver.Status,
                    vehicleType = dto.VehicleType,
                    licenseNumber = dto.LicenseNumber
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/Drivers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDriver(int id, CreateDriverDto dto)
        {
            var driver = await _context.Drivers
                .Include(d => d.UserProfile)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
                return NotFound();

            driver.UserProfile.DisplayName = dto.FullName;
            driver.Phone = dto.PhoneNumber;
            driver.Status = dto.Status;
            driver.UserProfile.UpdatedAt = DateTime.Now;
            driver.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = driver.Id,
                fullName = driver.UserProfile.DisplayName,
                phone = driver.Phone,
                status = driver.Status
            });
        }

        // DELETE: api/Drivers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
                return NotFound();

            _context.Drivers.Remove(driver);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/Drivers/5/online-status
        [HttpPut("{id}/online-status")]
        public async Task<IActionResult> UpdateOnlineStatus(int id, [FromBody] bool isOnline)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null)
                return NotFound();

            // Map boolean to Status string
            driver.Status = isOnline ? "Active" : "Inactive";
            driver.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = driver.Id,
                status = driver.Status,
                isOnline = driver.Status == "Active"
            });
        }
    }
}
