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
    public class VariantValuesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public VariantValuesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/VariantValues
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VariantValue>>> GetVariantValues()
        {
            return await _context.VariantValues.ToListAsync();
        }

        // GET: api/VariantValues/colors
        [HttpGet("colors")]
        public async Task<ActionResult<IEnumerable<object>>> GetColors()
        {
            var colors = await _context.VariantValues
                .Include(v => v.VariantOption)
                .Where(v => v.VariantOption.Name == "Color")
                .Select(v => new { id = v.Id, name = v.ValueName })
                .ToListAsync();

            return Ok(colors);
        }

        // GET: api/VariantValues/sizes
        [HttpGet("sizes")]
        public async Task<ActionResult<IEnumerable<object>>> GetSizes()
        {
            var sizes = await _context.VariantValues
                .Include(v => v.VariantOption)
                .Where(v => v.VariantOption.Name == "Size")
                .Select(v => new { id = v.Id, name = v.ValueName })
                .ToListAsync();

            return Ok(sizes);
        }

        // GET: api/VariantValues/5
        [HttpGet("{id}")]
        public async Task<ActionResult<VariantValue>> GetVariantValue(int id)
        {
            var variantValue = await _context.VariantValues.FindAsync(id);

            if (variantValue == null)
            {
                return NotFound();
            }

            return variantValue;
        }

        // PUT: api/VariantValues/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVariantValue(int id, VariantValue variantValue)
        {
            if (id != variantValue.Id)
            {
                return BadRequest();
            }

            _context.Entry(variantValue).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VariantValueExists(id))
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

        // POST: api/VariantValues
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<VariantValue>> PostVariantValue(VariantValue variantValue)
        {
            _context.VariantValues.Add(variantValue);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetVariantValue", new { id = variantValue.Id }, variantValue);
        }

        // DELETE: api/VariantValues/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVariantValue(int id)
        {
            var variantValue = await _context.VariantValues.FindAsync(id);
            if (variantValue == null)
            {
                return NotFound();
            }

            _context.VariantValues.Remove(variantValue);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VariantValueExists(int id)
        {
            return _context.VariantValues.Any(e => e.Id == id);
        }
    }
}
