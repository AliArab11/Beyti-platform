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
    public class ServiceBookingsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceBookingsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceBookings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceBooking>>> GetServiceBookings()
        {
            return await _context.ServiceBookings.ToListAsync();
        }

        // GET: api/ServiceBookings/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceBooking>> GetServiceBooking(int id)
        {
            var serviceBooking = await _context.ServiceBookings.FindAsync(id);

            if (serviceBooking == null)
            {
                return NotFound();
            }

            return serviceBooking;
        }

        // PUT: api/ServiceBookings/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceBooking(int id, ServiceBooking serviceBooking)
        {
            if (id != serviceBooking.Id)
            {
                return BadRequest();
            }

            // Update timestamp
            serviceBooking.UpdatedAt = DateTime.UtcNow;

            _context.Entry(serviceBooking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceBookingExists(id))
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

        // POST: api/ServiceBookings
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ServiceBooking>> PostServiceBooking(ServiceBooking serviceBooking)
        {
            // Set timestamps FIRST
            serviceBooking.CreatedAt = DateTime.UtcNow;
            serviceBooking.UpdatedAt = DateTime.UtcNow;

            // Remove navigation properties from ModelState BEFORE any validation
            ModelState.Remove("serviceBooking.Customer");
            ModelState.Remove("serviceBooking.ServiceAddress");
            ModelState.Remove("serviceBooking.ServiceCatalog");
            ModelState.Remove("serviceBooking.ServiceProvider");
            ModelState.Remove("serviceBooking.Service");
            ModelState.Remove("serviceBooking.TimeSlot");
            ModelState.Remove("serviceBooking.Payments");
            ModelState.Remove("serviceBooking.ServiceReviews");

            // Validate model state
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _context.ServiceBookings.Add(serviceBooking);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetServiceBooking", new { id = serviceBooking.Id }, serviceBooking);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        // DELETE: api/ServiceBookings/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceBooking(int id)
        {
            var serviceBooking = await _context.ServiceBookings.FindAsync(id);
            if (serviceBooking == null)
            {
                return NotFound();
            }

            _context.ServiceBookings.Remove(serviceBooking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ServiceBookingExists(int id)
        {
            return _context.ServiceBookings.Any(e => e.Id == id);
        }
    }
}
