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
    public class TimeSlotsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public TimeSlotsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/TimeSlots
        // TimeSlots with bookings in status: Pending, Confirmed, or InProgress will be excluded from available times
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TimeSlot>>> GetTimeSlots(
            [FromQuery] int? serviceProviderId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] bool? availableOnly = null)
        {
            var query = _context.TimeSlots.AsQueryable();

            // Filter by service provider if specified
            if (serviceProviderId.HasValue)
            {
                query = query.Where(ts => ts.ServiceProviderId == serviceProviderId.Value);
            }

            var timeSlots = await query.ToListAsync();

            // If availableOnly is true and date is provided, filter out slots with active bookings
            if (availableOnly == true && date.HasValue)
            {
                var dateOnly = date.Value.Date;
                var dayOfWeek = (byte)date.Value.DayOfWeek;

                // Filter by day of week
                timeSlots = timeSlots.Where(ts => ts.DayOfWeek == dayOfWeek).ToList();

                // Get all time slot IDs that have active bookings
                // Active statuses (time slot is occupied): Pending, PendingQuote, DepositPending, Confirmed, InProgress
                // Final statuses (time slot is free): Completed, Canceled, Rejected
                var activeStatuses = new[] { "Pending", "PendingQuote", "DepositPending", "Confirmed", "InProgress" };
                var occupiedTimeSlotIds = await _context.ServiceBookings
                    .Where(b => b.ServiceProviderId == serviceProviderId &&
                               b.BookingDateTime.Date == dateOnly &&
                               activeStatuses.Contains(b.Status))
                    .Select(b => b.TimeSlotId)
                    .Distinct()
                    .ToListAsync();

                // Filter out time slots that have active bookings
                timeSlots = timeSlots
                    .Where(ts => !occupiedTimeSlotIds.Contains(ts.Id))
                    .ToList();
            }

            return timeSlots;
        }

        // GET: api/TimeSlots/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TimeSlot>> GetTimeSlot(int id)
        {
            var timeSlot = await _context.TimeSlots.FindAsync(id);

            if (timeSlot == null)
            {
                return NotFound();
            }

            return timeSlot;
        }

        // PUT: api/TimeSlots/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTimeSlot(int id, TimeSlot timeSlot)
        {
            if (id != timeSlot.Id)
            {
                return BadRequest();
            }

            _context.Entry(timeSlot).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TimeSlotExists(id))
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

        // POST: api/TimeSlots
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<TimeSlot>> PostTimeSlot(TimeSlot timeSlot)
        {
            _context.TimeSlots.Add(timeSlot);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTimeSlot", new { id = timeSlot.Id }, timeSlot);
        }

        // DELETE: api/TimeSlots/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTimeSlot(int id)
        {
            var timeSlot = await _context.TimeSlots.FindAsync(id);
            if (timeSlot == null)
            {
                return NotFound();
            }

            _context.TimeSlots.Remove(timeSlot);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TimeSlotExists(int id)
        {
            return _context.TimeSlots.Any(e => e.Id == id);
        }
    }
}
