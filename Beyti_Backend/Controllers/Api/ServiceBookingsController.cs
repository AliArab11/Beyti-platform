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
        // Note: Bookings with active statuses will block the associated TimeSlot from being available
        // Active statuses (block availability): Pending, PendingQuote, DepositPending, Confirmed, InProgress
        // Final statuses (don't block availability): Completed, Canceled, Rejected
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServiceBookings(
            [FromQuery] int? serviceProviderId = null,
            [FromQuery] int? customerId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int? timeSlotId = null,
            [FromQuery] string? status = null)
        {
            var query = _context.ServiceBookings
                .Include(b => b.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(b => b.ServiceProvider)
                    .ThenInclude(sp => sp.UserProfile)
                .Include(b => b.ServiceCatalog)
                .Include(b => b.TimeSlot)
                .AsQueryable();

            // Debug logging
            Console.WriteLine($"[ServiceBookings] Query params - ProviderId: {serviceProviderId}, CustomerId: {customerId}, Date: {date}, TimeSlotId: {timeSlotId}, Status: {status}");

            // Filter by service provider if specified
            if (serviceProviderId.HasValue)
            {
                query = query.Where(b => b.ServiceProviderId == serviceProviderId.Value);
            }

            // Filter by customer if specified
            if (customerId.HasValue)
            {
                query = query.Where(b => b.CustomerId == customerId.Value);
            }

            // Filter by date if specified (compare only the date part)
            if (date.HasValue)
            {
                var dateOnly = date.Value.Date;
                Console.WriteLine($"[ServiceBookings] Filtering by date: {dateOnly}");
                query = query.Where(b => b.BookingDateTime.Date == dateOnly);
            }

            // Filter by time slot if specified
            if (timeSlotId.HasValue)
            {
                query = query.Where(b => b.TimeSlotId == timeSlotId.Value);
            }

            // Filter by status if specified
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(b => b.Status == status);
            }

            var results = await query
                .Select(b => new
                {
                    b.Id,
                    b.CustomerId,
                    b.ServiceProviderId,
                    b.ServiceCatalogId,
                    b.TimeSlotId,
                    b.BookingDateTime,
                    serviceDate = b.BookingDateTime.Date,
                    serviceTime = b.TimeSlot != null ? b.TimeSlot.StartTime.ToString(@"hh\:mm") : null,
                    b.Status,
                    b.ServiceType,
                    b.QuotedPrice,
                    b.DepositAmount,
                    b.FinalAmount,
                    b.Notes,
                    b.CreatedAt,
                    b.UpdatedAt,
                    providerName = b.ServiceProvider.UserProfile.DisplayName,
                    businessName = b.ServiceProvider.BusinessName,
                    serviceName = b.ServiceCatalog.Name,
                    customerName = b.Customer.UserProfile.DisplayName
                })
                .ToListAsync();

            Console.WriteLine($"[ServiceBookings] Found {results.Count} bookings");
            return Ok(results);
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

                // Update TimeSlot IsActive based on booking status
                await UpdateTimeSlotAvailability(serviceBooking.TimeSlotId, serviceBooking.Status);
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

                // Update TimeSlot IsActive based on booking status
                await UpdateTimeSlotAvailability(serviceBooking.TimeSlotId, serviceBooking.Status);

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

            var timeSlotId = serviceBooking.TimeSlotId;

            _context.ServiceBookings.Remove(serviceBooking);
            await _context.SaveChangesAsync();

            // When a booking is deleted, re-evaluate the TimeSlot availability
            if (timeSlotId.HasValue)
            {
                await UpdateTimeSlotAvailability(timeSlotId, null);
            }

            return NoContent();
        }

        private bool ServiceBookingExists(int id)
        {
            return _context.ServiceBookings.Any(e => e.Id == id);
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
    }
}
