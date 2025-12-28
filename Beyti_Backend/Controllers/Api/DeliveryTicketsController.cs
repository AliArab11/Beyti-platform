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

        // Track which drivers have been offered each ticket (in memory)
        private static readonly Dictionary<int, HashSet<int>> _ticketOfferedDrivers = new();


        public DeliveryTicketsController(BeytiContext context)
        {
            _context = context;
        }

        public class UpdateDeliveryTicketDto
        {
            public string? Status { get; set; }
            public int? DriverId { get; set; }
        }

        // Calculate distance between two coordinates (Haversine formula)
        private double CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double R = 6371; // Earth's radius in km

            var dLat = ToRadians((double)(lat2 - lat1));
            var dLon = ToRadians((double)(lon2 - lon1));

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians((double)lat1)) * Math.Cos(ToRadians((double)lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = R * c;

            return distance;
        }

        private async Task<bool> OfferToNextClosestDriver(int ticketId)
        {
            try
            {
                var ticket = await _context.DeliveryTickets
                    .Include(dt => dt.PickupAddress)
                    .Include(dt => dt.Order)
                        .ThenInclude(o => o.Seller)
                            .ThenInclude(s => s.SellerAddresses)
                                .ThenInclude(sa => sa.Address)
                    .FirstOrDefaultAsync(dt => dt.Id == ticketId);

                if (ticket == null) return false;

                // Get pickup coordinates
                decimal? pickupLat = ticket.PickupAddress?.Latitude;
                decimal? pickupLng = ticket.PickupAddress?.Longitude;

                // Fallback to seller's address if no pickup address
                if (pickupLat == null || pickupLng == null)
                {
                    var sellerAddress = ticket.Order?.Seller?.SellerAddresses?.FirstOrDefault()?.Address;
                    pickupLat = sellerAddress?.Latitude;
                    pickupLng = sellerAddress?.Longitude;
                }

                if (pickupLat == null || pickupLng == null)
                {
                    Console.WriteLine($"❌ No pickup location for ticket {ticketId}");
                    return false;
                }

                // Get all available drivers (not currently on a delivery)
                var availableDrivers = await _context.Drivers
                    .Where(d => d.Status == "Active"
                             && d.CurrentLat != null
                             && d.CurrentLng != null)
                    .Where(d => !_context.DeliveryTickets
                        .Any(dt => dt.DriverId == d.Id
                                && (dt.Status == "Accepted" || dt.Status == "Picked Up")))
                    .ToListAsync();

                if (!availableDrivers.Any())
                {
                    Console.WriteLine($"⚠️ No available drivers for ticket {ticketId}");
                    return false;
                }

                // Get list of drivers who were already offered this ticket (from memory)
                var alreadyOfferedIds = new List<int>();
                if (_ticketOfferedDrivers.ContainsKey(ticketId))
                {
                    alreadyOfferedIds = _ticketOfferedDrivers[ticketId].ToList();
                }

                // Calculate distances and sort
                var driversWithDistance = availableDrivers
                    .Where(d => !alreadyOfferedIds.Contains(d.Id))
                    .Select(d => new
                    {
                        Driver = d,
                        Distance = CalculateDistance(
                            pickupLat.Value, pickupLng.Value,
                            d.CurrentLat.Value, d.CurrentLng.Value
                        )
                    })
                    .OrderBy(x => x.Distance)
                    .ToList();

                var nextDriver = driversWithDistance.FirstOrDefault();

                if (nextDriver == null)
                {
                    Console.WriteLine($"⚠️ All available drivers have been offered ticket {ticketId}");

                    // Cancel the ticket and order since no drivers are available
                    ticket.Status = "Cancelled";
                    ticket.CurrentOfferedDriverId = null;
                    ticket.OfferExpiresAt = null;
                    ticket.UpdatedAt = DateTime.Now;

                    // Also update the associated order - DON'T RESTORE STOCK (already done by AutoCancelExpiredOrders)
                    var order = await _context.Orders
                        .FirstOrDefaultAsync(o => o.Id == ticket.OrderId);

                    if (order != null)
                    {
                        // Only cancel if not already cancelled (stock already restored by AutoCancelExpiredOrders)
                        if (order.Status?.ToLower() != "cancelled")
                        {
                            order.Status = "Cancelled";
                            order.UpdatedAt = DateTime.Now;

                            // Only restore stock if this is a NEW cancellation (not already cancelled by auto-expire)
                            var orderItems = await _context.OrderItems
                                .Include(oi => oi.ProductVariant)
                                .Where(oi => oi.OrderId == order.Id)
                                .ToListAsync();

                            foreach (var item in orderItems)
                            {
                                if (item.ProductVariant != null)
                                {
                                    item.ProductVariant.StockQty += item.Qty;
                                    item.ProductVariant.UpdatedAt = DateTime.Now;
                                    Console.WriteLine($"📦 Restored {item.Qty} units of product variant {item.ProductVariantId}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"⚠️ Order {order.Id} already cancelled - skipping stock restoration");
                        }
                    }

                    await _context.SaveChangesAsync();
                    return false;
                }

                // Offer to next closest driver
                ticket.CurrentOfferedDriverId = nextDriver.Driver.Id;
                ticket.OfferExpiresAt = DateTime.Now.AddSeconds(45);
                ticket.Status = "Offered";
                ticket.UpdatedAt = DateTime.Now;

                // Track this driver in memory
                if (!_ticketOfferedDrivers.ContainsKey(ticketId))
                {
                    _ticketOfferedDrivers[ticketId] = new HashSet<int>();
                }
                _ticketOfferedDrivers[ticketId].Add(nextDriver.Driver.Id);

                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Offered ticket {ticketId} to driver {nextDriver.Driver.Id} " +
                                 $"(distance: {nextDriver.Distance:F2} km)");

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error offering ticket {ticketId}: {ex.Message}");
                return false;
            }
        }

        private async Task CheckAndHandleExpiredOffers()
        {
            var expiredTickets = await _context.DeliveryTickets
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.ProductVariant)
                .Where(dt => dt.Status == "Offered"
                          && dt.OfferExpiresAt.HasValue
                          && dt.OfferExpiresAt < DateTime.Now)
                .ToListAsync();

            foreach (var ticket in expiredTickets)
            {
                Console.WriteLine($"⏰ Offer expired for ticket {ticket.Id}, finding next driver...");

                // Track this driver as having been offered (so they don't get it again)
                var expiredDriverId = ticket.CurrentOfferedDriverId;
                if (expiredDriverId.HasValue)
                {
                    if (!_ticketOfferedDrivers.ContainsKey(ticket.Id))
                    {
                        _ticketOfferedDrivers[ticket.Id] = new HashSet<int>();
                    }
                    _ticketOfferedDrivers[ticket.Id].Add(expiredDriverId.Value);
                    Console.WriteLine($"✅ Added driver {expiredDriverId.Value} to expired list for ticket {ticket.Id}");
                }


                // Clear expired offer immediately
                ticket.CurrentOfferedDriverId = null;
                ticket.OfferExpiresAt = null;
                ticket.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                // Try next driver
                var offered = await OfferToNextClosestDriver(ticket.Id);

                if (!offered)
                {
                    // No drivers left - cancel ticket
                    ticket.Status = "Cancelled";
                    ticket.UpdatedAt = DateTime.Now;

                    if (ticket.Order != null)
                    {
                        // Only restore stock if order is NOT already cancelled (by AutoCancelExpiredOrders)
                        if (ticket.Order.Status?.ToLower() != "cancelled")
                        {
                            ticket.Order.Status = "Cancelled";
                            ticket.Order.UpdatedAt = DateTime.Now;

                            // RESTORE STOCK only if this is a NEW cancellation
                            foreach (var item in ticket.Order.OrderItems)
                            {
                                if (item.ProductVariant != null)
                                {
                                    item.ProductVariant.StockQty += item.Qty;
                                    item.ProductVariant.UpdatedAt = DateTime.Now;
                                    Console.WriteLine($"📦 Restored {item.Qty} units of product variant {item.ProductVariantId}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"⚠️ Order {ticket.Order.Id} already cancelled - skipping stock restoration");
                        }
                    }

                    await _context.SaveChangesAsync();
                }
            }
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        // GET: api/DeliveryTickets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDeliveryTickets([FromQuery] int? driverId, [FromQuery] string? status)
        {
            // Only check expired offers if not filtering by specific driver
            // This prevents offers from expiring while driver is viewing them
            if (!driverId.HasValue)
            {
                await CheckAndHandleExpiredOffers();
            }

            var query = _context.DeliveryTickets
                        .Include(dt => dt.Order)
                    .ThenInclude(o => o.Customer)
                        .ThenInclude(c => c.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.UserProfile)
                .Include(dt => dt.Order)
                    .ThenInclude(o => o.Seller)
                        .ThenInclude(s => s.SellerAddresses)
                            .ThenInclude(sa => sa.Address)
                .Include(dt => dt.DeliveryAddress)
                .Include(dt => dt.Driver)
                    .ThenInclude(d => d.UserProfile)
                .AsQueryable();

            // Filter by driver - show jobs they own OR jobs offered to them
            if (driverId.HasValue)
            {
                query = query.Where(dt => dt.DriverId == driverId.Value
                                        || dt.CurrentOfferedDriverId == driverId.Value);
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
                    dt.CurrentOfferedDriverId,
                    dt.OfferExpiresAt,
                    dt.DeliveryNote,
                    order = new
                    {
                        dt.Order.Id,
                        dt.Order.TotalAmount,
                        dt.Order.SubtotalAmount,
                        dt.Order.DeliveryFee,
                        dt.Order.PaymentMethod,
                        dt.Order.Status,
                        customerName = dt.Order.Customer.UserProfile.DisplayName,
                        customerPhone = dt.Order.Customer.Phone,
                        sellerName = dt.Order.Seller.UserProfile.DisplayName,
                        sellerPhone = dt.Order.Seller.Phone,
                         orderNote = dt.Order.OrderNote
                    },

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
                    dt.DeliveryNote,
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
                        orderNote = dt.Order.OrderNote,
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
                await CheckAndHandleExpiredOffers();

                var ticket = await _context.DeliveryTickets.FindAsync(id);

                if (ticket == null)
                    return NotFound();

                // Check if offer expired
                if (ticket.OfferExpiresAt.HasValue && ticket.OfferExpiresAt < DateTime.Now)
                {
                    await OfferToNextClosestDriver(id);
                    return BadRequest("Offer has expired");
                }

                // Check if this driver was actually offered the job
                if (ticket.CurrentOfferedDriverId != dto.DriverId)
                    return BadRequest("This job was not offered to you");

                if (ticket.Status != "Offered")
                    return BadRequest("Ticket is not available");

                ticket.DriverId = dto.DriverId;
                ticket.Status = "Accepted";
                ticket.UpdatedAt = DateTime.Now;
                ticket.CurrentOfferedDriverId = null;
                ticket.OfferExpiresAt = null;

                // Clear the offered drivers tracking for this ticket
                _ticketOfferedDrivers.Remove(id);

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error accepting ticket", error = ex.Message });
            }
        }

        // PUT: api/DeliveryTickets/5/decline
        [HttpPut("{id}/decline")]
        public async Task<IActionResult> DeclineDeliveryTicket(int id)
        {
            try
            {
                var ticket = await _context.DeliveryTickets
                    .Include(dt => dt.Order)
                        .ThenInclude(o => o.OrderItems)
                            .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(dt => dt.Id == id);

                if (ticket == null)
                    return NotFound();

                // Check if offer already expired
                if (ticket.OfferExpiresAt.HasValue && ticket.OfferExpiresAt < DateTime.Now)
                {
                    return BadRequest("Offer has already expired");
                }

                Console.WriteLine($"🚫 Driver declined ticket {id}");

                // Track this driver as having been offered (so they don't get it again)
                var declinedDriverId = ticket.CurrentOfferedDriverId;
                if (declinedDriverId.HasValue)
                {
                    if (!_ticketOfferedDrivers.ContainsKey(id))
                    {
                        _ticketOfferedDrivers[id] = new HashSet<int>();
                    }
                    _ticketOfferedDrivers[id].Add(declinedDriverId.Value);
                    Console.WriteLine($"✅ Added driver {declinedDriverId.Value} to declined list for ticket {id}");
                }

                // Clear current offer immediately
                ticket.CurrentOfferedDriverId = null;
                ticket.OfferExpiresAt = null;
                ticket.UpdatedAt = DateTime.Now;

                // Save immediately to prevent re-offering to same driver
                await _context.SaveChangesAsync();

                // Try to offer to next driver
                var offered = await OfferToNextClosestDriver(id);

                if (!offered)
                {
                    // No more drivers available - cancel ticket AND order AND restore stock
                    ticket.Status = "Cancelled";
                    ticket.UpdatedAt = DateTime.Now;

                    // Update order status
                    if (ticket.Order != null)
                    {
                        // Only restore stock if NOT already cancelled
                        if (ticket.Order.Status?.ToLower() != "cancelled")
                        {
                            ticket.Order.Status = "Cancelled";
                            ticket.Order.UpdatedAt = DateTime.Now;

                            // RESTORE STOCK
                            foreach (var item in ticket.Order.OrderItems)
                            {
                                if (item.ProductVariant != null)
                                {
                                    item.ProductVariant.StockQty += item.Qty;
                                    item.ProductVariant.UpdatedAt = DateTime.Now;
                                    Console.WriteLine($"📦 Restored {item.Qty} units of product variant {item.ProductVariantId}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"⚠️ Order {ticket.Order.Id} already cancelled - skipping stock restoration");
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error declining ticket {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error declining ticket", error = ex.Message });
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
                ticket.UpdatedAt = DateTime.Now;

                // Sync Order Status with Delivery Ticket Status
                switch (dto.Status)
                {
                    case "Accepted":
                        ticket.Order.Status = "Accepted";
                        break;

                    case "Picked Up":
                        ticket.Order.Status = "Picked Up";   // Out for Delivery
                        break;

                    case "Delivered":
                        ticket.Order.Status = "Completed";
                        _ticketOfferedDrivers.Remove(id); // Clear tracking when delivered
                        break;

                    default:
                        ticket.Order.Status = dto.Status;
                        break;
                }

                ticket.Order.UpdatedAt = DateTime.Now;

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
            _ticketOfferedDrivers.Remove(id);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DeliveryTicketExists(int id)
        {
            return _context.DeliveryTickets.Any(e => e.Id == id);
        }
    }
}