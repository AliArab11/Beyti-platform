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
    public class ServiceCatalogsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceCatalogsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceCatalogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceCatalog>>> GetServiceCatalogs()
        {
            return await _context.ServiceCatalogs
                .Include(sc => sc.ServiceCategory)
                .ToListAsync();
        }

        // GET: api/ServiceCatalogs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceCatalog>> GetServiceCatalog(int id)
        {
            var serviceCatalog = await _context.ServiceCatalogs
                .Include(sc => sc.ServiceCategory)
                .FirstOrDefaultAsync(sc => sc.Id == id);

            if (serviceCatalog == null)
            {
                return NotFound();
            }

            return serviceCatalog;
        }

        // PUT: api/ServiceCatalogs/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceCatalog(int id, ServiceCatalog serviceCatalog)
        {
            if (id != serviceCatalog.Id)
            {
                return BadRequest();
            }

            _context.Entry(serviceCatalog).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceCatalogExists(id))
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

        // POST: api/ServiceCatalogs
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ServiceCatalog>> PostServiceCatalog(ServiceCatalog serviceCatalog)
        {
            _context.ServiceCatalogs.Add(serviceCatalog);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceCatalog", new { id = serviceCatalog.Id }, serviceCatalog);
        }

        // DELETE: api/ServiceCatalogs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceCatalog(int id)
        {
            var serviceCatalog = await _context.ServiceCatalogs.FindAsync(id);
            if (serviceCatalog == null)
            {
                return NotFound();
            }

            _context.ServiceCatalogs.Remove(serviceCatalog);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ServiceCatalogExists(int id)
        {
            return _context.ServiceCatalogs.Any(e => e.Id == id);
        }
    }
}
