using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class SellersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public SellersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Sellers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Seller>>> GetSellers()
        {
            try
            {
                // HUSSAIN: Query Sellers table here
                // Example: var sellers = await _context.Sellers.ToListAsync();

                throw new NotImplementedException("TODO: Implement GetSellers");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving sellers.", error = ex.Message });
            }
        }

        // GET: api/Sellers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Seller>> GetSeller(int id)
        {
            try
            {
                // HUSSAIN: Find seller by ID
                // Example: var seller = await _context.Sellers.FindAsync(id);

                // HUSSAIN: Check if seller exists and return NotFound if it doesn't
                // if (seller == null)
                // {
                //     return NotFound(new { message = $"Seller with ID {id} not found." });
                // }

                throw new NotImplementedException("TODO: Implement GetSeller");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the seller.", error = ex.Message });
            }
        }

        // POST: api/Sellers/add
        [HttpPost("add")]
        public async Task<ActionResult<Seller>> AddSeller([FromBody] Seller seller)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Set default values before adding to database
                // seller.CreatedAt = DateTime.Now;
                // seller.IsActive = true;
                // seller.IsVerified = false; // or whatever default you need

                // HUSSAIN: Add seller to context and save changes
                // _context.Sellers.Add(seller);
                // await _context.SaveChangesAsync();

                // HUSSAIN: Return the created seller
                // return CreatedAtAction(nameof(GetSeller), new { id = seller.Id }, seller);

                throw new NotImplementedException("TODO: Implement AddSeller");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the seller.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/Sellers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSeller(int id, [FromBody] Seller seller)
        {
            try
            {
                if (id != seller.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Find the existing seller
                // var existingSeller = await _context.Sellers.FindAsync(id);
                // if (existingSeller == null)
                // {
                //     return NotFound(new { message = $"Seller with ID {id} not found." });
                // }

                // HUSSAIN: Update properties from the request body
                // existingSeller.Name = seller.Name;
                // existingSeller.Email = seller.Email;
                // existingSeller.Phone = seller.Phone;
                // existingSeller.IsActive = seller.IsActive;
                // Keep the original CreatedAt value - don't update it

                // HUSSAIN: Mark as modified and save
                // _context.Entry(existingSeller).State = EntityState.Modified;
                // await _context.SaveChangesAsync();

                // return Ok(existingSeller);

                throw new NotImplementedException("TODO: Implement UpdateSeller");
            }
            catch (DbUpdateConcurrencyException)
            {
                // HUSSAIN: Check if seller still exists
                throw;
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the seller.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/Sellers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeller(int id)
        {
            try
            {
                // HUSSAIN: Find the seller to delete
                // var seller = await _context.Sellers.FindAsync(id);
                // if (seller == null)
                // {
                //     return NotFound(new { message = $"Seller with ID {id} not found." });
                // }

                // HUSSAIN: Remove seller and save changes
                // _context.Sellers.Remove(seller);
                // await _context.SaveChangesAsync();

                // return Ok(new { message = $"Seller with ID {id} has been deleted successfully." });

                throw new NotImplementedException("TODO: Implement DeleteSeller");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the seller.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
