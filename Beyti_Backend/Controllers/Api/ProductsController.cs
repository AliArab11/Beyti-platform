using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_Backend.Services;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly ISignalRService _signalRService;

        public ProductsController(BeytiContext context, ISignalRService signalRService)
        {
            _context = context;
            _signalRService = signalRService;
        }

        // Add this at the top with your other using statements
        public class CreateProductDto
        {
            public string Name { get; set; }
            public string? Description { get; set; }
            public decimal BasePrice { get; set; }
            public int SellerId { get; set; }
            public int? SubCategoryId { get; set; }  // ← Made nullable
            public int? StoreSectionId { get; set; }  // ← NEW
            public int? GenderId { get; set; }
            public decimal? DiscountPercentage { get; set; }
        }

        public class UpdateProductDto
        {
            public string Name { get; set; } = null!;
            public string? Description { get; set; }
            public decimal BasePrice { get; set; }
            public int SellerId { get; set; }
            public int? SubCategoryId { get; set; }  // ← Made nullable
            public int? StoreSectionId { get; set; }  // ← NEW
            public byte? GenderId { get; set; }
            public decimal? DiscountPercentage { get; set; }
        }

        public class UpdateProductImageDto
        {
            public string? ImageBase64 { get; set; }
        }


        [HttpGet("sellers-dropdown")]
        public async Task<ActionResult<IEnumerable<object>>> GetSellerDropdown()
        {
            return await _context.Sellers
                .Select(s => new { s.Id, s.StoreName })
                .ToListAsync();
        }

        [HttpGet("subcategories-dropdown")]
        public async Task<ActionResult<IEnumerable<object>>> GetSubCategoryDropdown()
        {
            return await _context.SubCategories
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();
        }




        // GET: api/Products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.ToListAsync();
        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProduct(int id)
        {
            var product = await _context.Products
            .Include(p => p.SubCategory)
                .ThenInclude(sc => sc.Category)
            .Include(p => p.Reviews)
                .ThenInclude(r => r.Customer)
                    .ThenInclude(c => c.UserProfile)
            .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            // Reviews logic
            var allReviews = product.Reviews.ToList();

            decimal? averageRating = null;

            // Only show average if at least 5 reviews exist
            if (allReviews.Count >= 5)
            {
                averageRating = Math.Round(
                    (decimal)allReviews.Average(r => r.Rating),
                    1
                );
            }

            // For customer-facing view: show all reviews but hide comments for hidden ones
            var customerReviews = allReviews.Select(r => new
            {
                id = r.Id,
                customerId = r.CustomerId,
                customerName = r.Customer?.UserProfile?.DisplayName ?? "Anonymous",
                rating = r.Rating,
                comment = r.IsCommentHiddenBySeller ? null : r.Comment,
                createdAt = r.CreatedAt,
                isCommentHidden = r.IsCommentHiddenBySeller
            }).OrderByDescending(r => r.createdAt).ToList();

            return Ok(new
            {
                id = product.Id,
                name = product.Name,
                description = product.Description,
                basePrice = product.BasePrice,
                discountPercentage = product.DiscountPercentage,
                isActive = product.IsActive,
                imageUrl = product.ImageUrl,  // ← ADD THIS LINE
                averageRating,
                reviewCount = allReviews.Count,
                reviews = customerReviews,
                subCategory = product.SubCategory != null ? new
                {
                    id = product.SubCategory.Id,
                    name = product.SubCategory.Name,
                    category = product.SubCategory.Category != null ? new
                    {
                        id = product.SubCategory.Category.Id,
                        name = product.SubCategory.Category.Name
                    } : null
                } : null,
                createdAt = product.CreatedAt
            });
        }

        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, [FromBody] UpdateProductDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound();

            // Optional safety checks (recommended)
            if (!_context.Sellers.Any(s => s.Id == dto.SellerId))
                return BadRequest("Invalid SellerId");

            if (dto.SubCategoryId.HasValue && !_context.SubCategories.Any(sc => sc.Id == dto.SubCategoryId))
                return BadRequest("Invalid SubCategoryId");

            if (dto.StoreSectionId.HasValue && !_context.StoreSections.Any(ss => ss.Id == dto.StoreSectionId))
                return BadRequest("Invalid StoreSectionId");

            // Apply updates
            product.Name = dto.Name;
            product.Description = dto.Description;
            product.BasePrice = dto.BasePrice;
            product.SellerId = dto.SellerId;
            product.SubCategoryId = dto.SubCategoryId;
            product.StoreSectionId = dto.StoreSectionId;  // ← NEW
            product.GenderId = dto.GenderId;
            product.DiscountPercentage = dto.DiscountPercentage;
            product.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            // Get seller's user profile for SignalR notification
            var seller = await _context.Sellers
                .Include(s => s.UserProfile)
                .FirstOrDefaultAsync(s => s.Id == product.SellerId);

            // Send real-time product updated update via SignalR
            if (seller?.UserProfile != null)
            {
                await _signalRService.SendProductUpdatedAsync(
                    sellerId: seller.UserProfile.Id,
                    productData: new
                    {
                        id = product.Id,
                        name = product.Name,
                        description = product.Description,
                        basePrice = product.BasePrice,
                        imageUrl = product.ImageUrl,
                        isActive = product.IsActive,
                        sellerId = product.SellerId,
                        subCategoryId = product.SubCategoryId,
                        updatedAt = product.UpdatedAt
                    }
                );
            }

            return NoContent();
        }


        // POST: api/Products
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct([FromBody] CreateProductDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!_context.Sellers.Any(s => s.Id == dto.SellerId))
                return BadRequest("Invalid SellerId");

            if (dto.SubCategoryId.HasValue && !_context.SubCategories.Any(sc => sc.Id == dto.SubCategoryId))
                return BadRequest("Invalid SubCategoryId");

            if (dto.StoreSectionId.HasValue && !_context.StoreSections.Any(ss => ss.Id == dto.StoreSectionId))
                return BadRequest("Invalid StoreSectionId");

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                BasePrice = dto.BasePrice,
                DiscountPercentage = dto.DiscountPercentage,
                SellerId = dto.SellerId,
                SubCategoryId = dto.SubCategoryId,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsActive = true
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Reload product to get all navigation properties
            var createdProduct = await _context.Products
                .Include(p => p.SubCategory)
                .Include(p => p.Seller)
                    .ThenInclude(s => s.UserProfile)
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            // Send real-time product created update via SignalR
            if (createdProduct?.Seller?.UserProfile != null)
            {
                await _signalRService.SendProductCreatedAsync(
                    sellerId: createdProduct.Seller.UserProfile.Id,
                    productData: new
                    {
                        id = createdProduct.Id,
                        name = createdProduct.Name,
                        description = createdProduct.Description,
                        basePrice = createdProduct.BasePrice,
                        imageUrl = createdProduct.ImageUrl,
                        isActive = createdProduct.IsActive,
                        sellerId = createdProduct.SellerId,
                        subCategoryId = createdProduct.SubCategoryId,
                        createdAt = createdProduct.CreatedAt
                    }
                );
            }

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new
            {
                id = createdProduct.Id,
                name = createdProduct.Name,
                basePrice = createdProduct.BasePrice,
                imageUrl = createdProduct.ImageUrl,
                isActive = createdProduct.IsActive
            });
        }


        // DELETE: api/Products/5 - Now toggles IsActive instead of deleting
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Seller)
                    .ThenInclude(s => s.UserProfile)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            // Toggle active status instead of deleting
            product.IsActive = !product.IsActive;
            product.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            // Send real-time product status change via SignalR
            if (product.Seller?.UserProfile != null)
            {
                await _signalRService.SendProductStatusChangedAsync(
                    sellerId: product.Seller.UserProfile.Id,
                    productId: product.Id,
                    newStatus: product.IsActive ? "Active" : "Inactive",
                    productData: new
                    {
                        id = product.Id,
                        name = product.Name,
                        isActive = product.IsActive,
                        updatedAt = product.UpdatedAt
                    }
                );
            }

            return NoContent();
        }

        // PUT: api/Products/{id}/image
        [HttpPut("{id}/image")]
        public async Task<IActionResult> UpdateProductImage(int id, [FromBody] UpdateProductImageDto dto)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                    return NotFound(new { message = "Product not found" });

                string? imagePath = null;

                // If removing image
                if (string.IsNullOrEmpty(dto.ImageBase64))
                {
                    // Delete old image file if exists
                    if (!string.IsNullOrEmpty(product.ImageUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", product.ImageUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                    }
                    imagePath = null;
                }
                else
                {
                    // Parse base64 data
                    var base64Data = dto.ImageBase64;
                    if (base64Data.Contains(","))
                    {
                        base64Data = base64Data.Split(',')[1];
                    }

                    var imageBytes = Convert.FromBase64String(base64Data);

                    // Generate unique filename
                    var fileName = $"product_{id}_{Guid.NewGuid()}.jpg";
                    var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");

                    // Create directory if it doesn't exist
                    if (!Directory.Exists(folderPath))
                    {
                        Directory.CreateDirectory(folderPath);
                    }

                    var filePath = Path.Combine(folderPath, fileName);

                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(product.ImageUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", product.ImageUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                    }

                    // Save new image
                    await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

                    // Store relative path
                    imagePath = $"/images/products/{fileName}";
                }

                product.ImageUrl = imagePath;
                product.UpdatedAt = DateTime.UtcNow;

                _context.Entry(product).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Product image updated successfully",
                    imageUrl = product.ImageUrl
                });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new
                {
                    message = "Database error updating product image",
                    error = dbEx.Message,
                    innerError = dbEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating product image",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}
