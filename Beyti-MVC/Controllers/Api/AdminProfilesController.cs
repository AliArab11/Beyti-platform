using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminProfilesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public AdminProfilesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/AdminProfiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminProfile>>> GetAdminProfiles()
        {
            try
            {
                // MOHAMMED: Query AdminProfiles table here
                // Example: var adminProfiles = await _context.AdminProfiles.ToListAsync();

                throw new NotImplementedException("TODO: Implement GetAdminProfiles");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving admin profiles.", error = ex.Message });
            }
        }

        // GET: api/AdminProfiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AdminProfile>> GetAdminProfile(int id)
        {
            try
            {
                // MOHAMMED: Find admin profile by ID
                // Example: var adminProfile = await _context.AdminProfiles.FindAsync(id);

                // MOHAMMED: Check if admin profile exists and return NotFound if it doesn't
                // if (adminProfile == null)
                // {
                //     return NotFound(new { message = $"Admin profile with ID {id} not found." });
                // }

                throw new NotImplementedException("TODO: Implement GetAdminProfile");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the admin profile.", error = ex.Message });
            }
        }

        // POST: api/AdminProfiles/add
        [HttpPost("add")]
        public async Task<ActionResult<AdminProfile>> AddAdminProfile([FromBody] AdminProfile adminProfile)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // MOHAMMED: Set default values before adding to database
                // adminProfile.CreatedAt = DateTime.Now;
                // adminProfile.IsActive = true;
                // adminProfile.Role = "Admin"; // or whatever default you need

                // MOHAMMED: Add admin profile to context and save changes
                // _context.AdminProfiles.Add(adminProfile);
                // await _context.SaveChangesAsync();

                // MOHAMMED: Return the created admin profile
                // return CreatedAtAction(nameof(GetAdminProfile), new { id = adminProfile.Id }, adminProfile);

                throw new NotImplementedException("TODO: Implement AddAdminProfile");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the admin profile.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/AdminProfiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAdminProfile(int id, [FromBody] AdminProfile adminProfile)
        {
            try
            {
                if (id != adminProfile.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // MOHAMMED: Find the existing admin profile
                // var existingAdminProfile = await _context.AdminProfiles.FindAsync(id);
                // if (existingAdminProfile == null)
                // {
                //     return NotFound(new { message = $"Admin profile with ID {id} not found." });
                // }

                // MOHAMMED: Update properties from the request body
                // existingAdminProfile.Name = adminProfile.Name;
                // existingAdminProfile.Email = adminProfile.Email;
                // existingAdminProfile.Role = adminProfile.Role;
                // existingAdminProfile.IsActive = adminProfile.IsActive;
                // Keep the original CreatedAt value - don't update it

                // MOHAMMED: Mark as modified and save
                // _context.Entry(existingAdminProfile).State = EntityState.Modified;
                // await _context.SaveChangesAsync();

                // return Ok(existingAdminProfile);

                throw new NotImplementedException("TODO: Implement UpdateAdminProfile");
            }
            catch (DbUpdateConcurrencyException)
            {
                // MOHAMMED: Check if admin profile still exists
                throw;
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the admin profile.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/AdminProfiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdminProfile(int id)
        {
            try
            {
                // MOHAMMED: Find the admin profile to delete
                // var adminProfile = await _context.AdminProfiles.FindAsync(id);
                // if (adminProfile == null)
                // {
                //     return NotFound(new { message = $"Admin profile with ID {id} not found." });
                // }

                // MOHAMMED: Remove admin profile and save changes
                // _context.AdminProfiles.Remove(adminProfile);
                // await _context.SaveChangesAsync();

                // return Ok(new { message = $"Admin profile with ID {id} has been deleted successfully." });

                throw new NotImplementedException("TODO: Implement DeleteAdminProfile");
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the admin profile.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
