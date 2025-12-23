using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateSellerDto
    {
        public string StoreName { get; set; }
        public string Phone { get; set; }
        public string? UserId { get; set; }  // For onboarding flow
    }
    public class UpdateStoreImageDto
    {
        public string? ImageBase64 { get; set; }
    }

    public class UpdateStoreDescriptionDto
    {
        public string? Description { get; set; }
    }

    public class UpdateBannerDto
    {
        public string? BannerThemeKey { get; set; }
        public string? BannerAccentColor { get; set; }
    }


    [Route("api/[controller]")]
    [ApiController]
    public class SellersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public SellersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Sellers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetSellers()
        {
            var sellers = await _context.Sellers
            .Include(s => s.UserProfile)
            .Include(s => s.SellerAddresses)
             .ThenInclude(sa => sa.Address)
            .Include(s => s.Products)
            .Include(s => s.Category)  // ← ADD THIS LINE - loads Category
            .Include(s => s.SellerSubCategories)  // ← Already there
             .ThenInclude(ssc => ssc.SubCategory)  // ← ADD THIS LINE - loads SubCategory names
            .ToListAsync();

            var result = new List<object>();

            foreach (var seller in sellers)
            {
                // Calculate average rating from all reviews of seller's products
                var allReviews = await _context.Reviews
                    .Where(r => r.Product.SellerId == seller.Id && !r.IsCommentHiddenBySeller)
                    .ToListAsync();

                decimal? averageRating = null;
                if (allReviews.Any())
                {
                    averageRating = Math.Round((decimal)allReviews.Average(r => r.Rating), 1);
                }


                result.Add(new
                {
                    seller.Id,
                    userProfileId = seller.UserProfileId,
                    storeName = seller.UserProfile.DisplayName,
                    seller.Phone,
                    seller.CreatedAt,
                    averageRating,
                    categoryId = seller.CategoryId,
                    categoryName = seller.Category?.Name,
                    isOpen = seller.IsOpen,
                    storeImageUrl = seller.StoreImageUrl,
                    storeDescription = seller.StoreDescription,
                    bannerThemeKey = seller.BannerThemeKey,   
                    bannerAccentColor = seller.BannerAccentColor,
                    subCategoryIds = seller.SellerSubCategories.Select(ssc => ssc.SubCategoryId).ToList(),
                    subCategoryNames = seller.SellerSubCategories

                    .Select(ssc => ssc.SubCategory.Name)
                    .ToList(),
                    sellerAddresses = seller.SellerAddresses.Select(sa => new
                    {
                        sa.Id,
                        address = new
                        {
                            sa.Address.Id,
                            sa.Address.Label,
                            sa.Address.Street,
                            sa.Address.City,
                            sa.Address.Region,
                            sa.Address.PostalCode,
                            sa.Address.Country,
                            sa.Address.Latitude,
                            sa.Address.Longitude
                        }
                    }),
                    products = seller.Products.Select(p => new // ← NEW: Include products for review count
                    {
                        p.Id,
                        p.Name
                    })
                });
            }

            // Save any auto-cleared force open flags
            if (_context.ChangeTracker.HasChanges())
            {
                await _context.SaveChangesAsync();
            }

            return result;
        }

        // GET: api/Sellers/Profile/{userProfileId} - Get seller by UserProfileId
        [HttpGet("Profile/{userProfileId}")]
        public async Task<ActionResult<object>> GetSellerByUserProfileId(int userProfileId)
        {
            try
            {
                var seller = await _context.Sellers
                    .Include(s => s.UserProfile)
                    .Include(s => s.SellerAddresses)
                        .ThenInclude(sa => sa.Address)
                    .Include(s => s.SellerSubCategories)
                    .FirstOrDefaultAsync(s => s.UserProfileId == userProfileId);

                if (seller == null)
                    return NotFound("Seller not found");

               

                // Get primary address if available
                var primaryAddress = seller.SellerAddresses
                    .Select(sa => sa.Address)
                    .FirstOrDefault();


                return Ok(new
                {
                    SellerId = seller.Id,
                    Id = seller.Id,
                    UserProfileId = seller.UserProfileId,
                    StoreName = seller.UserProfile.DisplayName,
                    Phone = seller.Phone,
                    CreatedAt = seller.CreatedAt,
                    DisplayName = seller.UserProfile.DisplayName,
                    RoleType = seller.UserProfile.RoleType,
                    AccountStatus = seller.UserProfile.Status,  // Add account status for suspension check
                    CategoryId = seller.CategoryId,
                    BannerThemeKey = seller.BannerThemeKey,
                    BannerAccentColor = seller.BannerAccentColor,
                    SubCategoryIds = seller.SellerSubCategories.Select(ssc => ssc.SubCategoryId).ToList(),
                    isOpen = seller.IsOpen,
                    StoreImageUrl = seller.StoreImageUrl,  // ← ADD THIS LINE
                    StoreDescription = seller.StoreDescription,
                    Address = primaryAddress != null ? new
                    {
                        Street = primaryAddress.Street,
                        City = primaryAddress.City,
                        Region = primaryAddress.Region,
                        PostalCode = primaryAddress.PostalCode,
                        Country = primaryAddress.Country
                    } : null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching seller profile",
                    error = ex.Message
                });
            }
        }

        // GET: api/Sellers/{id}/products - THIS MUST COME BEFORE GetSeller
        [HttpGet("{id}/products")]
        public async Task<ActionResult<object>> GetSellerWithProducts(int id)
        {
            try
            {
                var seller = await _context.Sellers
                .Include(s => s.UserProfile)
                .Include(s => s.SellerAddresses)
                    .ThenInclude(sa => sa.Address)
                    .Include(s => s.StoreSections)
                .Include(s => s.Products)
                    .ThenInclude(p => p.SubCategory)
                        .ThenInclude(sc => sc.Category)
                .Include(s => s.Products)
                    .ThenInclude(p => p.Reviews)
                .Include(s => s.SellerSubCategories)  // ← ADD THIS LINE
                    .ThenInclude(ssc => ssc.SubCategory)  // ← ADD THIS LINE
                .FirstOrDefaultAsync(s => s.Id == id);

                if (seller == null)
                    return NotFound(new { message = $"Seller with id {id} not found" });

                if (seller.UserProfile == null)
                    return StatusCode(500, new { message = "Seller profile data is missing" });

                

                // ← NEW: Calculate average rating
                var allReviews = await _context.Reviews
                    .Where(r => r.Product.SellerId == id && !r.IsCommentHiddenBySeller)
                    .ToListAsync();

                decimal? averageRating = null;
                if (allReviews.Any())
                {
                    averageRating = Math.Round((decimal)allReviews.Average(r => r.Rating), 1);
                }

                // Calculate system sections
                var now = DateTime.UtcNow;
                var thirtyDaysAgo = now.AddDays(-30);

                // Get orders from last 30 days for this seller
                var recentOrders = await _context.Orders
                    .Where(o => o.SellerId == id &&
                                o.CreatedAt >= thirtyDaysAgo &&
                                (o.Status == "completed" || o.Status == "delivered"))
                    .Include(o => o.OrderItems)
                    .ToListAsync();

                // Calculate product popularity (only if 5+ orders)
                List<object> mostPopularProducts = new List<object>();
                if (recentOrders.Count >= 5)
                {
                    // First, load order items with their variants and products
                    var orderItemsWithProducts = await _context.OrderItems
                        .Where(oi => recentOrders.Select(o => o.Id).Contains(oi.OrderId))
                        .Include(oi => oi.ProductVariant)
                            .ThenInclude(pv => pv.Product)
                        .ToListAsync();

                    var productSales = orderItemsWithProducts
                        .GroupBy(oi => oi.ProductVariant.ProductId)
                        .Select(g => new
                        {
                            ProductId = g.Key,
                            TotalQuantity = g.Sum(oi => oi.Qty)  // ✅ Also fixed: Qty not Quantity
                        })
                        .OrderByDescending(x => x.TotalQuantity)
                        .Take(3)
                        .Select(x => x.ProductId)
                        .ToList();

                    var popularProducts = seller.Products
                        .Where(p => p.IsActive && productSales.Contains(p.Id))
                        .ToList();

                    foreach (var productId in productSales)
                    {
                        var p = popularProducts.FirstOrDefault(x => x.Id == productId);
                        if (p != null)
                        {
                            var productReviews = p.Reviews.Where(r => !r.IsCommentHiddenBySeller).ToList();
                            decimal? productAverageRating = null;

                            if (productReviews.Count >= 5)
                            {
                                productAverageRating = Math.Round((decimal)productReviews.Average(r => r.Rating), 1);
                            }

                            mostPopularProducts.Add(new
                            {
                                id = p.Id,
                                name = p.Name,
                                description = p.Description,
                                imageUrl = p.ImageUrl,
                                basePrice = p.BasePrice,
                                discountPercentage = p.DiscountPercentage,
                                isActive = p.IsActive,
                                storeSectionId = p.StoreSectionId,
                                averageRating = productAverageRating,
                                reviewCount = productReviews.Count,
                                subCategory = p.SubCategory != null ? new
                                {
                                    id = p.SubCategory.Id,
                                    name = p.SubCategory.Name,
                                    category = p.SubCategory.Category != null ? new
                                    {
                                        id = p.SubCategory.Category.Id,
                                        name = p.SubCategory.Category.Name
                                    } : null
                                } : null,
                                createdAt = p.CreatedAt,
                                reviews = productReviews.Select(r => new
                                {
                                    r.Id,
                                    r.Rating,
                                    r.Comment,
                                    r.CreatedAt,
                                    r.IsCommentHiddenBySeller
                                }).ToList()
                            });
                        }
                    }
                }

                // Get discounted products
                var discountedProducts = seller.Products
                    .Where(p => p.IsActive && p.DiscountPercentage.HasValue && p.DiscountPercentage > 0)
                    .Select(p => {
                        var productReviews = p.Reviews.Where(r => !r.IsCommentHiddenBySeller).ToList();
                        decimal? productAverageRating = null;

                        if (productReviews.Count >= 5)
                        {
                            productAverageRating = Math.Round((decimal)productReviews.Average(r => r.Rating), 1);
                        }

                        return new
                        {
                            id = p.Id,
                            name = p.Name,
                            description = p.Description,
                            imageUrl = p.ImageUrl,
                            basePrice = p.BasePrice,
                            discountPercentage = p.DiscountPercentage,
                            isActive = p.IsActive,
                            storeSectionId = p.StoreSectionId,
                            averageRating = productAverageRating,
                            reviewCount = productReviews.Count,
                            subCategory = p.SubCategory != null ? new
                            {
                                id = p.SubCategory.Id,
                                name = p.SubCategory.Name,
                                category = p.SubCategory.Category != null ? new
                                {
                                    id = p.SubCategory.Category.Id,
                                    name = p.SubCategory.Category.Name
                                } : null
                            } : null,
                            createdAt = p.CreatedAt,
                            reviews = productReviews.Select(r => new
                            {
                                r.Id,
                                r.Rating,
                                r.Comment,
                                r.CreatedAt,
                                r.IsCommentHiddenBySeller
                            }).ToList()
                        };
                    }).ToList();

                return Ok(new
                {
                    id = seller.Id,
                    storeName = seller.UserProfile.DisplayName,
                    phone = seller.Phone,
                    createdAt = seller.CreatedAt,
                    isOpen = seller.IsOpen,
                    averageRating = averageRating,
                    storeImageUrl = seller.StoreImageUrl,
                    storeDescription = seller.StoreDescription,
                    bannerThemeKey = seller.BannerThemeKey,      
                    bannerAccentColor = seller.BannerAccentColor,
                    subCategoryIds = seller.SellerSubCategories.Select(ssc => ssc.SubCategoryId).ToList(),
                    subCategoryNames = seller.SellerSubCategories.Select(ssc => ssc.SubCategory.Name).ToList(),
                    storeSections = seller.StoreSections
                        .OrderBy(ss => ss.SortOrder)
                        .Select(ss => new
                        {
                            ss.Id,
                            ss.Name,
                            ss.SortOrder,
                            ss.IsActive
                        }).ToList(),
                    systemSections = new
                    {
                        discounts = discountedProducts.Count > 0 ? new
                        {
                            id = "system-discounts",
                            name = "Discounts",
                            isSystemSection = true,
                            isActive = true,
                            sortOrder = -2,  // Will appear first
                            products = discountedProducts
                        } : null,
                        mostPopular = (recentOrders.Count >= 5 && mostPopularProducts.Count > 0) ? new
                        {
                            id = "system-popular",
                            name = "Most Popular",
                            isSystemSection = true,
                            isActive = true,
                            sortOrder = -1,  // Will appear second
                            products = mostPopularProducts
                        } : null
                    },
                    sellerAddresses = seller.SellerAddresses.Select(sa => new
                    {
                        id = sa.Id,
                        addressId = sa.AddressId,
                        address = new
                        {
                            id = sa.Address.Id,
                            street = sa.Address.Street,
                            city = sa.Address.City,
                            region = sa.Address.Region,
                            postalCode = sa.Address.PostalCode,
                            country = sa.Address.Country,
                            latitude = sa.Address.Latitude,
                            longitude = sa.Address.Longitude
                        }
                    }).ToList(),
                    products = seller.Products
                        .Where(p => p.IsActive)
                        .Select(p => {
                            var productReviews = p.Reviews.Where(r => !r.IsCommentHiddenBySeller).ToList();
                            decimal? productAverageRating = null;

                            if (productReviews.Count >= 5)
                            {
                                productAverageRating = Math.Round((decimal)productReviews.Average(r => r.Rating), 1);
                            }

                            return new
                            {
                                id = p.Id,
                                name = p.Name,
                                description = p.Description,
                                imageUrl = p.ImageUrl,
                                basePrice = p.BasePrice,
                                discountPercentage = p.DiscountPercentage,
                                isActive = p.IsActive,
                                storeSectionId = p.StoreSectionId,
                                averageRating = productAverageRating,
                                reviewCount = productReviews.Count,
                                subCategory = p.SubCategory != null ? new
                                {
                                    id = p.SubCategory.Id,
                                    name = p.SubCategory.Name,
                                    category = p.SubCategory.Category != null ? new
                                    {
                                        id = p.SubCategory.Category.Id,
                                        name = p.SubCategory.Category.Name
                                    } : null
                                } : null,
                                createdAt = p.CreatedAt,
                                reviews = productReviews.Select(r => new
                                {
                                    r.Id,
                                    r.Rating,
                                    r.Comment,
                                    r.CreatedAt,
                                    r.IsCommentHiddenBySeller
                                }).ToList()
                            };
                        }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching seller with products",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // GET: api/Sellers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetSeller(int id)
        {
            try
            {
                var seller = await _context.Sellers
                    .Include(s => s.UserProfile)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (seller == null)
                    return NotFound();

                if (seller.UserProfile == null)
                    return StatusCode(500, new { message = "Seller profile data is missing" });

                // ← NEW: Calculate average rating
                var allReviews = await _context.Reviews
                    .Where(r => r.Product.SellerId == id && !r.IsCommentHiddenBySeller)
                    .ToListAsync();

                decimal? averageRating = null;
                if (allReviews.Any())
                {
                    averageRating = Math.Round((decimal)allReviews.Average(r => r.Rating), 1);
                }

                return Ok(new
                {
                    seller.Id,
                    storeName = seller.UserProfile.DisplayName,
                    seller.Phone,
                    seller.CreatedAt,
                    seller.CategoryId,  // Add this line
                    averageRating
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error fetching seller",
                    error = ex.Message
                });
            }
        }

        // POST: api/Sellers
        [HttpPost]
        public async Task<IActionResult> PostSeller(CreateSellerDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.StoreName))
                    return BadRequest(new { error = "StoreName is required" });

                if (string.IsNullOrEmpty(dto.Phone))
                    return BadRequest(new { error = "Phone is required" });

                UserProfile profile;

                // Check if onboarding (userId provided) or admin creation
                if (!string.IsNullOrEmpty(dto.UserId))
                {
                    // ONBOARDING FLOW: Update existing UserProfile
                    profile = await _context.UserProfiles
                        .FirstOrDefaultAsync(up => up.IdentityUserId == dto.UserId);

                    if (profile == null)
                        return BadRequest(new { error = "User profile not found" });

                    profile.RoleType = "Seller";
                    profile.DisplayName = dto.StoreName;
                    profile.UpdatedAt = DateTime.Now;

                    // Delete orphaned Customer record if exists
                    var existingCustomer = await _context.Customers
                        .FirstOrDefaultAsync(c => c.UserProfileId == profile.Id);
                    if (existingCustomer != null)
                    {
                        _context.Customers.Remove(existingCustomer);
                    }

                    await _context.SaveChangesAsync();
                }
                else
                {
                    // ADMIN CREATION: Create new UserProfile
                    profile = new UserProfile
                    {
                        DisplayName = dto.StoreName,
                        RoleType = "Seller",
                        Status = "Active",
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    _context.UserProfiles.Add(profile);
                    await _context.SaveChangesAsync();
                }

                var seller = new Seller
                {
                    UserProfileId = profile.Id,
                    Phone = dto.Phone,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Sellers.Add(seller);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = seller.Id,
                    storeName = profile.DisplayName,
                    phone = seller.Phone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/Sellers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSeller(int id, CreateSellerDto dto)
        {
            try
            {
                var seller = await _context.Sellers
                    .Include(s => s.UserProfile)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (seller == null)
                    return NotFound();

                if (seller.UserProfile == null)
                    return StatusCode(500, new { message = "Seller profile data is missing" });

                seller.UserProfile.DisplayName = dto.StoreName;
                seller.Phone = dto.Phone;
                seller.UpdatedAt = DateTime.Now;
                seller.UserProfile.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = seller.Id,
                    storeName = seller.UserProfile.DisplayName,
                    phone = seller.Phone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating seller",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Sellers/{id}/subcategories
        [HttpPut("{id}/subcategories")]
        public async Task<IActionResult> UpdateSellerSubCategories(int id, [FromBody] List<int> subCategoryIds)
        {
            try
            {
                var seller = await _context.Sellers
                    .Include(s => s.SellerSubCategories)
                    .Include(s => s.Category)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (seller == null)
                    return NotFound(new { message = "Seller not found" });

                // Validate max 3 subcategories
                if (subCategoryIds.Count > 3)
                    return BadRequest(new { message = "Maximum 3 subcategories allowed" });

                // Validate all subcategories belong to seller's main category
                var validSubCategories = await _context.SubCategories
                    .Where(sc => subCategoryIds.Contains(sc.Id) && sc.CategoryId == seller.CategoryId)
                    .ToListAsync();

                if (validSubCategories.Count != subCategoryIds.Count)
                    return BadRequest(new { message = "All subcategories must belong to the seller's main category" });

                // Remove existing subcategories
                _context.SellerSubCategories.RemoveRange(seller.SellerSubCategories);

                // Add new subcategories
                foreach (var subCategoryId in subCategoryIds)
                {
                    seller.SellerSubCategories.Add(new SellerSubCategory
                    {
                        SellerId = id,
                        SubCategoryId = subCategoryId
                    });
                }

                seller.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Subcategories updated successfully", subCategoryIds });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating subcategories",
                    error = ex.Message
                });
            }
        }



        // PUT: api/Sellers/{id}/toggle-store-status
        [HttpPut("{id}/toggle-store-status")]
        public async Task<IActionResult> ToggleStoreStatus(int id)
        {
            try
            {
                var seller = await _context.Sellers.FindAsync(id);
                if (seller == null)
                    return NotFound(new { message = "Seller not found" });

                // Simple toggle
                seller.IsOpen = !seller.IsOpen;
                seller.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = seller.IsOpen ? "Store opened" : "Store closed",
                    isOpen = seller.IsOpen
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error toggling store status",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Sellers/{id}/store-image
        [HttpPut("{id}/store-image")]
        public async Task<IActionResult> UpdateStoreImage(int id, [FromBody] UpdateStoreImageDto dto)
        {
            try
            {
                var seller = await _context.Sellers.FindAsync(id);
                if (seller == null)
                    return NotFound(new { message = "Seller not found" });

                string? imagePath = null;

                // If removing image
                if (string.IsNullOrEmpty(dto.ImageBase64))
                {
                    // Delete old image file if exists
                    if (!string.IsNullOrEmpty(seller.StoreImageUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", seller.StoreImageUrl.TrimStart('/'));
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
                    var fileName = $"store_{id}_{Guid.NewGuid()}.jpg";
                    var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "stores");

                    // Create directory if it doesn't exist
                    if (!Directory.Exists(folderPath))
                    {
                        Directory.CreateDirectory(folderPath);
                    }

                    var filePath = Path.Combine(folderPath, fileName);

                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(seller.StoreImageUrl))
                    {
                        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", seller.StoreImageUrl.TrimStart('/'));
                        if (System.IO.File.Exists(oldFilePath))
                        {
                            System.IO.File.Delete(oldFilePath);
                        }
                    }

                    // Save new image
                    await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

                    // Store relative path
                    imagePath = $"/images/stores/{fileName}";
                }

                seller.StoreImageUrl = imagePath;
                seller.UpdatedAt = DateTime.UtcNow;

                _context.Entry(seller).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Store image updated successfully",
                    storeImageUrl = seller.StoreImageUrl
                });
            }
            catch (DbUpdateException dbEx)
            {
                return StatusCode(500, new
                {
                    message = "Database error updating store image",
                    error = dbEx.Message,
                    innerError = dbEx.InnerException?.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating store image",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // DELETE: api/Sellers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeller(int id)
        {
            try
            {
                var seller = await _context.Sellers.FindAsync(id);
                if (seller == null)
                    return NotFound();

                _context.Sellers.Remove(seller);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error deleting seller",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Sellers/{id}/store-description
        [HttpPut("{id}/store-description")]
        public async Task<IActionResult> UpdateStoreDescription(int id, [FromBody] UpdateStoreDescriptionDto dto)
        {
            try
            {
                var seller = await _context.Sellers.FindAsync(id);
                if (seller == null)
                    return NotFound(new { message = "Seller not found" });

                seller.StoreDescription = dto.Description;
                seller.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Store description updated successfully",
                    storeDescription = seller.StoreDescription
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating store description",
                    error = ex.Message
                });
            }
        }

        // PUT: api/Sellers/{id}/banner
        [HttpPut("{id}/banner")]
        public async Task<IActionResult> UpdateBanner(int id, [FromBody] UpdateBannerDto dto)
        {
            try
            {
                var seller = await _context.Sellers.FindAsync(id);
                if (seller == null)
                    return NotFound(new { message = "Seller not found" });

                seller.BannerThemeKey = dto.BannerThemeKey;
                seller.BannerAccentColor = dto.BannerAccentColor;
                seller.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Banner updated successfully",
                    bannerThemeKey = seller.BannerThemeKey,
                    bannerAccentColor = seller.BannerAccentColor
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error updating banner",
                    error = ex.Message
                });
            }
        }
    }
}