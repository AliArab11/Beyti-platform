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
    public class ProviderCertificatesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ProviderCertificatesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ProviderCertificates
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProviderCertificate>>> GetProviderCertificates()
        {
            return await _context.ProviderCertificates.ToListAsync();
        }

        // GET: api/ProviderCertificates/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProviderCertificate>> GetProviderCertificate(int id)
        {
            var providerCertificate = await _context.ProviderCertificates.FindAsync(id);

            if (providerCertificate == null)
            {
                return NotFound();
            }

            return providerCertificate;
        }

        // PUT: api/ProviderCertificates/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProviderCertificate(int id, ProviderCertificate providerCertificate)
        {
            if (id != providerCertificate.Id)
            {
                return BadRequest();
            }

            _context.Entry(providerCertificate).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProviderCertificateExists(id))
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

        // POST: api/ProviderCertificates
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ProviderCertificate>> PostProviderCertificate(ProviderCertificate providerCertificate)
        {
            _context.ProviderCertificates.Add(providerCertificate);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProviderCertificate", new { id = providerCertificate.Id }, providerCertificate);
        }

        // DELETE: api/ProviderCertificates/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProviderCertificate(int id)
        {
            var providerCertificate = await _context.ProviderCertificates.FindAsync(id);
            if (providerCertificate == null)
            {
                return NotFound();
            }

            _context.ProviderCertificates.Remove(providerCertificate);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProviderCertificateExists(int id)
        {
            return _context.ProviderCertificates.Any(e => e.Id == id);
        }
    }
}
