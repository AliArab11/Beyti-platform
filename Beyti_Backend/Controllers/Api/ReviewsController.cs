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
    public class ReviewsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ReviewsController(BeytiContext context)
        {
            _context = context;
        }

        // DTO for creating reviews
        public class CreateReviewDto
        {
            public int OrderId { get; set; }
            public int ProductId { get; set; }
            public int CustomerId { get; set; }
            public int Rating { get; set; }
            public string? Comment { get; set; }
        }

        public class UpdateReviewDto
        {
            public bool IsCommentHiddenBySeller { get; set; }
            public string? HiddenReason { get; set; }
        }

        // GET: api/Reviews
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews([FromQuery] int? productId, [FromQuery] int? customerId)
        {
            var query = _context.Reviews
                .Include(r => r.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(r => r.Product)
                .Include(r => r.Order)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(r => r.ProductId == productId.Value);
            }

            if (customerId.HasValue)
            {
                query = query.Where(r => r.CustomerId == customerId.Value);
            }

            var reviews = await query
                .Select(r => new
                {
                    r.Id,
                    r.OrderId,
                    r.ProductId,
                    productName = r.Product.Name,
                    r.CustomerId,
                    customerName = r.Customer.UserProfile.DisplayName,
                    r.Rating,
                    r.Comment,
                    r.IsCommentHiddenBySeller,
                    r.HiddenAt,
                    r.HiddenReason,
                    r.CreatedAt
                })
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/Reviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetReview(int id)
        {
            var review = await _context.Reviews
                .Include(r => r.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(r => r.Product)
                .Include(r => r.Order)
                .Where(r => r.Id == id)
                .Select(r => new
                {
                    r.Id,
                    r.OrderId,
                    r.ProductId,
                    productName = r.Product.Name,
                    r.CustomerId,
                    customerName = r.Customer.UserProfile.DisplayName,
                    r.Rating,
                    r.Comment,
                    r.IsCommentHiddenBySeller,
                    r.HiddenAt,
                    r.HiddenReason,
                    r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (review == null)
            {
                return NotFound();
            }

            return Ok(review);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult<object>> PostReview([FromBody] CreateReviewDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate that the order exists and belongs to the customer
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.CustomerId == dto.CustomerId);

            if (order == null)
                return BadRequest("Invalid order or customer");

            // Check if order status is "Completed"
            if (order.Status?.ToLower() != "completed")
                return BadRequest("You can only review completed orders");

            // Validate that the product exists in this order
            var orderItem = await _context.OrderItems
                .Include(oi => oi.ProductVariant)
                .FirstOrDefaultAsync(oi => oi.OrderId == dto.OrderId && oi.ProductVariant.ProductId == dto.ProductId);

            if (orderItem == null)
                return BadRequest("Product not found in this order");

            // Check if review already exists
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.OrderId == dto.OrderId && r.ProductId == dto.ProductId && r.CustomerId == dto.CustomerId);

            if (existingReview != null)
                return BadRequest("You have already reviewed this product from this order");

            // Validate rating
            if (dto.Rating < 1 || dto.Rating > 5)
                return BadRequest("Rating must be between 1 and 5");

            var review = new Review
            {
                OrderId = dto.OrderId,
                ProductId = dto.ProductId,
                CustomerId = dto.CustomerId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                IsCommentHiddenBySeller = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Return a clean object without navigation properties
            return CreatedAtAction("GetReview", new { id = review.Id }, new
            {
                id = review.Id,
                orderId = review.OrderId,
                productId = review.ProductId,
                customerId = review.CustomerId,
                rating = review.Rating,
                comment = review.Comment,
                createdAt = review.CreatedAt
            });
        }

        // PUT: api/Reviews/5 (for hiding/unhiding reviews by seller)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(int id, [FromBody] UpdateReviewDto updateData)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            try
            {
                review.IsCommentHiddenBySeller = updateData.IsCommentHiddenBySeller;
                review.HiddenAt = updateData.IsCommentHiddenBySeller ? DateTime.UtcNow : null;
                review.HiddenReason = updateData.HiddenReason;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating review", error = ex.Message });
            }
        }

        // DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReviewExists(int id)
        {
            return _context.Reviews.Any(e => e.Id == id);
        }
    }
}