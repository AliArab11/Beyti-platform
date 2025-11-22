using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;

namespace Beyti_Backend.Controllers.Api
{
    public class CreateCustomerDto
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly BeytiContext _context;

        public CustomersController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/Customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomers()
        {
            return await _context.Customers
                .Include(c => c.UserProfile)
                .Include(c => c.CustomerAddresses)
                    .ThenInclude(ca => ca.Address)
                .Select(c => new
                {
                    c.Id,
                    fullName = c.UserProfile.DisplayName,
                    c.Phone,
                    c.CreatedAt,
                    customerAddresses = c.CustomerAddresses.Select(ca => new
                    {
                        ca.Id,
                        address = new
                        {
                            ca.Address.Id,
                            ca.Address.Label,
                            ca.Address.Street,
                            ca.Address.City,
                            ca.Address.Region,
                            ca.Address.PostalCode,
                            ca.Address.Country
                        }
                    })
                })
                .ToListAsync();
        }


        // GET: api/Customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCustomer(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.UserProfile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
                return NotFound();

            return new
            {
                customer.Id,
                fullName = customer.UserProfile.DisplayName,
                customer.Phone,
                customer.CreatedAt
            };
        }

        // POST: api/Customers
        [HttpPost]
        public async Task<IActionResult> PostCustomer(CreateCustomerDto dto)
        {
            try
            {
                var profile = new UserProfile
                {
                    DisplayName = dto.FullName,
                    RoleType = "Customer",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.UserProfiles.Add(profile);
                await _context.SaveChangesAsync();

                var customer = new Customer
                {
                    UserProfileId = profile.Id,
                    Phone = dto.Phone,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    id = customer.Id,
                    fullName = profile.DisplayName,
                    phone = customer.Phone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/Customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCustomer(int id, CreateCustomerDto dto)
        {
            var customer = await _context.Customers
                .Include(c => c.UserProfile)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
                return NotFound();

            customer.UserProfile.DisplayName = dto.FullName;
            customer.Phone = dto.Phone;
            customer.UserProfile.UpdatedAt = DateTime.UtcNow;
            customer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = customer.Id,
                fullName = customer.UserProfile.DisplayName,
                phone = customer.Phone
            });
        }

        // DELETE: api/Customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
                return NotFound();

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
