using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public CustomersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            try
            {
                // HUSSAIN: Query Customers table here
                // Example: var customers = await _context.Customers.ToListAsync();

                throw new NotImplementedException("TODO: Implement GetCustomers");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving customers.", error = ex.Message });
            }
        }

        // GET: api/Customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            try
            {
                // HUSSAIN: Find customer by ID
                // Example: var customer = await _context.Customers.FindAsync(id);

                // HUSSAIN: Check if customer exists and return NotFound if it doesn't
                // if (customer == null)
                // {
                //     return NotFound(new { message = $"Customer with ID {id} not found." });
                // }

                throw new NotImplementedException("TODO: Implement GetCustomer");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the customer.", error = ex.Message });
            }
        }

        // POST: api/Customers/add
        [HttpPost("add")]
        public async Task<ActionResult<Customer>> AddCustomer([FromBody] Customer customer)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Set default values before adding to database
                // customer.CreatedAt = DateTime.Now;
                // customer.IsActive = true;
                // customer.LoyaltyPoints = 0; // or whatever default you need

                // HUSSAIN: Add customer to context and save changes
                // _context.Customers.Add(customer);
                // await _context.SaveChangesAsync();

                // HUSSAIN: Return the created customer
                // return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);

                throw new NotImplementedException("TODO: Implement AddCustomer");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the customer.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/Customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] Customer customer)
        {
            try
            {
                if (id != customer.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Find the existing customer
                // var existingCustomer = await _context.Customers.FindAsync(id);
                // if (existingCustomer == null)
                // {
                //     return NotFound(new { message = $"Customer with ID {id} not found." });
                // }

                // HUSSAIN: Update properties from the request body
                // existingCustomer.Name = customer.Name;
                // existingCustomer.Email = customer.Email;
                // existingCustomer.Phone = customer.Phone;
                // existingCustomer.IsActive = customer.IsActive;
                // Keep the original CreatedAt value - don't update it

                // HUSSAIN: Mark as modified and save
                // _context.Entry(existingCustomer).State = EntityState.Modified;
                // await _context.SaveChangesAsync();

                // return Ok(existingCustomer);

                throw new NotImplementedException("TODO: Implement UpdateCustomer");
            }
            catch (DbUpdateConcurrencyException)
            {
                // HUSSAIN: Check if customer still exists
                throw;
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the customer.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/Customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            try
            {
                // HUSSAIN: Find the customer to delete
                // var customer = await _context.Customers.FindAsync(id);
                // if (customer == null)
                // {
                //     return NotFound(new { message = $"Customer with ID {id} not found." });
                // }

                // HUSSAIN: Remove customer and save changes
                // _context.Customers.Remove(customer);
                // await _context.SaveChangesAsync();

                // return Ok(new { message = $"Customer with ID {id} has been deleted successfully." });

                throw new NotImplementedException("TODO: Implement DeleteCustomer");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the customer.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
