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
    public class OrdersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public OrdersController(BeytiContext context)
        {
            _context = context;
        }

        // DTO for creating orders 
        public class CreateOrderDto
        {
            public int CustomerId { get; set; }
            public int SellerId { get; set; }
            public int? DeliveryAddressId { get; set; }
            public int? PickupAddressId { get; set; }
            public string PaymentMethod { get; set; } = null!;
            public string PaymentStatus { get; set; } = null!;
            public string FulfillmentType { get; set; } = null!;
            public string Status { get; set; } = null!;
            public decimal SubtotalAmount { get; set; }
            public decimal DeliveryFee { get; set; }
            public decimal? TotalAmount { get; set; }
            public string? OrderNote { get; set; }
            public string? DeliveryNote { get; set; }
        }
        public class UpdateOrderDto
        {
            public string? Status { get; set; }
            public string? PaymentStatus { get; set; }
            public decimal? DeliveryFee { get; set; }
            public decimal? TotalAmount { get; set; }
        }
        public class SellerOrderResponseDto
        {
            public string? Status { get; set; }
            public string? SellerNote { get; set; }
        }

        public class StockValidationItem
        {
            public int ProductId { get; set; }
            public int VariantId { get; set; }
            public int Quantity { get; set; }
        }


        // GET: api/Orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders([FromQuery] int? customerId, [FromQuery] int? sellerId)
        {
            // AUTO-CANCEL EXPIRED ORDERS BEFORE RETURNING RESULTS
            await AutoCancelExpiredOrders();

            var query = _context.Orders
            .Include(o => o.Customer)
                .ThenInclude(c => c.UserProfile)

            .Include(o => o.Seller)
                .ThenInclude(s => s.UserProfile)

            .Include(o => o.PickupAddress)
            .Include(o => o.DeliveryAddress)

            .Include(o => o.Seller)
                .ThenInclude(s => s.SellerAddresses)
                    .ThenInclude(sa => sa.Address)

            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
            .AsQueryable();

            if (customerId.HasValue)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }

            if (sellerId.HasValue)
            {
                query = query.Where(o => o.SellerId == sellerId.Value);
            }

            var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.CustomerId,
                o.SellerId,
                o.DeliveryAddressId,
                o.PickupAddressId,
                o.PaymentMethod,
                o.PaymentStatus,
                o.FulfillmentType,
                o.Status,
                o.SubtotalAmount,
                o.DeliveryFee,
                o.TotalAmount,
                o.CreatedAt,
                o.UpdatedAt,
                o.OrderNote,
                customerName = o.Customer.UserProfile.DisplayName,
                sellerName = o.Seller.UserProfile.DisplayName,
                sellerPhone = o.Seller.Phone,

                pickupAddress = o.PickupAddress != null ? new
                {
                    o.PickupAddress.Id,
                    o.PickupAddress.Street,
                    o.PickupAddress.City,
                    o.PickupAddress.Region,
                    o.PickupAddress.Country,
                    o.PickupAddress.Latitude,
                    o.PickupAddress.Longitude,
                } : null,

                deliveryAddress = o.DeliveryAddress != null ? new
                {
                    o.DeliveryAddress.Id,
                    o.DeliveryAddress.Street,
                    o.DeliveryAddress.City,
                    o.DeliveryAddress.Region,
                    o.DeliveryAddress.Country,
                    o.DeliveryAddress.Latitude,
                    o.DeliveryAddress.Longitude,
                } : null,

                orderItems = o.OrderItems.Select(oi => new
                {
                    oi.Id,
                    oi.OrderId,
                    oi.ProductVariantId,
                    productId = oi.ProductVariant.Product.Id,
                    productName = oi.ProductVariant.Product.Name,
                    productPrice = oi.ProductVariant.Product.BasePrice,
                    variantSKU = oi.ProductVariant.SKU,
                    oi.Qty,
                    oi.UnitPrice,
                    oi.LineTotal
                }).ToList()
            })
            .ToListAsync();

            return Ok(orders);
        }

        // Helper method to auto-cancel expired orders
        private async Task AutoCancelExpiredOrders()
        {
            var now = DateTime.UtcNow;
            var expiryThreshold = now.AddMinutes(-10); // 10 minutes ago

            var expiredOrders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.ProductVariant)
                .Where(o => (o.Status == "Placed" || o.Status == "Pending")
                            && o.CreatedAt <= expiryThreshold)
                .ToListAsync();

            if (expiredOrders.Any())
            {
                foreach (var order in expiredOrders)
                {
                    // Update order status
                    order.Status = "Cancelled";
                    order.UpdatedAt = now;

                    // Restore stock for each order item
                    foreach (var item in order.OrderItems)
                    {
                        if (item.ProductVariant != null)
                        {
                            item.ProductVariant.StockQty += item.Qty;
                            item.ProductVariant.UpdatedAt = now;
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
        }

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOrder(int id)
        {
            // AUTO-CANCEL EXPIRED ORDERS BEFORE RETURNING RESULT
            await AutoCancelExpiredOrders();

            var o = await _context.Orders
                .Include(o => o.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(o => o.Seller)
                    .ThenInclude(s => s.UserProfile)
                .Include(o => o.PickupAddress)
                .Include(o => o.DeliveryAddress)
                .Include(o => o.Seller)
                    .ThenInclude(s => s.SellerAddresses)
                        .ThenInclude(sa => sa.Address)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (o == null)
                return NotFound();

            return Ok(new
            {
                o.Id,
                o.CustomerId,
                o.SellerId,
                o.PaymentMethod,
                o.PaymentStatus,
                o.FulfillmentType,
                o.Status,
                o.SubtotalAmount,
                o.DeliveryFee,
                o.TotalAmount,
                o.CreatedAt,
                o.UpdatedAt,
                o.OrderNote,
                customerName = o.Customer?.UserProfile?.DisplayName,
                sellerName = o.Seller?.UserProfile?.DisplayName,
                sellerPhone = o.Seller?.Phone,

                pickupAddress = o.PickupAddress != null ? new
                {
                    o.PickupAddress.Id,
                    o.PickupAddress.Street,
                    o.PickupAddress.City,
                    o.PickupAddress.Region,
                    o.PickupAddress.Country,
                    o.PickupAddress.Latitude,
                    o.PickupAddress.Longitude
                } : null,

                deliveryAddress = o.DeliveryAddress != null ? new
                {
                    o.DeliveryAddress.Id,
                    o.DeliveryAddress.Street,
                    o.DeliveryAddress.City,
                    o.DeliveryAddress.Region,
                    o.DeliveryAddress.Country,
                    o.DeliveryAddress.Latitude,
                    o.DeliveryAddress.Longitude
                } : null
            });
        }


        // PUT: api/Orders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, [FromBody] UpdateOrderDto dto)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                {
                    return NotFound();
                }

                // Update only the fields that are provided
                if (!string.IsNullOrEmpty(dto.Status))
                    order.Status = dto.Status;

                if (!string.IsNullOrEmpty(dto.PaymentStatus))
                    order.PaymentStatus = dto.PaymentStatus;

                if (dto.DeliveryFee.HasValue)
                    order.DeliveryFee = dto.DeliveryFee.Value;

                if (dto.TotalAmount.HasValue)
                    order.TotalAmount = dto.TotalAmount.Value;

                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating order", error = ex.Message });
            }
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult<Order>> PostOrder([FromBody] CreateOrderDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate Customer exists
            if (!await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId))
                return BadRequest("Invalid CustomerId");

            // Validate Seller exists
            if (!await _context.Sellers.AnyAsync(s => s.Id == dto.SellerId))
                return BadRequest("Invalid SellerId");

            // Validate DeliveryAddress if provided
            if (dto.DeliveryAddressId.HasValue && !await _context.Addresses.AnyAsync(a => a.Id == dto.DeliveryAddressId.Value))
                return BadRequest("Invalid DeliveryAddressId");

            // Validate PickupAddress if provided
            if (dto.PickupAddressId.HasValue && !await _context.Addresses.AnyAsync(a => a.Id == dto.PickupAddressId.Value))
                return BadRequest("Invalid PickupAddressId");

            // Create order with ALL the fields from DTO
            var order = new Order
            {
                CustomerId = dto.CustomerId,
                SellerId = dto.SellerId,
                DeliveryAddressId = dto.DeliveryAddressId,
                PickupAddressId = dto.PickupAddressId,
                PaymentMethod = dto.PaymentMethod,
                PaymentStatus = dto.PaymentStatus,
                FulfillmentType = dto.FulfillmentType,
                Status = dto.Status,
                SubtotalAmount = dto.SubtotalAmount,
                DeliveryFee = dto.DeliveryFee,
                TotalAmount = dto.TotalAmount,
                OrderNote = dto.OrderNote, 
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Create delivery ticket immediately if delivery order
            if (order.FulfillmentType == "Delivery")
            {
                var deliveryTicket = new DeliveryTicket
                {
                    OrderId = order.Id,
                    PickupAddressId = order.PickupAddressId,
                    DeliveryAddressId = order.DeliveryAddressId,
                    Status = "Pending",
                    DeliveryNote = dto.DeliveryNote,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.DeliveryTickets.Add(deliveryTicket);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetOrder", new { id = order.Id }, order);
        }

        // POST: api/Orders/validate-stock
        [HttpPost("validate-stock")]
        public async Task<ActionResult<object>> ValidateStock([FromBody] List<StockValidationItem> items)
        {
            var unavailableItems = new List<object>();
            var adjustedItems = new List<object>();

            foreach (var item in items)
            {
                var variant = await _context.ProductVariants
                    .Include(pv => pv.Product)
                    .FirstOrDefaultAsync(pv => pv.Id == item.VariantId);

                if (variant == null)
                {
                    unavailableItems.Add(new
                    {
                        productId = item.ProductId,
                        productName = "Unknown Product",
                        requested = item.Quantity,
                        available = 0
                    });
                    continue;
                }

                if (variant.StockQty == 0)
                {
                    unavailableItems.Add(new
                    {
                        productId = item.ProductId,
                        productName = variant.Product.Name,
                        requested = item.Quantity,
                        available = 0
                    });
                }
                else if (variant.StockQty < item.Quantity)
                {
                    adjustedItems.Add(new
                    {
                        productId = item.ProductId,
                        productName = variant.Product.Name,
                        variantId = item.VariantId,
                        requested = item.Quantity,
                        available = variant.StockQty
                    });
                }
            }

            if (unavailableItems.Count > 0 || adjustedItems.Count > 0)
            {
                return Ok(new
                {
                    valid = false,
                    unavailableItems,
                    adjustedItems
                });
            }

            return Ok(new { valid = true });
        }

        // POST: api/Orders/reserve-stock
        [HttpPost("reserve-stock")]
        public async Task<ActionResult> ReserveStock([FromBody] List<StockValidationItem> items)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var item in items)
                {
                    // Load normally (EF tracking)
                    var variant = await _context.ProductVariants
                        .Include(v => v.Product)
                        .FirstOrDefaultAsync(v => v.Id == item.VariantId);

                    if (variant == null)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { success = false, message = $"Variant {item.VariantId} not found" });
                    }

                    // Apply row-level update lock
                    await _context.Database.ExecuteSqlRawAsync(
                        "SELECT 1 FROM ProductVariant WITH (UPDLOCK, ROWLOCK) WHERE Id = {0}",
                        item.VariantId
                    );


                    if (variant.StockQty < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new
                        {
                            success = false,
                            message = $"Insufficient stock for {variant.Product?.Name ?? "product"}. Requested: {item.Quantity}, Available: {variant.StockQty}"
                        });
                    }

                    variant.StockQty -= item.Quantity;
                    variant.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Stock reserved successfully" });  // ✅ NOW RETURNS JSON
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error reserving stock", error = ex.Message });
            }
        }


        // POST: api/Orders/{orderId}/restore-stock
        [HttpPost("{orderId}/restore-stock")]
        public async Task<ActionResult> RestoreStock(int orderId)
        {
            var orderItems = await _context.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .ToListAsync();

            foreach (var item in orderItems)
            {
                var variant = await _context.ProductVariants.FindAsync(item.ProductVariantId);
                if (variant != null)
                {
                    variant.StockQty += item.Qty;
                    variant.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Stock restored successfully" });
        }

        // PUT: api/Orders/{id}/seller-response
        [HttpPut("{id}/seller-response")]
        public async Task<IActionResult> SellerResponseToOrder(int id, [FromBody] SellerOrderResponseDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.DeliveryTicket)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.ProductVariant)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                    return NotFound();



                // Store the old status to check if we're transitioning TO cancelled
                var oldStatus = order.Status;

                order.Status = dto.Status;
                order.UpdatedAt = DateTime.UtcNow;

                // Only restore stock if we're NEWLY cancelling (not already cancelled)
                if (dto.Status == "Cancelled" && oldStatus != "Cancelled")
                {
                    foreach (var item in order.OrderItems)
                    {
                        if (item.ProductVariant != null)
                        {
                            item.ProductVariant.StockQty += item.Qty;
                            item.ProductVariant.UpdatedAt = DateTime.UtcNow;
                        }
                    }
                }

                // If order is accepted and it's a delivery, ticket already exists - just keep it pending
                if (dto.Status == "Accepted" && order.FulfillmentType == "Delivery")
                {
                    // Ticket already exists from order creation, stays in Pending status
                    if (order.DeliveryTicket != null)
                    {
                        order.DeliveryTicket.Status = "Pending";
                        order.DeliveryTicket.UpdatedAt = DateTime.UtcNow;
                    }
                }

                // If order is cancelled, cancel the delivery ticket too
                if (dto.Status == "Cancelled" && order.DeliveryTicket != null)
                {
                    order.DeliveryTicket.Status = "Cancelled";
                    order.DeliveryTicket.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating order", error = ex.Message });
            }
        }

        // PUT: api/Orders/{id}/update-seller-status
        [HttpPut("{id}/update-seller-status")]
        public async Task<IActionResult> UpdateSellerStatus(int id, [FromBody] UpdateOrderDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.DeliveryTicket)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                    return NotFound();

                var currentStatus = order.Status?.ToLower();
                var newStatus = dto.Status?.ToLower();

                // Status progression order
                var statusOrder = new Dictionary<string, int>
        {
            { "placed", 1 },
            { "pending", 1 },
            { "accepted", 2 },
            { "preparing", 3 },
            { "ready for pickup", 4 },
            { "picked up", 5 },
            { "completed", 6 },
            { "delivered", 6 },
            { "cancelled", 7 }
        };

                // CRITICAL FIX: Block refresh attempts - if status hasn't changed, ignore
                if (currentStatus == newStatus && newStatus != "cancelled")
                {
                    Console.WriteLine($"⚠️ Order {id} - Ignoring duplicate status update: {newStatus}");
                    return NoContent();
                }

                // CRITICAL FIX: Prevent going backwards (except to cancelled)
                if (statusOrder.ContainsKey(currentStatus) && statusOrder.ContainsKey(newStatus))
                {
                    if (newStatus != "cancelled" && statusOrder[newStatus] < statusOrder[currentStatus])
                    {
                        Console.WriteLine($"❌ Order {id} - Cannot revert from {currentStatus} to {newStatus}");
                        return BadRequest(new { message = $"Cannot revert status from {currentStatus} to {newStatus}" });
                    }
                }

                // SPECIAL HANDLING FOR DELIVERY ORDERS
                if (order.FulfillmentType == "Delivery" && dto.Status == "Ready for Pickup")
                {
                    // CRITICAL: Check if delivery ticket exists and is still in offering phase
                    if (order.DeliveryTicket != null)
                    {
                        var ticketStatus = order.DeliveryTicket.Status?.ToLower();

                        // Only trigger offering if ticket is pending (not yet offered to any driver)
                        if (ticketStatus == "pending" || ticketStatus == null)
                        {
                            // Update order status to "Ready for Pickup" (seller can't click again)
                            order.Status = "Ready for Pickup";

                            // Update delivery ticket to start offering to drivers
                            order.DeliveryTicket.Status = "Pending";
                            order.DeliveryTicket.UpdatedAt = DateTime.UtcNow;
                            await _context.SaveChangesAsync();

                            // Trigger the offering process
                            await OfferToNextClosestDriver(order.DeliveryTicket.Id);

                            Console.WriteLine($"✅ Order {id} marked Ready for Pickup - offering to drivers started");
                        }
                        else
                        {
                            // Ticket already being offered/accepted - don't allow status change
                            Console.WriteLine($"⚠️ Order {id} - Delivery ticket already in progress ({ticketStatus}), ignoring refresh");
                            return NoContent();
                        }
                    }
                    else
                    {
                        // No delivery ticket yet - set status but don't trigger drivers
                        order.Status = "Ready for Pickup";
                        Console.WriteLine($"⚠️ Order {id} - No delivery ticket found, status updated but drivers not triggered");
                    }
                }
                else
                {
                    // Normal status progression for non-delivery or other statuses
                    order.Status = dto.Status;
                }

                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                Console.WriteLine($"✅ Order {id} - Status updated: {currentStatus} → {newStatus}");
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Order {id} - Error: {ex.Message}");
                return StatusCode(500, new { message = "Error updating status", error = ex.Message });
            }
        }


        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // In-memory cache for route data (keyed by orderId)
        private static readonly Dictionary<int, RouteData> _routeCache = new();

        private class RouteData
        {
            public List<double[]> RoutePoints { get; set; } = new();
            public double TotalDuration { get; set; } // seconds
            public DateTime PickupTime { get; set; }
        }

        // GET: api/Orders/{orderId}/tracking
        [HttpGet("{orderId}/tracking")]
        public async Task<ActionResult<object>> GetOrderTracking(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.DeliveryTicket)
                .Include(o => o.PickupAddress)
                .Include(o => o.DeliveryAddress)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return NotFound();

            // Only show map when driver has picked up the order
            if (order.Status != "Picked Up")
            {
                return Ok(new
                {
                    showMap = false,
                    status = order.Status
                });
            }

            var ticket = order.DeliveryTicket;
            if (ticket == null || order.PickupAddress == null || order.DeliveryAddress == null)
            {
                return Ok(new { showMap = false, status = order.Status });
            }

            var pickupLat = (double)(order.PickupAddress.Latitude ?? 0);
            var pickupLng = (double)(order.PickupAddress.Longitude ?? 0);
            var deliveryLat = (double)(order.DeliveryAddress.Latitude ?? 0);
            var deliveryLng = (double)(order.DeliveryAddress.Longitude ?? 0);

            // Check if we have route cached, if not fetch from OSRM
            if (!_routeCache.ContainsKey(orderId))
            {
                try
                {
                    var route = await FetchOSRMRoute(pickupLng, pickupLat, deliveryLng, deliveryLat);
                    _routeCache[orderId] = new RouteData
                    {
                        RoutePoints = route.RoutePoints,
                        TotalDuration = route.Duration,
                        PickupTime = ticket.UpdatedAt
                    };
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ OSRM Error: {ex.Message}");
                    // Fallback to straight line if OSRM fails
                    _routeCache[orderId] = new RouteData
                    {
                        RoutePoints = new List<double[]>
                {
                    new[] { pickupLng, pickupLat },
                    new[] { deliveryLng, deliveryLat }
                },
                        TotalDuration = 900, // 15 min default
                        PickupTime = ticket.UpdatedAt
                    };
                }
            }

            var routeData = _routeCache[orderId];
            var timeSincePickup = (DateTime.UtcNow - routeData.PickupTime).TotalSeconds;
            var progress = Math.Min(timeSincePickup / routeData.TotalDuration, 1.0);

            // Find driver position along route
            var totalPoints = routeData.RoutePoints.Count;
            var targetIndex = (int)(progress * (totalPoints - 1));
            targetIndex = Math.Min(targetIndex, totalPoints - 1);

            var driverPoint = routeData.RoutePoints[targetIndex];

            // Calculate remaining time
            var remainingSeconds = Math.Max(0, routeData.TotalDuration - timeSincePickup);

            return Ok(new
            {
                showMap = true,
                status = order.Status,
                driverLocation = new
                {
                    latitude = driverPoint[1],
                    longitude = driverPoint[0]
                },
                pickupLocation = new
                {
                    latitude = pickupLat,
                    longitude = pickupLng
                },
                deliveryLocation = new
                {
                    latitude = deliveryLat,
                    longitude = deliveryLng
                },
                estimatedArrival = remainingSeconds / 60.0, // convert to minutes
                routePolyline = routeData.RoutePoints.Select(p => new[] { p[1], p[0] }).ToList() // [lat, lng] for frontend
            });
        }

        private async Task<(List<double[]> RoutePoints, double Duration)> FetchOSRMRoute(
            double startLng, double startLat, double endLng, double endLat)
        {
            using var client = new HttpClient();
            var url = $"https://router.project-osrm.org/route/v1/driving/{startLng},{startLat};{endLng},{endLat}?overview=full&geometries=geojson";

            var response = await client.GetStringAsync(url);
            var json = System.Text.Json.JsonDocument.Parse(response);

            var coordinates = json.RootElement
                .GetProperty("routes")[0]
                .GetProperty("geometry")
                .GetProperty("coordinates")
                .EnumerateArray()
                .Select(coord => new[]
                {
            coord[0].GetDouble(), // lng
            coord[1].GetDouble()  // lat
                })
                .ToList();

            var duration = json.RootElement
                .GetProperty("routes")[0]
                .GetProperty("duration")
                .GetDouble();

            return (coordinates, duration);
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
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

                decimal? pickupLat = ticket.PickupAddress?.Latitude
                    ?? ticket.Order?.Seller?.SellerAddresses?.FirstOrDefault()?.Address?.Latitude;
                decimal? pickupLng = ticket.PickupAddress?.Longitude
                    ?? ticket.Order?.Seller?.SellerAddresses?.FirstOrDefault()?.Address?.Longitude;

                if (pickupLat == null || pickupLng == null) return false;

                var availableDrivers = await _context.Drivers
                    .Where(d => d.Status == "Active" && d.CurrentLat != null && d.CurrentLng != null)
                    .Where(d => !_context.DeliveryTickets
                        .Any(dt => dt.DriverId == d.Id && (dt.Status == "Accepted" || dt.Status == "Picked Up")))
                    .ToListAsync();

                if (!availableDrivers.Any()) return false;

                var closest = availableDrivers
                    .OrderBy(d => Math.Sqrt(
                        Math.Pow((double)(d.CurrentLat.Value - pickupLat.Value), 2) +
                        Math.Pow((double)(d.CurrentLng.Value - pickupLng.Value), 2)))
                    .FirstOrDefault();

                if (closest == null) return false;

                ticket.CurrentOfferedDriverId = closest.Id;
                ticket.OfferExpiresAt = DateTime.UtcNow.AddSeconds(45);
                ticket.Status = "Offered";

                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}