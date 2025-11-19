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
    public class DeliveryTicketsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public DeliveryTicketsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/DeliveryTickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryTicket>>> GetDeliveryTickets()
        {
            return await _context.DeliveryTickets.ToListAsync();
        }

        // GET: api/DeliveryTickets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryTicket>> GetDeliveryTicket(int id)
        {
            var deliveryTicket = await _context.DeliveryTickets.FindAsync(id);

            if (deliveryTicket == null)
            {
                return NotFound();
            }

            return deliveryTicket;
        }

        // PUT: api/DeliveryTickets/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDeliveryTicket(int id, DeliveryTicket deliveryTicket)
        {
            if (id != deliveryTicket.Id)
            {
                return BadRequest();
            }

            _context.Entry(deliveryTicket).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DeliveryTicketExists(id))
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

        // POST: api/DeliveryTickets
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<DeliveryTicket>> PostDeliveryTicket(DeliveryTicket deliveryTicket)
        {
            _context.DeliveryTickets.Add(deliveryTicket);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetDeliveryTicket", new { id = deliveryTicket.Id }, deliveryTicket);
        }

        // DELETE: api/DeliveryTickets/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeliveryTicket(int id)
        {
            var deliveryTicket = await _context.DeliveryTickets.FindAsync(id);
            if (deliveryTicket == null)
            {
                return NotFound();
            }

            _context.DeliveryTickets.Remove(deliveryTicket);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DeliveryTicketExists(int id)
        {
            return _context.DeliveryTickets.Any(e => e.Id == id);
        }
    }
}
