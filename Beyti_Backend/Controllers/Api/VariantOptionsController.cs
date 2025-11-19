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
    public class VariantOptionsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public VariantOptionsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/VariantOptions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VariantOption>>> GetVariantOptions()
        {
            return await _context.VariantOptions.ToListAsync();
        }

        // GET: api/VariantOptions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<VariantOption>> GetVariantOption(int id)
        {
            var variantOption = await _context.VariantOptions.FindAsync(id);

            if (variantOption == null)
            {
                return NotFound();
            }

            return variantOption;
        }

        // PUT: api/VariantOptions/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVariantOption(int id, VariantOption variantOption)
        {
            if (id != variantOption.Id)
            {
                return BadRequest();
            }

            _context.Entry(variantOption).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VariantOptionExists(id))
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

        // POST: api/VariantOptions
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<VariantOption>> PostVariantOption(VariantOption variantOption)
        {
            _context.VariantOptions.Add(variantOption);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetVariantOption", new { id = variantOption.Id }, variantOption);
        }

        // DELETE: api/VariantOptions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVariantOption(int id)
        {
            var variantOption = await _context.VariantOptions.FindAsync(id);
            if (variantOption == null)
            {
                return NotFound();
            }

            _context.VariantOptions.Remove(variantOption);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VariantOptionExists(int id)
        {
            return _context.VariantOptions.Any(e => e.Id == id);
        }
    }
}
