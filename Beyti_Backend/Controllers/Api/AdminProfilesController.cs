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
            return await _context.AdminProfiles.ToListAsync();
        }

        // GET: api/AdminProfiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AdminProfile>> GetAdminProfile(int id)
        {
            var adminProfile = await _context.AdminProfiles.FindAsync(id);

            if (adminProfile == null)
            {
                return NotFound();
            }

            return adminProfile;
        }

        // PUT: api/AdminProfiles/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAdminProfile(int id, AdminProfile adminProfile)
        {
            if (id != adminProfile.Id)
            {
                return BadRequest();
            }

            _context.Entry(adminProfile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AdminProfileExists(id))
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

        // POST: api/AdminProfiles
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<AdminProfile>> PostAdminProfile(AdminProfile adminProfile)
        {
            _context.AdminProfiles.Add(adminProfile);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAdminProfile", new { id = adminProfile.Id }, adminProfile);
        }

        // DELETE: api/AdminProfiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdminProfile(int id)
        {
            var adminProfile = await _context.AdminProfiles.FindAsync(id);
            if (adminProfile == null)
            {
                return NotFound();
            }

            _context.AdminProfiles.Remove(adminProfile);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AdminProfileExists(int id)
        {
            return _context.AdminProfiles.Any(e => e.Id == id);
        }
    }
}
