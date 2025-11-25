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

        public class UpdateDeliveryTicketDto
        {
            public string? Status { get; set; }
            public int? DriverId { get; set; }
        }

        // GET: api/DeliveryTickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDeliveryTickets([FromQuery] int? driverId, [FromQuery] string? status)
        {
            var query = _context.DeliveryTickets
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Customer)
                        .ThenInclude(c => c.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.SellerAddresses)  // ADD THIS LINE
                            .ThenInclude(sa => sa.Address)     // ADD THIS LINE
                .Include(dt => dt.PickupAddress)
                .Include(dt => dt.DeliveryAddress)
                .Include(dt => dt.Driver)
                    .ThenInclude(d => d.UserProfile)
                .AsQueryable();

            if (driverId.HasValue)
            {
                query = query.Where(dt => dt.DriverId == driverId.Value);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(dt => dt.Status == status);
            }

            var tickets = await query
                .Select(dt => new
                {
                    dt.Id,
                    dt.OrderId,
                    dt.DriverId,
                    dt.Status,
                    dt.CreatedAt,
                    dt.UpdatedAt,
                    order = new
                    {
                        dt.Order.Id,
                        dt.Order.TotalAmount,
                        dt.Order.PaymentMethod,
                        dt.Order.Status,
                        customerName = dt.Order.Customer.UserProfile.DisplayName,
                        sellerName = dt.Order.Seller.UserProfile.DisplayName
                    },
                    // CHANGE THIS SECTION - If pickupAddress is null, get from seller's first address
                    pickupAddress = dt.PickupAddress != null ? new
                    {
                        dt.PickupAddress.Street,
                        dt.PickupAddress.City,
                        dt.PickupAddress.Region,
                        dt.PickupAddress.Country,
                        dt.PickupAddress.Latitude,
                        dt.PickupAddress.Longitude
                    } : (dt.Order.Seller.SellerAddresses.FirstOrDefault() != null ? new
                    {
                        Street = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Street,
                        City = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.City,
                        Region = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Region,
                        Country = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Country,
                        Latitude = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Latitude,
                        Longitude = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Longitude
                    } : null),
                    deliveryAddress = dt.DeliveryAddress != null ? new
                    {
                        dt.DeliveryAddress.Street,
                        dt.DeliveryAddress.City,
                        dt.DeliveryAddress.Region,
                        dt.DeliveryAddress.Country,
                        dt.DeliveryAddress.Latitude,
                        dt.DeliveryAddress.Longitude
                    } : null,
                    driverName = dt.Driver != null ? dt.Driver.UserProfile.DisplayName : null
                })
                .ToListAsync();

            return Ok(tickets);
        }

        // GET: api/DeliveryTickets/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDeliveryTicket(int id)
        {
            var ticket = await _context.DeliveryTickets
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Customer)
                        .ThenInclude(c => c.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.SellerAddresses)  // ADD THIS LINE
                            .ThenInclude(sa => sa.Address)     // ADD THIS LINE
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.ProductVariant)
                            .ThenInclude(pv => pv.Product)
                .Include(dt => dt.PickupAddress)
                .Include(dt => dt.DeliveryAddress)
                .Include(dt => dt.Driver)
                    .ThenInclude(d => d.UserProfile)
                .Where(dt => dt.Id == id)
                .Select(dt => new
                {
                    dt.Id,
                    dt.OrderId,
                    dt.DriverId,
                    dt.Status,
                    dt.CreatedAt,
                    dt.UpdatedAt,
                    order = new
                    {
                        dt.Order.Id,
                        dt.Order.TotalAmount,
                        dt.Order.SubtotalAmount,
                        dt.Order.DeliveryFee,
                        dt.Order.PaymentMethod,
                        dt.Order.PaymentStatus,
                        dt.Order.Status,
                        customerName = dt.Order.Customer.UserProfile.DisplayName,
                        customerPhone = dt.Order.Customer.Phone,
                        sellerName = dt.Order.Seller.UserProfile.DisplayName,
                        orderItems = dt.Order.OrderItems.Select(oi => new
                        {
                            productName = oi.ProductVariant.Product.Name,
                            oi.Qty,
                            oi.UnitPrice,
                            oi.LineTotal
                        }).ToList()
                    },
                    // CHANGE THIS SECTION - If pickupAddress is null, get from seller's first address
                    pickupAddress = dt.PickupAddress != null ? new
                    {
                        dt.PickupAddress.Street,
                        dt.PickupAddress.City,
                        dt.PickupAddress.Region,
                        dt.PickupAddress.Country,
                        dt.PickupAddress.PostalCode,
                        dt.PickupAddress.Latitude,
                        dt.PickupAddress.Longitude
                    } : (dt.Order.Seller.SellerAddresses.FirstOrDefault() != null ? new
                    {
                        Street = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Street,
                        City = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.City,
                        Region = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Region,
                        Country = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Country,
                        PostalCode = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.PostalCode,
                        Latitude = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Latitude,
                        Longitude = dt.Order.Seller.SellerAddresses.FirstOrDefault().Address.Longitude
                    } : null),
                    deliveryAddress = dt.DeliveryAddress != null ? new
                    {
                        dt.DeliveryAddress.Street,
                        dt.DeliveryAddress.City,
                        dt.DeliveryAddress.Region,
                        dt.DeliveryAddress.Country,
                        dt.DeliveryAddress.PostalCode,
                        dt.DeliveryAddress.Latitude,
                        dt.DeliveryAddress.Longitude
                    } : null,
                    driverName = dt.Driver != null ? dt.Driver.UserProfile.DisplayName : null
                })
                .FirstOrDefaultAsync();

            if (ticket == null)
            {
                return NotFound();
            }

            return Ok(ticket);
        }

        // PUT: api/DeliveryTickets/5/accept
        [HttpPut("{id}/accept")]
        public async Task<IActionResult> AcceptDeliveryTicket(int id, [FromBody] UpdateDeliveryTicketDto dto)
        {
            try
            {
                var ticket = await _context.DeliveryTickets.FindAsync(id);

                if (ticket == null)
                    return NotFound();

                if (ticket.Status != "Available")
                    return BadRequest("Ticket is not available");

                ticket.DriverId = dto.DriverId;
                ticket.Status = "Accepted";
                ticket.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error accepting ticket", error = ex.Message });
            }
        }

        // PUT: api/DeliveryTickets/5/update-status
        [HttpPut("{id}/update-status")]
        public async Task<IActionResult> UpdateDeliveryStatus(int id, [FromBody] UpdateDeliveryTicketDto dto)
        {
            try
            {
                var ticket = await _context.DeliveryTickets
                    .Include(dt => dt.Order)
                    .FirstOrDefaultAsync(dt => dt.Id == id);

                if (ticket == null)
                    return NotFound();

                ticket.Status = dto.Status;
                ticket.UpdatedAt = DateTime.UtcNow;

                // If delivered, update order status
                if (dto.Status == "Delivered")
                {
                    ticket.Order.Status = "Completed";
                    ticket.Order.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating status", error = ex.Message });
            }
        }

        // PUT: api/DeliveryTickets/5
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