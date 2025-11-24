using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Text.Json;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductModerationController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProductModerationController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ProductModeration/Statistics
        [HttpGet("Statistics")]
        public async Task<IActionResult> GetModerationStatistics()
        {
            try
            {
                var totalProducts = await _context.Products.CountAsync();
                var activeProducts = await _context.Products.CountAsync(p => p.IsActive);
                var inactiveProducts = totalProducts - activeProducts;

                // Pending products (you might need to add a Status field to Product table)
                // For now, we'll use IsActive as the indicator
                var recentProducts = await _context.Products
                    .Where(p => p.CreatedAt >= DateTime.UtcNow.AddDays(-7))
                    .CountAsync();

                return Ok(new
                {
                    totalProducts,
                    activeProducts,
                    inactiveProducts,
                    recentProducts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ProductModeration/Products
        [HttpGet("Products")]
        public async Task<IActionResult> GetProducts(
            [FromQuery] bool? isActive = null,
            [FromQuery] string? search = null,
            [FromQuery] int? sellerId = null)
        {
            try
            {
                var query = _context.Products
                    .Include(p => p.Seller)
                        .ThenInclude(s => s.UserProfile)
                    .Include(p => p.SubCategory)
                        .ThenInclude(sc => sc.Category)
                    .AsQueryable();

                // Filter by active status
                if (isActive.HasValue)
                    query = query.Where(p => p.IsActive == isActive.Value);

                // Filter by seller
                if (sellerId.HasValue)
                    query = query.Where(p => p.SellerId == sellerId.Value);

                // Search by name or description
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(p =>
                        p.Name.Contains(search) ||
                        (p.Description != null && p.Description.Contains(search)));

                var products = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        p.Id,
                        p.SellerId,
                        sellerName = p.Seller.UserProfile.DisplayName,
                        sellerStoreName = p.Seller.StoreName,
                        p.Name,
                        p.Description,
                        p.BasePrice,
                        p.IsActive,
                        category = p.SubCategory.Category.Name,
                        subCategory = p.SubCategory.Name,
                        p.CreatedAt,
                        p.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ProductModeration/Products/5
        [HttpGet("Products/{id}")]
        public async Task<IActionResult> GetProductDetails(int id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Seller)
                        .ThenInclude(s => s.UserProfile)
                    .Include(p => p.SubCategory)
                        .ThenInclude(sc => sc.Category)
                    .Include(p => p.ProductVariants)
                    .Where(p => p.Id == id)
                    .Select(p => new
                    {
                        p.Id,
                        p.SellerId,
                        sellerName = p.Seller.UserProfile.DisplayName,
                        sellerStoreName = p.Seller.StoreName,
                        p.Name,
                        p.Description,
                        p.BasePrice,
                        p.IsActive,
                        category = p.SubCategory.Category.Name,
                        subCategory = p.SubCategory.Name,
                        p.CreatedAt,
                        p.UpdatedAt,
                        variants = p.ProductVariants.Select(v => new
                        {
                            v.Id,
                            v.SKU,
                            v.Price,
                            v.StockQty,
                        })
                    })
                    .FirstOrDefaultAsync();

                if (product == null)
                    return NotFound();

                return Ok(product);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ProductModeration/Products/5/approve
        [HttpPut("Products/{id}/approve")]
        public async Task<IActionResult> ApproveProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null) return NotFound();

                product.IsActive = true;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Product approved successfully", product });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/ProductModeration/Products/5/suspend
        [HttpPut("Products/{id}/suspend")]
        public async Task<IActionResult> SuspendProduct(int id, [FromBody] JsonElement body)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null) return NotFound();

                product.IsActive = false;
                product.UpdatedAt = DateTime.UtcNow;

                // You could add a reason field to track why it was suspended
                string? reason = null;
                if (body.TryGetProperty("reason", out var reasonProp))
                    reason = reasonProp.GetString();

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Product suspended successfully",
                    product,
                    reason
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/ProductModeration/Products/5
        [HttpDelete("Products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.ProductVariants)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (product == null) return NotFound();

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Product deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/ProductModeration/FlaggedKeywords
        [HttpGet("FlaggedKeywords")]
        public async Task<IActionResult> CheckFlaggedKeywords([FromQuery] string text)
        {
            // Define prohibited keywords
            var prohibitedKeywords = new[]
            {
                "drug", "drugs", "cocaine", "heroin", "marijuana", "weed", "cannabis",
                "cigarette", "cigar", "tobacco", "vape", "e-cigarette",
                "weapon", "gun", "rifle", "pistol", "ammunition",
                "alcohol", "beer", "wine", "vodka", "whiskey",
                "porn", "adult", "xxx", "explicit"
            };

            var foundKeywords = prohibitedKeywords
                .Where(keyword => text.ToLower().Contains(keyword))
                .ToList();

            return Ok(new
            {
                isFlagged = foundKeywords.Any(),
                flaggedKeywords = foundKeywords,
                message = foundKeywords.Any()
                    ? "This content contains prohibited keywords"
                    : "No prohibited keywords found"
            });
        }
    }
}