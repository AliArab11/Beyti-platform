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
    public class OrderItemsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public OrderItemsController(BeytiContext context)
        {
            _context = context;
        }

        // DTO for creating order items
        public class CreateOrderItemDto
        {
            public int OrderId { get; set; }
            public int ProductVariantId { get; set; }
            public int Qty { get; set; }
            public decimal UnitPrice { get; set; }
        }

        // DTO for updating order items
        public class UpdateOrderItemDto
        {
            public int? Qty { get; set; }
            public decimal? UnitPrice { get; set; }
        }

        // GET: api/OrderItems
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrderItems([FromQuery] int? orderId)
        {
            var query = _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .AsQueryable();

            if (orderId.HasValue)
            {
                query = query.Where(oi => oi.OrderId == orderId.Value);
            }

            var orderItems = await query
                .Select(oi => new
                {
                    oi.Id,
                    oi.OrderId,
                    oi.ProductVariantId,
                    ProductName = oi.ProductVariant.Product.Name,
                    ProductPrice = oi.ProductVariant.Product.BasePrice,
                    VariantSKU = oi.ProductVariant.SKU,
                    oi.Qty,
                    oi.UnitPrice,
                    oi.LineTotal
                })
                .ToListAsync();

            return Ok(orderItems);
        }

        // GET: api/OrderItems/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOrderItem(int id)
        {
            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .Where(oi => oi.Id == id)
                .Select(oi => new
                {
                    oi.Id,
                    oi.OrderId,
                    oi.ProductVariantId,
                    ProductName = oi.ProductVariant.Product.Name,
                    ProductPrice = oi.ProductVariant.Product.BasePrice,
                    VariantSKU = oi.ProductVariant.SKU,
                    oi.Qty,
                    oi.UnitPrice,
                    oi.LineTotal
                })
                .FirstOrDefaultAsync();

            if (orderItem == null)
            {
                return NotFound();
            }

            return Ok(orderItem);
        }

        // POST: api/OrderItems
        [HttpPost]
        public async Task<ActionResult<OrderItem>> PostOrderItem([FromBody] CreateOrderItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate Order exists
            if (!await _context.Orders.AnyAsync(o => o.Id == dto.OrderId))
                return BadRequest("Invalid OrderId");

            // Validate ProductVariant exists
            if (!await _context.ProductVariants.AnyAsync(pv => pv.Id == dto.ProductVariantId))
                return BadRequest("Invalid ProductVariantId");

            // Calculate line total
            var lineTotal = dto.UnitPrice * dto.Qty;

            var orderItem = new OrderItem
            {
                OrderId = dto.OrderId,
                ProductVariantId = dto.ProductVariantId,
                Qty = dto.Qty,
                UnitPrice = dto.UnitPrice,
                LineTotal = lineTotal
            };

            _context.OrderItems.Add(orderItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetOrderItem", new { id = orderItem.Id }, orderItem);
        }

        // PUT: api/OrderItems/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrderItem(int id, [FromBody] UpdateOrderItemDto dto)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null)
            {
                return NotFound();
            }

            // Update only provided fields
            if (dto.Qty.HasValue)
                orderItem.Qty = dto.Qty.Value;

            if (dto.UnitPrice.HasValue)
                orderItem.UnitPrice = dto.UnitPrice.Value;

            // Recalculate line total
            orderItem.LineTotal = orderItem.UnitPrice * orderItem.Qty;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/OrderItems/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderItem(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null)
            {
                return NotFound();
            }

            _context.OrderItems.Remove(orderItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OrderItemExists(int id)
        {
            return _context.OrderItems.Any(e => e.Id == id);
        }
    }
}