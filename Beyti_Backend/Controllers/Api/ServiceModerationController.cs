using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceModerationController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceModerationController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceModeration/Statistics
        [HttpGet("Statistics")]
        public async Task<IActionResult> GetModerationStatistics()
        {
            try
            {
                var totalServices = await _context.ServiceCatalogs.CountAsync();
                var activeServices = await _context.ServiceCatalogs.CountAsync(s => s.IsActive);
                var inactiveServices = totalServices - activeServices;

                var recentServices = await _context.ServiceCatalogs
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
                var query = _context.ServiceCatalogs
                    .Include(s => s.SubCategory)
                        .ThenInclude(sc => sc.Category)
                    .AsQueryable();

                // Filter by active status
                if (isActive.HasValue)
                    query = query.Where(s => s.IsActive == isActive.Value);

                // Search by name or description
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(s =>
                        s.Name.Contains(search) ||
                        (s.Description != null && s.Description.Contains(search)));

                var services = await query
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.Description,
                        s.MinPrice,
                        s.MaxPrice,
                        s.EstimatedDuration,
                        s.IsActive,
                        category = s.SubCategory.Category.Name,
                        subCategory = s.SubCategory.Name,
                        s.CreatedAt
                    })
                    .ToListAsync();

                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ServiceModeration/Services/5
        [HttpGet("Services/{id}")]
        public async Task<IActionResult> GetServiceDetails(int id)
        {
            try
            {
                var service = await _context.ServiceCatalogs
                    .Include(s => s.SubCategory)
                        .ThenInclude(sc => sc.Category)
                    .Where(s => s.Id == id)
                    .Select(s => new
                    {
                        s.Id,
                        s.Name,
                        s.Description,
                        s.MinPrice,
                        s.MaxPrice,
                        s.EstimatedDuration,
                        s.IsActive,
                        category = s.SubCategory.Category.Name,
                        subCategory = s.SubCategory.Name,
                        s.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (service == null)
                    return NotFound();

                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceModeration/Services/5/approve
        [HttpPut("Services/{id}/approve")]
        public async Task<IActionResult> ApproveService(int id)
        {
            try
            {
                var service = await _context.ServiceCatalogs.FindAsync(id);
                if (service == null) return NotFound();

                service.IsActive = true;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Service approved successfully", service });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ServiceModeration/Services/5/suspend
        [HttpPut("Services/{id}/suspend")]
        public async Task<IActionResult> SuspendService(int id, [FromBody] JsonElement body)
        {
            try
            {
                var service = await _context.ServiceCatalogs.FindAsync(id);
                if (service == null) return NotFound();

                service.IsActive = false;

                // You could add a reason field to track why it was suspended
                string? reason = null;
                if (body.TryGetProperty("reason", out var reasonProp))
                    reason = reasonProp.GetString();

                await _context.SaveChangesAsync();

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
                var service = await _context.ServiceCatalogs.FindAsync(id);

                if (service == null) return NotFound();

                _context.ServiceCatalogs.Remove(service);
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
