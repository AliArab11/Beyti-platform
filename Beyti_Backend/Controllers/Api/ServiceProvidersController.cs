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
    public class ServiceProvidersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceProvidersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceProviders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BeytiDB.Data.ServiceProvider>>> GetServiceProviders()
        {
            return await _context.ServiceProviders.ToListAsync();
        }

        // GET: api/ServiceProviders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BeytiDB.Data.ServiceProvider>> GetServiceProvider(int id)
        {
            var serviceProvider = await _context.ServiceProviders.FindAsync(id);

            if (serviceProvider == null)
            {
                return NotFound();
            }

            return serviceProvider;
        }

        // PUT: api/ServiceProviders/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceProvider(int id, BeytiDB.Data.ServiceProvider serviceProvider)
        {
            if (id != serviceProvider.Id)
            {
                return BadRequest();
            }

            _context.Entry(serviceProvider).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceProviderExists(id))
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

        // POST: api/ServiceProviders
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<BeytiDB.Data.ServiceProvider>> PostServiceProvider(BeytiDB.Data.ServiceProvider serviceProvider)
        {
            _context.ServiceProviders.Add(serviceProvider);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceProvider", new { id = serviceProvider.Id }, serviceProvider);
        }

        // DELETE: api/ServiceProviders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceProvider(int id)
        {
            var serviceProvider = await _context.ServiceProviders.FindAsync(id);
            if (serviceProvider == null)
            {
                return NotFound();
            }

            _context.ServiceProviders.Remove(serviceProvider);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ServiceProviderExists(int id)
        {
            return _context.ServiceProviders.Any(e => e.Id == id);
        }
    }
}
