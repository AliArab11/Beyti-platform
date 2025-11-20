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
    public class ProductsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProductsController(BeytiContext context)
        {
            _context = context;
        }

        // Add this at the top with your other using statements
        public class CreateProductDto
        {
            public string Name { get; set; }
            public string? Description { get; set; }
            public decimal BasePrice { get; set; }
            public int SellerId { get; set; }
            public int SubCategoryId { get; set; }
            public int? GenderId { get; set; }
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
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            return product;
        }

        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.Id)
            {
                return BadRequest();
            }

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
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

            if (!_context.SubCategories.Any(sc => sc.Id == dto.SubCategoryId))
                return BadRequest("Invalid SubCategoryId");

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                BasePrice = dto.BasePrice,
                SellerId = dto.SellerId,
                SubCategoryId = dto.SubCategoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }


        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}
