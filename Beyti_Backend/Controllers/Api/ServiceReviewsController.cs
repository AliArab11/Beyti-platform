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
        public async Task<ActionResult<ServiceReview>> PostServiceReview(ServiceReview serviceReview)
        {
            _context.ServiceReviews.Add(serviceReview);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceReview", new { id = serviceReview.Id }, serviceReview);
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

    // DTO for responding to reviews
    public class RespondToReviewDto
    {
        public string ProviderResponse { get; set; } = string.Empty;
    }
}
