using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerFavoritesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public CustomerFavoritesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/CustomerFavorites/{customerId}
        // Get all favorite sellers for a customer
        [HttpGet("{customerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomerFavorites(int customerId)
        {
            try
            {
                var favorites = await _context.Set<CustomerFavoriteSeller>()
                    .Where(cf => cf.CustomerId == customerId)
                    .Include(cf => cf.Seller)
                        .ThenInclude(s => s.UserProfile)
                    .Include(cf => cf.Seller)
                        .ThenInclude(s => s.Category)
                    .Include(cf => cf.Seller)
                        .ThenInclude(s => s.SellerSubCategories)
                            .ThenInclude(ssc => ssc.SubCategory)
                    .Include(cf => cf.Seller)
                        .ThenInclude(s => s.SellerAddresses)
                            .ThenInclude(sa => sa.Address)
                    .OrderByDescending(cf => cf.CreatedAt)
                    .ToListAsync();

                var result = favorites.Select(cf => new
                {
                    customerId = cf.CustomerId,
                    sellerId = cf.SellerId,
                    favoritedAt = cf.CreatedAt,
                    seller = new
                    {
                        id = cf.Seller.Id,
                        storeName = cf.Seller.UserProfile.DisplayName,
                        phone = cf.Seller.Phone,
                        isOpen = cf.Seller.IsOpen,
                        storeImageUrl = cf.Seller.StoreImageUrl,
                        storeDescription = cf.Seller.StoreDescription,
                        categoryId = cf.Seller.CategoryId,
                        categoryName = cf.Seller.Category?.Name,
                        subCategoryIds = cf.Seller.SellerSubCategories.Select(ssc => ssc.SubCategoryId).ToList(),
                        subCategoryNames = cf.Seller.SellerSubCategories.Select(ssc => ssc.SubCategory.Name).ToList(),
                        sellerAddresses = cf.Seller.SellerAddresses.Select(sa => new
                        {
                            id = sa.Id,
                            address = new
                            {
                                id = sa.Address.Id,
                                street = sa.Address.Street,
                                city = sa.Address.City,
                                region = sa.Address.Region,
                                country = sa.Address.Country
                            }
                        })
                    }
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch favorites", details = ex.Message });
            }
        }

        // POST: api/CustomerFavorites
        // Add a seller to favorites
        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteDto dto)
        {
            try
            {
                // Check if already favorited
                var existing = await _context.Set<CustomerFavoriteSeller>()
                    .FirstOrDefaultAsync(cf => cf.CustomerId == dto.CustomerId && cf.SellerId == dto.SellerId);

                if (existing != null)
                {
                    return Ok(new { message = "Already in favorites", alreadyExists = true });
                }

                var favorite = new CustomerFavoriteSeller
                {
                    CustomerId = dto.CustomerId,
                    SellerId = dto.SellerId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Set<CustomerFavoriteSeller>().Add(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Added to favorites", success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add favorite", details = ex.Message });
            }
        }

        // DELETE: api/CustomerFavorites/{customerId}/{sellerId}
        // Remove a seller from favorites
        [HttpDelete("{customerId}/{sellerId}")]
        public async Task<IActionResult> RemoveFavorite(int customerId, int sellerId)
        {
            try
            {
                var favorite = await _context.Set<CustomerFavoriteSeller>()
                    .FirstOrDefaultAsync(cf => cf.CustomerId == customerId && cf.SellerId == sellerId);

                if (favorite == null)
                {
                    return NotFound(new { message = "Favorite not found" });
                }

                _context.Set<CustomerFavoriteSeller>().Remove(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Removed from favorites", success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to remove favorite", details = ex.Message });
            }
        }

        // GET: api/CustomerFavorites/check/{customerId}/{sellerId}
        // Check if a seller is favorited
        [HttpGet("check/{customerId}/{sellerId}")]
        public async Task<ActionResult<object>> CheckFavorite(int customerId, int sellerId)
        {
            try
            {
                var isFavorited = await _context.Set<CustomerFavoriteSeller>()
                    .AnyAsync(cf => cf.CustomerId == customerId && cf.SellerId == sellerId);

                return Ok(new { isFavorited });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to check favorite", details = ex.Message });
            }
        }
    }

    public class AddFavoriteDto
    {
        public int CustomerId { get; set; }
        public int SellerId { get; set; }
    }
}