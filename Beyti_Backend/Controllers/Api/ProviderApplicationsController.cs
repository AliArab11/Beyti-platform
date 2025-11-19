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
        public async Task<ActionResult<ProviderApplication>> GetProviderApplication(int id)
        {
            var providerApplication = await _context.ProviderApplications.FindAsync(id);

            if (providerApplication == null)
            {
                return NotFound();
            }

            return providerApplication;
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
        public async Task<ActionResult<ProviderApplication>> PostProviderApplication(ProviderApplication providerApplication)
        {
            _context.ProviderApplications.Add(providerApplication);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProviderApplication", new { id = providerApplication.Id }, providerApplication);
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
