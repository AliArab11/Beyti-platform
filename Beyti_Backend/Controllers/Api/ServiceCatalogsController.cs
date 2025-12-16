using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateServiceCatalogDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(255)]
        public string? Description { get; set; }

        [Required]
        public int ServiceCategoryId { get; set; }

        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }

        public int? EstimatedDuration { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateServiceCatalogDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;

        [StringLength(255)]
        public string? Description { get; set; }

        [Required]
        public int ServiceCategoryId { get; set; }

        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }

        public int? EstimatedDuration { get; set; }

        public bool IsActive { get; set; } = true;
    }

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
        public async Task<ActionResult<IEnumerable<ServiceCatalog>>> GetServiceCatalogs([FromQuery] int? categoryId = null)
        {
            var query = _context.ServiceCatalogs
                .Include(sc => sc.ServiceCategory)
                .AsQueryable();

            // Filter by categoryId if provided
            if (categoryId.HasValue)
            {
                query = query.Where(sc => sc.ServiceCategoryId == categoryId.Value);
            }

            return await query.ToListAsync();
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
        public async Task<IActionResult> PutServiceCatalog(int id, UpdateServiceCatalogDto dto)
        {
            if (id != dto.Id)
            {
                return BadRequest();
            }

            var serviceCatalog = await _context.ServiceCatalogs.FindAsync(id);
            if (serviceCatalog == null)
            {
                return NotFound();
            }

            // Update properties
            serviceCatalog.Name = dto.Name;
            serviceCatalog.Description = dto.Description;
            serviceCatalog.ServiceCategoryId = dto.ServiceCategoryId;
            serviceCatalog.MinPrice = dto.MinPrice;
            serviceCatalog.MaxPrice = dto.MaxPrice;
            serviceCatalog.EstimatedDuration = dto.EstimatedDuration;
            serviceCatalog.IsActive = dto.IsActive;

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
        public async Task<ActionResult<ServiceCatalog>> PostServiceCatalog(CreateServiceCatalogDto dto)
        {
            var serviceCatalog = new ServiceCatalog
            {
                Name = dto.Name,
                Description = dto.Description,
                ServiceCategoryId = dto.ServiceCategoryId,
                MinPrice = dto.MinPrice,
                MaxPrice = dto.MaxPrice,
                EstimatedDuration = dto.EstimatedDuration,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.Now
            };

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
