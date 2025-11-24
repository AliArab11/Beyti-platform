using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateDriverDto
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
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
                    fullName = d.UserProfile.DisplayName,
                    d.Phone,
                    d.Status,
                    d.CreatedAt
                })
                .ToListAsync();
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
                var profile = new UserProfile
                {
                    DisplayName = dto.FullName,
                    RoleType = "Driver",
                    Status = dto.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.UserProfiles.Add(profile);
                await _context.SaveChangesAsync();

                var driver = new Driver
                {
                    UserProfileId = profile.Id,
                    Phone = dto.Phone,
                    Status = dto.Status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = driver.Id,
                    fullName = profile.DisplayName,
                    phone = driver.Phone,
                    status = driver.Status
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
            driver.Phone = dto.Phone;
            driver.Status = dto.Status;
            driver.UserProfile.UpdatedAt = DateTime.UtcNow;
            driver.UpdatedAt = DateTime.UtcNow;

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
    }
}
