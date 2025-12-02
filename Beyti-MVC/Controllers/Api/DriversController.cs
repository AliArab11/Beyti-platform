using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriversController : ControllerBase
    {
        private readonly BeytiContext _context;

        public DriversController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers()
        {
            try
            {
                // HUSSAIN: Query Drivers table here
                // Example: var drivers = await _context.Drivers.ToListAsync();

                throw new NotImplementedException("TODO: Implement GetDrivers");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving drivers.", error = ex.Message });
            }
        }

        // GET: api/Drivers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriver(int id)
        {
            try
            {
                // HUSSAIN: Find driver by ID
                // Example: var driver = await _context.Drivers.FindAsync(id);

                // HUSSAIN: Check if driver exists and return NotFound if it doesn't
                // if (driver == null)
                // {
                //     return NotFound(new { message = $"Driver with ID {id} not found." });
                // }

                throw new NotImplementedException("TODO: Implement GetDriver");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the driver.", error = ex.Message });
            }
        }

        // POST: api/Drivers/add
        [HttpPost("add")]
        public async Task<ActionResult<Driver>> AddDriver([FromBody] Driver driver)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Set default values before adding to database
                // driver.CreatedAt = DateTime.Now;
                // driver.IsActive = true;
                // driver.IsVerified = false; // or whatever default you need
                // driver.CurrentStatus = "Available"; // or whatever default you need

                // HUSSAIN: Add driver to context and save changes
                // _context.Drivers.Add(driver);
                // await _context.SaveChangesAsync();

                // HUSSAIN: Return the created driver
                // return CreatedAtAction(nameof(GetDriver), new { id = driver.Id }, driver);

                throw new NotImplementedException("TODO: Implement AddDriver");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the driver.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/Drivers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDriver(int id, [FromBody] Driver driver)
        {
            try
            {
                if (id != driver.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // HUSSAIN: Find the existing driver
                // var existingDriver = await _context.Drivers.FindAsync(id);
                // if (existingDriver == null)
                // {
                //     return NotFound(new { message = $"Driver with ID {id} not found." });
                // }

                // HUSSAIN: Update properties from the request body
                // existingDriver.Name = driver.Name;
                // existingDriver.Email = driver.Email;
                // existingDriver.Phone = driver.Phone;
                // existingDriver.IsActive = driver.IsActive;
                // existingDriver.CurrentStatus = driver.CurrentStatus;
                // Keep the original CreatedAt value - don't update it

                // HUSSAIN: Mark as modified and save
                // _context.Entry(existingDriver).State = EntityState.Modified;
                // await _context.SaveChangesAsync();

                // return Ok(existingDriver);

                throw new NotImplementedException("TODO: Implement UpdateDriver");
            }
            catch (DbUpdateConcurrencyException)
            {
                // HUSSAIN: Check if driver still exists
                throw;
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the driver.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/Drivers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            try
            {
                // HUSSAIN: Find the driver to delete
                // var driver = await _context.Drivers.FindAsync(id);
                // if (driver == null)
                // {
                //     return NotFound(new { message = $"Driver with ID {id} not found." });
                // }

                // HUSSAIN: Remove driver and save changes
                // _context.Drivers.Remove(driver);
                // await _context.SaveChangesAsync();

                // return Ok(new { message = $"Driver with ID {id} has been deleted successfully." });

                throw new NotImplementedException("TODO: Implement DeleteDriver");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the driver.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
