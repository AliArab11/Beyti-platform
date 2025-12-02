using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateSellerDto
    {
        public string StoreName { get; set; }
        public string Phone { get; set; }
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
            return await _context.Sellers
                .Include(s => s.UserProfile)
                .Include(s => s.SellerAddresses)
                    .ThenInclude(sa => sa.Address)
                .Select(s => new
                {
                    s.Id,
                    storeName = s.UserProfile.DisplayName,
                    s.Phone,
                    s.CreatedAt,
                    sellerAddresses = s.SellerAddresses.Select(sa => new
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
                    })
                })
                .ToListAsync();
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
                    .Include(s => s.Products)
                        .ThenInclude(p => p.SubCategory)
                            .ThenInclude(sc => sc.Category)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (seller == null)
                    return NotFound(new { message = $"Seller with id {id} not found" });

                if (seller.UserProfile == null)
                    return StatusCode(500, new { message = "Seller profile data is missing" });

                return Ok(new
                {
                    id = seller.Id,
                    storeName = seller.UserProfile.DisplayName,
                    phone = seller.Phone,
                    createdAt = seller.CreatedAt,
                    addresses = seller.SellerAddresses.Select(sa => new
                    {
                        street = sa.Address.Street,
                        city = sa.Address.City,
                        region = sa.Address.Region,
                        postalCode = sa.Address.PostalCode,
                        country = sa.Address.Country
                    }).ToList(),
                    products = seller.Products.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        basePrice = p.BasePrice,
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
                        createdAt = p.CreatedAt
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

                return Ok(new
                {
                    seller.Id,
                    storeName = seller.UserProfile.DisplayName,
                    seller.Phone,
                    seller.CreatedAt
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
                var profile = new UserProfile
                {
                    DisplayName = dto.StoreName,
                    RoleType = "Seller",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.UserProfiles.Add(profile);
                await _context.SaveChangesAsync();

                var seller = new Seller
                {
                    UserProfileId = profile.Id,
                    Phone = dto.Phone,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
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
                seller.UpdatedAt = DateTime.UtcNow;
                seller.UserProfile.UpdatedAt = DateTime.UtcNow;

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
    }
}