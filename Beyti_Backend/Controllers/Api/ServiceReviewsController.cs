using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceReviewsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceReviewsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceReviews
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceReview>>> GetServiceReviews()
        {
            return await _context.ServiceReviews.ToListAsync();
        }

        // GET: api/ServiceReviews/provider/{serviceProviderId}
        [HttpGet("provider/{serviceProviderId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetServiceReviewsByProvider(int serviceProviderId)
        {
            var reviews = await _context.ServiceReviews
                .Include(r => r.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(r => r.ServiceBooking)
                    .ThenInclude(b => b.ServiceCatalog)
                .Where(r => r.ServiceProviderId == serviceProviderId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ServiceBookingId,
                    r.CustomerId,
                    CustomerName = r.Customer.UserProfile.DisplayName ?? "Unknown",
                    ServiceName = r.ServiceBooking.ServiceCatalog.Name,
                    ServiceCatalogId = r.ServiceBooking.ServiceCatalogId,
                    r.OverallRating,
                    r.QualityRating,
                    r.ProfessionalismRating,
                    r.TimelinessRating,
                    r.Comment,
                    r.ProviderResponse,
                    r.RespondedAt,
                    r.IsHidden,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/ServiceReviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceReview>> GetServiceReview(int id)
        {
            var serviceReview = await _context.ServiceReviews.FindAsync(id);

            if (serviceReview == null)
            {
                return NotFound();
            }

            return serviceReview;
        }

        // PUT: api/ServiceReviews/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceReview(int id, ServiceReview serviceReview)
        {
            if (id != serviceReview.Id)
            {
                return BadRequest();
            }

            _context.Entry(serviceReview).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceReviewExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/ServiceReviews
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ServiceReview>> PostServiceReview(CreateServiceReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate that the service booking exists and belongs to the customer
            var booking = await _context.ServiceBookings
                .FirstOrDefaultAsync(b => b.Id == dto.ServiceBookingId && b.CustomerId == dto.CustomerId);

            if (booking == null)
                return BadRequest("Invalid service booking or customer");

            // Check if booking status is "Completed"
            if (booking.Status != "Completed")
                return BadRequest("You can only review completed service bookings");

            // Check if review already exists
            var existingReview = await _context.ServiceReviews
                .FirstOrDefaultAsync(r => r.ServiceBookingId == dto.ServiceBookingId && r.CustomerId == dto.CustomerId);

            if (existingReview != null)
                return BadRequest("You have already reviewed this service booking");

            // Validate ratings
            if (dto.OverallRating < 1 || dto.OverallRating > 5)
                return BadRequest("Overall rating must be between 1 and 5");

            if (dto.QualityRating.HasValue && (dto.QualityRating < 1 || dto.QualityRating > 5))
                return BadRequest("Quality rating must be between 1 and 5");

            if (dto.ProfessionalismRating.HasValue && (dto.ProfessionalismRating < 1 || dto.ProfessionalismRating > 5))
                return BadRequest("Professionalism rating must be between 1 and 5");

            if (dto.TimelinessRating.HasValue && (dto.TimelinessRating < 1 || dto.TimelinessRating > 5))
                return BadRequest("Timeliness rating must be between 1 and 5");

            var serviceReview = new ServiceReview
            {
                ServiceBookingId = dto.ServiceBookingId,
                ServiceProviderId = dto.ServiceProviderId,
                CustomerId = dto.CustomerId,
                OverallRating = dto.OverallRating,
                QualityRating = dto.QualityRating,
                ProfessionalismRating = dto.ProfessionalismRating,
                TimelinessRating = dto.TimelinessRating,
                Comment = dto.Comment,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.ServiceReviews.Add(serviceReview);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceReview", new { id = serviceReview.Id }, new
            {
                id = serviceReview.Id,
                serviceBookingId = serviceReview.ServiceBookingId,
                serviceProviderId = serviceReview.ServiceProviderId,
                customerId = serviceReview.CustomerId,
                overallRating = serviceReview.OverallRating,
                qualityRating = serviceReview.QualityRating,
                professionalismRating = serviceReview.ProfessionalismRating,
                timelinessRating = serviceReview.TimelinessRating,
                comment = serviceReview.Comment,
                createdAt = serviceReview.CreatedAt
            });
        }

        // DELETE: api/ServiceReviews/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceReview(int id)
        {
            var serviceReview = await _context.ServiceReviews.FindAsync(id);
            if (serviceReview == null)
            {
                return NotFound();
            }

            _context.ServiceReviews.Remove(serviceReview);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/ServiceReviews/{id}/respond
        [HttpPut("{id}/respond")]
        public async Task<IActionResult> RespondToReview(int id, [FromBody] RespondToReviewDto dto)
        {
            var serviceReview = await _context.ServiceReviews.FindAsync(id);
            if (serviceReview == null)
            {
                return NotFound();
            }

            serviceReview.ProviderResponse = dto.ProviderResponse;
            serviceReview.RespondedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceReviewExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // PUT: api/ServiceReviews/{id}/toggle-visibility
        [HttpPut("{id}/toggle-visibility")]
        public async Task<IActionResult> ToggleReviewVisibility(int id)
        {
            var serviceReview = await _context.ServiceReviews.FindAsync(id);
            if (serviceReview == null)
            {
                return NotFound();
            }

            serviceReview.IsHidden = !serviceReview.IsHidden;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceReviewExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool ServiceReviewExists(int id)
        {
            return _context.ServiceReviews.Any(e => e.Id == id);
        }
    }

    // DTO for creating service reviews
    public class CreateServiceReviewDto
    {
        public int ServiceBookingId { get; set; }
        public int ServiceProviderId { get; set; }
        public int CustomerId { get; set; }
        public int OverallRating { get; set; }
        public int? QualityRating { get; set; }
        public int? ProfessionalismRating { get; set; }
        public int? TimelinessRating { get; set; }
        public string? Comment { get; set; }
    }

    // DTO for responding to reviews
    public class RespondToReviewDto
    {
        public string ProviderResponse { get; set; } = string.Empty;
    }
}
