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
    public class ProviderApplicationServicesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProviderApplicationServicesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ProviderApplicationServices
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProviderApplicationService>>> GetProviderApplicationServices()
        {
            return await _context.ProviderApplicationServices.ToListAsync();
        }

        // GET: api/ProviderApplicationServices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProviderApplicationService>> GetProviderApplicationService(int id)
        {
            var providerApplicationService = await _context.ProviderApplicationServices.FindAsync(id);

            if (providerApplicationService == null)
            {
                return NotFound();
            }

            return providerApplicationService;
        }

        // PUT: api/ProviderApplicationServices/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProviderApplicationService(int id, ProviderApplicationService providerApplicationService)
        {
            if (id != providerApplicationService.Id)
            {
                return BadRequest();
            }

            _context.Entry(providerApplicationService).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProviderApplicationServiceExists(id))
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

        // POST: api/ProviderApplicationServices
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProviderApplicationService>> PostProviderApplicationService(ProviderApplicationService providerApplicationService)
        {
            _context.ProviderApplicationServices.Add(providerApplicationService);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProviderApplicationService", new { id = providerApplicationService.Id }, providerApplicationService);
        }

        // DELETE: api/ProviderApplicationServices/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProviderApplicationService(int id)
        {
            var providerApplicationService = await _context.ProviderApplicationServices.FindAsync(id);
            if (providerApplicationService == null)
            {
                return NotFound();
            }

            _context.ProviderApplicationServices.Remove(providerApplicationService);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProviderApplicationServiceExists(int id)
        {
            return _context.ProviderApplicationServices.Any(e => e.Id == id);
        }
    }
}
