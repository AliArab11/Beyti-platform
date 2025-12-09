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


        // GET: api/Orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders([FromQuery] int? customerId, [FromQuery] int? sellerId)
        {
            var query = _context.Orders
            .Include(o => o.Customer)
                .ThenInclude(c => c.UserProfile)

            .Include(o => o.Seller)
                .ThenInclude(s => s.UserProfile)

            // Include pickup address
            .Include(o => o.PickupAddress)

            // Include delivery address
            .Include(o => o.DeliveryAddress)

            // Include seller → sellerAddresses → address
            .Include(o => o.Seller)
                .ThenInclude(s => s.SellerAddresses)
                    .ThenInclude(sa => sa.Address)

            // Include order items → variant → product
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
        customerName = o.Customer.UserProfile.DisplayName,
        sellerName = o.Seller.UserProfile.DisplayName,
        sellerPhone = o.Seller.Phone,

        // ADD THESE LINES - Pickup Address (Seller Location)
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

        // Delivery Address (Customer Location)
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

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOrder(int id)
        {
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetOrder", new { id = order.Id }, order);
        }

        // PUT: api/Orders/{id}/seller-response
        [HttpPut("{id}/seller-response")]
        public async Task<IActionResult> SellerResponseToOrder(int id, [FromBody] SellerOrderResponseDto dto)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.DeliveryTicket)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null)
                    return NotFound();

                order.Status = dto.Status;
                order.UpdatedAt = DateTime.UtcNow;

                // If order is accepted and it's a delivery, create a delivery ticket
                if (dto.Status == "Accepted" && order.FulfillmentType == "Delivery")
                {
                    var deliveryTicket = new DeliveryTicket
                    {
                        OrderId = order.Id,
                        PickupAddressId = order.PickupAddressId,
                        DeliveryAddressId = order.DeliveryAddressId,
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.DeliveryTickets.Add(deliveryTicket);
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

                order.Status = dto.Status;
                order.UpdatedAt = DateTime.UtcNow;

                // If status is "Ready for Pickup" and it's a delivery, update delivery ticket
                if (dto.Status == "Ready for Pickup" && order.FulfillmentType == "Delivery" && order.DeliveryTicket != null)
                {
                    order.DeliveryTicket.Status = "Available";
                    order.DeliveryTicket.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
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

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }
    }
}