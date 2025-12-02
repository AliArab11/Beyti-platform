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

        private bool ServiceReviewExists(int id)
        {
            return _context.ServiceReviews.Any(e => e.Id == id);
        }
    }
}
