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
    public class ServiceProviderAddressesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public ServiceProviderAddressesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/ServiceProviderAddresses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ServiceProviderAddress>>> GetServiceProviderAddresses()
        {
            return await _context.ServiceProviderAddresses.ToListAsync();
        }

        // GET: api/ServiceProviderAddresses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceProviderAddress>> GetServiceProviderAddress(int id)
        {
            var serviceProviderAddress = await _context.ServiceProviderAddresses.FindAsync(id);

            if (serviceProviderAddress == null)
            {
                return NotFound();
            }

            return serviceProviderAddress;
        }

        // PUT: api/ServiceProviderAddresses/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceProviderAddress(int id, ServiceProviderAddress serviceProviderAddress)
        {
            if (id != serviceProviderAddress.Id)
            {
                return BadRequest();
            }

            _context.Entry(serviceProviderAddress).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceProviderAddressExists(id))
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

        public class CreateServiceProviderAddressDto
        {
            public int ServiceProviderId { get; set; }
            public int AddressId { get; set; }
        }

        // POST: api/ServiceProviderAddresses
        [HttpPost]
        public async Task<ActionResult<ServiceProviderAddress>> PostServiceProviderAddress(CreateServiceProviderAddressDto dto)
        {
            var serviceProviderAddress = new ServiceProviderAddress
            {
                ServiceProviderId = dto.ServiceProviderId,
                AddressId = dto.AddressId
            };

            _context.ServiceProviderAddresses.Add(serviceProviderAddress);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetServiceProviderAddress", new { id = serviceProviderAddress.Id }, serviceProviderAddress);
        }

        // DELETE: api/ServiceProviderAddresses/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceProviderAddress(int id)
        {
            var serviceProviderAddress = await _context.ServiceProviderAddresses.FindAsync(id);
            if (serviceProviderAddress == null)
            {
                return NotFound();
            }

            _context.ServiceProviderAddresses.Remove(serviceProviderAddress);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ServiceProviderAddressExists(int id)
        {
            return _context.ServiceProviderAddresses.Any(e => e.Id == id);
        }
    }
}
