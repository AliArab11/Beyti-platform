using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using System.Text.Json;

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

      

[HttpPut("{id}")]
    public async Task<IActionResult> PutAdminProfile(int id, JsonElement body)
    {
        var admin = await _context.AdminProfiles.FindAsync(id);
        if (admin == null) return NotFound();

        // Update only the fields that are provided
        if (body.TryGetProperty("title", out var titleProp))
            admin.Title = titleProp.GetString();

        if (body.TryGetProperty("permissions", out var permissionsProp))
            admin.Permissions = permissionsProp.GetString();

        await _context.SaveChangesAsync();
        return Ok(admin);
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

        [HttpPatch("Admin/{adminId}/toggle")]
        public async Task<IActionResult> ToggleAdminStatus(int adminId)
        {
            var admin = await _context.AdminProfiles
                .Include(a => a.UserProfile)
                .FirstOrDefaultAsync(a => a.Id == adminId);

            if (admin == null)
                return NotFound("Admin not found.");

            // Toggle UserProfile status
            admin.UserProfile.Status = admin.UserProfile.Status == "Active"
                ? "Inactive"
                : "Active";

            admin.UserProfile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                admin.Id,
                admin.UserProfile.Status
            });
        }


        private bool AdminProfileExists(int id)
        {
            return _context.AdminProfiles.Any(e => e.Id == id);
        }
    }
}
