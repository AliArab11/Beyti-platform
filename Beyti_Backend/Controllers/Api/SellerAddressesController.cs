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
    public class SellerAddressesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public SellerAddressesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/SellerAddresses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SellerAddress>>> GetSellerAddresses()
        {
            return await _context.SellerAddresses.ToListAsync();
        }

        // GET: api/SellerAddresses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SellerAddress>> GetSellerAddress(int id)
        {
            var sellerAddress = await _context.SellerAddresses.FindAsync(id);

            if (sellerAddress == null)
            {
                return NotFound();
            }

            return sellerAddress;
        }

        // PUT: api/SellerAddresses/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSellerAddress(int id, SellerAddress sellerAddress)
        {
            if (id != sellerAddress.Id)
            {
                return BadRequest();
            }

            _context.Entry(sellerAddress).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SellerAddressExists(id))
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

        // POST: api/SellerAddresses
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<SellerAddress>> PostSellerAddress(SellerAddress sellerAddress)
        {
            _context.SellerAddresses.Add(sellerAddress);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSellerAddress", new { id = sellerAddress.Id }, sellerAddress);
        }

        // DELETE: api/SellerAddresses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSellerAddress(int id)
        {
            var sellerAddress = await _context.SellerAddresses.FindAsync(id);
            if (sellerAddress == null)
            {
                return NotFound();
            }

            _context.SellerAddresses.Remove(sellerAddress);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SellerAddressExists(int id)
        {
            return _context.SellerAddresses.Any(e => e.Id == id);
        }
    }
}
