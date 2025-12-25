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
    public class ProviderApplicationsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProviderApplicationsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ProviderApplications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProviderApplication>>> GetProviderApplications()
        {
            return await _context.ProviderApplications.ToListAsync();
        }

        // GET: api/ProviderApplications/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProviderApplication(int id)
        {
            var application = await _context.ProviderApplications
                .Include(pa => pa.ServiceProvider)
                    .ThenInclude(sp => sp.UserProfile)
                .Include(pa => pa.ProviderCertificates)
                .FirstOrDefaultAsync(pa => pa.Id == id);

            if (application == null)
                return NotFound();

            return Ok(new
            {
                id = application.Id,
                serviceProviderId = application.ServiceProviderId,
                status = application.Status,
                notes = application.Notes,
                createdAt = application.CreatedAt,
                updatedAt = application.UpdatedAt,
                certificates = application.ProviderCertificates.Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.FileUrl,
                    c.ExpiresAt
                }),
                serviceProvider = new
                {
                    application.ServiceProvider.Id,
                    application.ServiceProvider.BusinessName,
                    application.ServiceProvider.Phone,
                    userProfileId = application.ServiceProvider.UserProfileId,
                    displayName = application.ServiceProvider.UserProfile.DisplayName
                }
            });
        }

        // GET: api/ProviderApplications/user/123
        [HttpGet("user/{userProfileId}")]
        public async Task<ActionResult<object>> GetProviderApplicationByUser(int userProfileId)
        {
            // Find ServiceProvider by UserProfileId
            var serviceProvider = await _context.ServiceProviders
                .FirstOrDefaultAsync(sp => sp.UserProfileId == userProfileId);

            if (serviceProvider == null)
                return NotFound("No service provider found for this user");

            // Get latest application for this provider
            var application = await _context.ProviderApplications
                .Where(pa => pa.ServiceProviderId == serviceProvider.Id)
                .OrderByDescending(pa => pa.UpdatedAt)
                .FirstOrDefaultAsync();

            if (application == null)
                return NotFound("No application found for this service provider");

            return Ok(new
            {
                id = application.Id,
                serviceProviderId = application.ServiceProviderId,
                status = application.Status,
                notes = application.Notes,
                createdAt = application.CreatedAt,
                updatedAt = application.UpdatedAt
            });
        }

        // PUT: api/ProviderApplications/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProviderApplication(int id, ProviderApplication providerApplication)
        {
            if (id != providerApplication.Id)
            {
                return BadRequest();
            }

            _context.Entry(providerApplication).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProviderApplicationExists(id))
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

        // POST: api/ProviderApplications
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult> PostProviderApplication(JsonElement body)
        {
            if (!body.TryGetProperty("serviceProviderId", out var spIdProp))
                return BadRequest("serviceProviderId is required");

            int serviceProviderId = spIdProp.GetInt32();

            // Validate ServiceProvider exists
            var providerExists = await _context.ServiceProviders
                .AnyAsync(sp => sp.Id == serviceProviderId);
            if (!providerExists)
                return BadRequest("Invalid serviceProviderId");

            // Extract notes if provided
            string? notes = null;
            if (body.TryGetProperty("notes", out var notesProp))
                notes = notesProp.GetString();

            // Check for existing application
            var existingApp = await _context.ProviderApplications
                .FirstOrDefaultAsync(pa => pa.ServiceProviderId == serviceProviderId);

            if (existingApp != null)
            {
                // If existing application is Rejected, update it to Pending (resubmission)
                if (existingApp.Status == "Rejected")
                {
                    existingApp.Status = "Pending";
                    existingApp.Notes = notes;
                    existingApp.UpdatedAt = DateTime.Now;

                    // Delete old certificates (will cascade delete)
                    var oldCertificates = await _context.ProviderCertificates
                        .Where(pc => pc.ProviderApplicationId == existingApp.Id)
                        .ToListAsync();
                    _context.ProviderCertificates.RemoveRange(oldCertificates);

                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        id = existingApp.Id,
                        serviceProviderId = existingApp.ServiceProviderId,
                        status = existingApp.Status,
                        notes = existingApp.Notes,
                        createdAt = existingApp.CreatedAt,
                        updatedAt = existingApp.UpdatedAt,
                        isResubmission = true
                    });
                }
                // If existing application is Pending, reject duplicate
                else if (existingApp.Status == "Pending")
                {
                    return BadRequest("An application is already pending for this provider");
                }
                // If Approved, allow creating a new application (edge case for updates)
            }

            // Create new application
            var application = new ProviderApplication
            {
                ServiceProviderId = serviceProviderId,
                Status = "Pending",
                Notes = notes,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.ProviderApplications.Add(application);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProviderApplication", new { id = application.Id }, new
            {
                id = application.Id,
                serviceProviderId = application.ServiceProviderId,
                status = application.Status,
                notes = application.Notes,
                createdAt = application.CreatedAt,
                updatedAt = application.UpdatedAt
            });
        }

        // DELETE: api/ProviderApplications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProviderApplication(int id)
        {
            var providerApplication = await _context.ProviderApplications.FindAsync(id);
            if (providerApplication == null)
            {
                return NotFound();
            }

            _context.ProviderApplications.Remove(providerApplication);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProviderApplicationExists(int id)
        {
            return _context.ProviderApplications.Any(e => e.Id == id);
        }
    }
}
