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

        public class CreateSellerAddressDto
        {
            public int SellerId { get; set; }
            public int AddressId { get; set; }
        }

        // GET: api/SellerAddresses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SellerAddress>>> GetSellerAddresses()
        {
            return await _context.SellerAddresses
                .Include(sa => sa.Address)
                .ToListAsync();
        }

        // GET: api/SellerAddresses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SellerAddress>> GetSellerAddress(int id)
        {
            var sellerAddress = await _context.SellerAddresses
                .Include(sa => sa.Address)
                .FirstOrDefaultAsync(sa => sa.Id == id);

            if (sellerAddress == null)
                return NotFound();

            return sellerAddress;
        }

        // POST: api/SellerAddresses
        [HttpPost]
        public async Task<ActionResult<SellerAddress>> PostSellerAddress(CreateSellerAddressDto dto)
        {
            var sellerAddress = new SellerAddress
            {
                SellerId = dto.SellerId,
                AddressId = dto.AddressId
            };

            _context.SellerAddresses.Add(sellerAddress);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetSellerAddress", new { id = sellerAddress.Id }, sellerAddress);
        }

        // PUT: api/SellerAddresses/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSellerAddress(int id, SellerAddress sellerAddress)
        {
            if (id != sellerAddress.Id)
                return BadRequest();

            _context.Entry(sellerAddress).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.SellerAddresses.Any(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/SellerAddresses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSellerAddress(int id)
        {
            var sellerAddress = await _context.SellerAddresses.FindAsync(id);
            if (sellerAddress == null)
                return NotFound();

            _context.SellerAddresses.Remove(sellerAddress);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
