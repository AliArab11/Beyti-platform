using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
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
        public async Task<ActionResult<IEnumerable<object>>> GetAdminProfiles()
        {
            var admins = await _context.AdminProfiles
                .Include(a => a.UserProfile)
                .Select(a => new
                {
                    a.Id,
                    a.UserProfileId,
                    a.Title,
                    a.Permissions,
                    a.CreatedAt,
                    DisplayName = a.UserProfile.DisplayName,
                    UserStatus = a.UserProfile.Status
                })
                .ToListAsync();

            return Ok(admins);
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
        [HttpPost]
        public async Task<ActionResult<AdminProfile>> PostAdminProfile(JsonElement body)
        {
            try
            {
                // Extract fields
                string? displayName = null;
                string? title = null;
                string? permissions = null;

                if (body.TryGetProperty("displayName", out var displayNameProp))
                    displayName = displayNameProp.GetString();

                if (body.TryGetProperty("title", out var titleProp))
                    title = titleProp.GetString();

                if (body.TryGetProperty("permissions", out var permissionsProp))
                    permissions = permissionsProp.GetString();

                // Validation
                if (string.IsNullOrEmpty(title))
                    return BadRequest("Title is required");

                var now = DateTime.Now;

                // Create UserProfile first
                var userProfile = new UserProfile
                {
                    IdentityUserId = Guid.NewGuid().ToString(),
                    DisplayName = displayName ?? title, // Use title as display name if not provided
                    RoleType = "Admin",
                    Status = "Active",
                    CreatedAt = now,
                    UpdatedAt = now
                };

                _context.UserProfiles.Add(userProfile);
                await _context.SaveChangesAsync();

                // Create AdminProfile
                var adminProfile = new AdminProfile
                {
                    UserProfileId = userProfile.Id,
                    Title = title,
                    Permissions = permissions ?? "All",
                    CreatedAt = now
                };

                _context.AdminProfiles.Add(adminProfile);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetAdminProfile", new { id = adminProfile.Id }, new
                {
                    adminProfile.Id,
                    adminProfile.UserProfileId,
                    adminProfile.Title,
                    adminProfile.Permissions,
                    adminProfile.CreatedAt,
                    DisplayName = userProfile.DisplayName,
                    UserStatus = userProfile.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PATCH: api/AdminProfiles/5/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleAdminStatus(int id)
        {
            var admin = await _context.AdminProfiles
                .Include(a => a.UserProfile)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (admin == null)
                return NotFound("Admin not found.");

            // Toggle UserProfile status
            admin.UserProfile.Status = admin.UserProfile.Status == "Active"
                ? "Inactive"
                : "Active";
            admin.UserProfile.UpdatedAt = DateTime.Now;

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