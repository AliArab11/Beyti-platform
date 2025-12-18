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
    public class ProductVariantsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProductVariantsController(BeytiContext context)
        {
            _context = context;
        }

        // DTO for creating/updating variants
        public class CreateProductVariantDto
        {
            public int ProductId { get; set; }
            public string? ColorValue { get; set; }
            public string? SizeValue { get; set; }
            public string? SKU { get; set; }
            public decimal? Price { get; set; }
            public int StockQty { get; set; }
        }

        // Response DTO
        public class ProductVariantResponse
        {
            public int Id { get; set; }
            public int ProductId { get; set; }
            public int? ColorValueId { get; set; }
            public int? SizeValueId { get; set; }
            public string? ColorValue { get; set; }
            public string? SizeValue { get; set; }
            public string? SKU { get; set; }
            public decimal? Price { get; set; }
            public int StockQty { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime UpdatedAt { get; set; }
        }

        // GET: api/ProductVariants
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductVariantResponse>>> GetProductVariants([FromQuery] int? productId)
        {
            var query = _context.ProductVariants.AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(pv => pv.ProductId == productId.Value);
            }

            var variants = await query.ToListAsync();
            var response = new List<ProductVariantResponse>();

            foreach (var v in variants)
            {
                var item = new ProductVariantResponse
                {
                    Id = v.Id,
                    ProductId = v.ProductId,
                    ColorValueId = v.ColorValueId,
                    SizeValueId = v.SizeValueId,
                    SKU = v.SKU,
                    Price = v.Price,
                    StockQty = v.StockQty,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt
                };

                if (v.ColorValueId.HasValue)
                {
                    var color = await _context.VariantValues.FindAsync(v.ColorValueId.Value);
                    item.ColorValue = color?.ValueName;
                }

                if (v.SizeValueId.HasValue)
                {
                    var size = await _context.VariantValues.FindAsync(v.SizeValueId.Value);
                    item.SizeValue = size?.ValueName;
                }

                response.Add(item);
            }

            return Ok(response);
        }

        // GET: api/ProductVariants/colors
        [HttpGet("colors")]
        public async Task<ActionResult<IEnumerable<object>>> GetColors()
        {
            var colors = await _context.VariantValues
                .Where(v => v.VariantOptionId == 1)
                .Select(v => new { id = v.Id, name = v.ValueName })
                .ToListAsync();

            if (!colors.Any())
            {
                return Ok(new[]
                {
                    new { id = 1, name = "Red" },
                    new { id = 2, name = "Blue" },
                    new { id = 3, name = "Black" },
                    new { id = 4, name = "White" }
                });
            }

            return Ok(colors);
        }

        // GET: api/ProductVariants/sizes
        [HttpGet("sizes")]
        public async Task<ActionResult<IEnumerable<object>>> GetSizes()
        {
            var sizes = await _context.VariantValues
                .Where(v => v.VariantOptionId == 2)
                .Select(v => new { id = v.Id, name = v.ValueName })
                .ToListAsync();

            if (!sizes.Any())
            {
                return Ok(new[]
                {
                    new { id = 1, name = "S" },
                    new { id = 2, name = "M" },
                    new { id = 3, name = "L" },
                    new { id = 4, name = "XL" }
                });
            }

            return Ok(sizes);
        }

        // GET: api/ProductVariants/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductVariantResponse>> GetProductVariant(int id)
        {
            var v = await _context.ProductVariants.FindAsync(id);
            if (v == null)
            {
                return NotFound();
            }

            var response = new ProductVariantResponse
            {
                Id = v.Id,
                ProductId = v.ProductId,
                ColorValueId = v.ColorValueId,
                SizeValueId = v.SizeValueId,
                SKU = v.SKU,
                Price = v.Price,
                StockQty = v.StockQty,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            };

            if (v.ColorValueId.HasValue)
            {
                var color = await _context.VariantValues.FindAsync(v.ColorValueId.Value);
                response.ColorValue = color?.ValueName;
            }

            if (v.SizeValueId.HasValue)
            {
                var size = await _context.VariantValues.FindAsync(v.SizeValueId.Value);
                response.SizeValue = size?.ValueName;
            }

            return Ok(response);
        }

        // POST: api/ProductVariants
        [HttpPost]
        public async Task<ActionResult<ProductVariantResponse>> PostProductVariant([FromBody] CreateProductVariantDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _context.Products.AnyAsync(p => p.Id == dto.ProductId))
                return BadRequest("Invalid ProductId");

            int? colorValueId = null;
            if (!string.IsNullOrWhiteSpace(dto.ColorValue))
            {
                // Find or create the Color option
                var colorOption = await _context.VariantOptions.FirstOrDefaultAsync(vo => vo.Name == "Color");
                if (colorOption == null)
                {
                    colorOption = new VariantOption { Name = "Color" };
                    _context.VariantOptions.Add(colorOption);
                    await _context.SaveChangesAsync();
                }

                var colorValue = await _context.VariantValues
                    .FirstOrDefaultAsync(v => v.ValueName.ToLower() == dto.ColorValue.Trim().ToLower() && v.VariantOptionId == colorOption.Id);

                if (colorValue == null)
                {
                    colorValue = new VariantValue
                    {
                        ValueName = dto.ColorValue.Trim(),
                        VariantOptionId = colorOption.Id
                    };
                    _context.VariantValues.Add(colorValue);
                    await _context.SaveChangesAsync();
                }
                colorValueId = colorValue.Id;
            }

            int? sizeValueId = null;
            if (!string.IsNullOrWhiteSpace(dto.SizeValue))
            {
                // Find or create the Size option
                var sizeOption = await _context.VariantOptions.FirstOrDefaultAsync(vo => vo.Name == "Size");
                if (sizeOption == null)
                {
                    sizeOption = new VariantOption { Name = "Size" };
                    _context.VariantOptions.Add(sizeOption);
                    await _context.SaveChangesAsync();
                }

                var sizeValue = await _context.VariantValues
                    .FirstOrDefaultAsync(v => v.ValueName.ToLower() == dto.SizeValue.Trim().ToLower() && v.VariantOptionId == sizeOption.Id);

                if (sizeValue == null)
                {
                    sizeValue = new VariantValue
                    {
                        ValueName = dto.SizeValue.Trim(),
                        VariantOptionId = sizeOption.Id
                    };
                    _context.VariantValues.Add(sizeValue);
                    await _context.SaveChangesAsync();
                }
                sizeValueId = sizeValue.Id;
            }

            var productVariant = new ProductVariant
            {
                ProductId = dto.ProductId,
                ColorValueId = colorValueId,
                SizeValueId = sizeValueId,
                SKU = dto.SKU,
                Price = dto.Price,
                StockQty = dto.StockQty,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.ProductVariants.Add(productVariant);
            await _context.SaveChangesAsync();

            var response = new ProductVariantResponse
            {
                Id = productVariant.Id,
                ProductId = productVariant.ProductId,
                ColorValueId = productVariant.ColorValueId,
                SizeValueId = productVariant.SizeValueId,
                ColorValue = dto.ColorValue,
                SizeValue = dto.SizeValue,
                SKU = productVariant.SKU,
                Price = productVariant.Price,
                StockQty = productVariant.StockQty,
                CreatedAt = productVariant.CreatedAt,
                UpdatedAt = productVariant.UpdatedAt
            };

            return CreatedAtAction("GetProductVariant", new { id = productVariant.Id }, response);
        }

        // PUT: api/ProductVariants/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProductVariant(int id, [FromBody] CreateProductVariantDto dto)
        {
            var productVariant = await _context.ProductVariants.FindAsync(id);
            if (productVariant == null)
            {
                return NotFound();
            }

            int? colorValueId = null;
            if (!string.IsNullOrWhiteSpace(dto.ColorValue))
            {
                var colorOption = await _context.VariantOptions.FirstOrDefaultAsync(vo => vo.Name == "Color");
                if (colorOption == null)
                {
                    colorOption = new VariantOption { Name = "Color" };
                    _context.VariantOptions.Add(colorOption);
                    await _context.SaveChangesAsync();
                }

                var colorValue = await _context.VariantValues
                    .FirstOrDefaultAsync(v => v.ValueName.ToLower() == dto.ColorValue.Trim().ToLower() && v.VariantOptionId == colorOption.Id);

                if (colorValue == null)
                {
                    colorValue = new VariantValue
                    {
                        ValueName = dto.ColorValue.Trim(),
                        VariantOptionId = colorOption.Id
                    };
                    _context.VariantValues.Add(colorValue);
                    await _context.SaveChangesAsync();
                }
                colorValueId = colorValue.Id;
            }

            int? sizeValueId = null;
            if (!string.IsNullOrWhiteSpace(dto.SizeValue))
            {
                var sizeOption = await _context.VariantOptions.FirstOrDefaultAsync(vo => vo.Name == "Size");
                if (sizeOption == null)
                {
                    sizeOption = new VariantOption { Name = "Size" };
                    _context.VariantOptions.Add(sizeOption);
                    await _context.SaveChangesAsync();
                }

                var sizeValue = await _context.VariantValues
                    .FirstOrDefaultAsync(v => v.ValueName.ToLower() == dto.SizeValue.Trim().ToLower() && v.VariantOptionId == sizeOption.Id);

                if (sizeValue == null)
                {
                    sizeValue = new VariantValue
                    {
                        ValueName = dto.SizeValue.Trim(),
                        VariantOptionId = sizeOption.Id
                    };
                    _context.VariantValues.Add(sizeValue);
                    await _context.SaveChangesAsync();
                }
                sizeValueId = sizeValue.Id;
            }

            productVariant.ColorValueId = colorValueId;
            productVariant.SizeValueId = sizeValueId;
            productVariant.SKU = dto.SKU;
            productVariant.Price = dto.Price;
            productVariant.StockQty = dto.StockQty;
            productVariant.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/ProductVariants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductVariant(int id)
        {
            var productVariant = await _context.ProductVariants.FindAsync(id);
            if (productVariant == null)
            {
                return NotFound();
            }

            _context.ProductVariants.Remove(productVariant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductVariantExists(int id)
        {
            return _context.ProductVariants.Any(e => e.Id == id);
        }
    }
}