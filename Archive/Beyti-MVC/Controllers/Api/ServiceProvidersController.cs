using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiceProvidersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceProvidersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceProviders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Beyti.Data.ServiceProvider>>> GetServiceProviders()
        {
            try
            {
                // MOHAMMED: Query ServiceProviders table here
                // Example: var serviceProviders = await _context.ServiceProviders.ToListAsync();

                throw new NotImplementedException("TODO: Implement GetServiceProviders");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving service providers.", error = ex.Message });
            }
        }

        // GET: api/ServiceProviders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Beyti.Data.ServiceProvider>> GetServiceProvider(int id)
        {
            try
            {
                // MOHAMMED: Find service provider by ID
                // Example: var serviceProvider = await _context.ServiceProviders.FindAsync(id);

                // MOHAMMED: Check if service provider exists and return NotFound if it doesn't
                // if (serviceProvider == null)
                // {
                //     return NotFound(new { message = $"Service provider with ID {id} not found." });
                // }

                throw new NotImplementedException("TODO: Implement GetServiceProvider");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the service provider.", error = ex.Message });
            }
        }

        // POST: api/ServiceProviders/add
        [HttpPost("add")]
        public async Task<ActionResult<Beyti.Data.ServiceProvider>> AddServiceProvider([FromBody] Beyti.Data.ServiceProvider serviceProvider)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // MOHAMMED: Set default values before adding to database
                // serviceProvider.CreatedAt = DateTime.Now;
                // serviceProvider.IsActive = true;
                // serviceProvider.IsVerified = false; // or whatever default you need

                // MOHAMMED: Add service provider to context and save changes
                // _context.ServiceProviders.Add(serviceProvider);
                // await _context.SaveChangesAsync();

                // MOHAMMED: Return the created service provider
                // return CreatedAtAction(nameof(GetServiceProvider), new { id = serviceProvider.Id }, serviceProvider);

                throw new NotImplementedException("TODO: Implement AddServiceProvider");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the service provider.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/ServiceProviders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServiceProvider(int id, [FromBody] Beyti.Data.ServiceProvider serviceProvider)
        {
            try
            {
                if (id != serviceProvider.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // MOHAMMED: Find the existing service provider
                // var existingServiceProvider = await _context.ServiceProviders.FindAsync(id);
                // if (existingServiceProvider == null)
                // {
                //     return NotFound(new { message = $"Service provider with ID {id} not found." });
                // }

                // MOHAMMED: Update properties from the request body
                // existingServiceProvider.Name = serviceProvider.Name;
                // existingServiceProvider.Email = serviceProvider.Email;
                // existingServiceProvider.Phone = serviceProvider.Phone;
                // existingServiceProvider.IsActive = serviceProvider.IsActive;
                // Keep the original CreatedAt value - don't update it

                // MOHAMMED: Mark as modified and save
                // _context.Entry(existingServiceProvider).State = EntityState.Modified;
                // await _context.SaveChangesAsync();

                // return Ok(existingServiceProvider);

                throw new NotImplementedException("TODO: Implement UpdateServiceProvider");
            }
            catch (DbUpdateConcurrencyException)
            {
                // MOHAMMED: Check if service provider still exists
                throw;
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the service provider.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/ServiceProviders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceProvider(int id)
        {
            try
            {
                // MOHAMMED: Find the service provider to delete
                // var serviceProvider = await _context.ServiceProviders.FindAsync(id);
                // if (serviceProvider == null)
                // {
                //     return NotFound(new { message = $"Service provider with ID {id} not found." });
                // }

                // MOHAMMED: Remove service provider and save changes
                // _context.ServiceProviders.Remove(serviceProvider);
                // await _context.SaveChangesAsync();

                // return Ok(new { message = $"Service provider with ID {id} has been deleted successfully." });

                throw new NotImplementedException("TODO: Implement DeleteServiceProvider");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the service provider.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
