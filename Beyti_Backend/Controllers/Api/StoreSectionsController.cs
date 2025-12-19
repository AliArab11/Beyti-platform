using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateStoreSectionDto
    {
        public string Name { get; set; }
        public int SortOrder { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class StoreSectionsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public StoreSectionsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/StoreSections/seller/{sellerId}
        [HttpGet("seller/{sellerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSellerSections(int sellerId)
        {
            var sections = await _context.StoreSections
                .Where(s => s.SellerId == sellerId)
                .OrderBy(s => s.SortOrder)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.SortOrder,
                    s.IsActive,
                    productCount = s.Products.Count(p => p.IsActive)
                })
                .ToListAsync();

            return Ok(sections);
        }

        // POST: api/StoreSections
        [HttpPost]
        public async Task<IActionResult> CreateSection([FromBody] CreateStoreSectionDto dto, [FromQuery] int sellerId)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.Name))
                    return BadRequest(new { error = "Section name is required" });

                var section = new StoreSection
                {
                    SellerId = sellerId,
                    Name = dto.Name,
                    SortOrder = dto.SortOrder,
                    IsActive = true
                };

                _context.StoreSections.Add(section);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = section.Id,
                    name = section.Name,
                    sortOrder = section.SortOrder,
                    isActive = section.IsActive
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/StoreSections/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSection(int id, [FromBody] CreateStoreSectionDto dto)
        {
            try
            {
                var section = await _context.StoreSections.FindAsync(id);
                if (section == null)
                    return NotFound();

                section.Name = dto.Name;
                section.SortOrder = dto.SortOrder;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = section.Id,
                    name = section.Name,
                    sortOrder = section.SortOrder
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/StoreSections/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSection(int id)
        {
            try
            {
                var section = await _context.StoreSections
                    .Include(s => s.Products)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (section == null)
                    return NotFound();

                // Remove section reference from products
                foreach (var product in section.Products)
                {
                    product.StoreSectionId = null;
                }

                _context.StoreSections.Remove(section);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}