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

    public class UpdateCustomerProfileDto
    {
        public string DisplayName { get; set; }
        public string Phone { get; set; }
    }

    public class UpdateCustomerAddressDto
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string Region { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
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
        public async Task<ActionResult<IEnumerable<object>>> GetCustomers([FromQuery] int? userProfileId = null)
        {
            var query = _context.Customers
                .Include(c => c.UserProfile)
                .Include(c => c.CustomerAddresses)
                    .ThenInclude(ca => ca.Address);

            // Filter by userProfileId if provided
            if (userProfileId.HasValue)
            {
                var customer = await query
                    .Where(c => c.UserProfileId == userProfileId.Value)
                    .Select(c => new
                    {
                        c.Id,
                        c.UserProfileId,
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
                                ca.Address.Country,
                                ca.Address.Latitude,
                                ca.Address.Longitude
                            }
                        })
                    })
                    .FirstOrDefaultAsync();

                if (customer == null)
                    return NotFound(new { message = "Customer not found for the specified user profile" });

                return Ok(customer);
            }

            return await query
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
                            ca.Address.Country,
                            ca.Address.Latitude,
                            ca.Address.Longitude
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

        // PUT: api/Customers/UpdateProfile/{userProfileId}
        [HttpPut("UpdateProfile/{userProfileId}")]
        public async Task<IActionResult> UpdateProfile(int userProfileId, [FromBody] UpdateCustomerProfileDto dto)
        {
            try
            {
                // Find customer by UserProfileId
                var customer = await _context.Customers
                    .Include(c => c.UserProfile)
                    .FirstOrDefaultAsync(c => c.UserProfileId == userProfileId);

                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found" });
                }

                // Update UserProfile DisplayName
                if (!string.IsNullOrEmpty(dto.DisplayName))
                {
                    customer.UserProfile.DisplayName = dto.DisplayName;
                    customer.UserProfile.UpdatedAt = DateTime.UtcNow;
                }

                // Update Customer Phone
                if (!string.IsNullOrEmpty(dto.Phone))
                {
                    customer.Phone = dto.Phone;
                    customer.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile updated successfully",
                    displayName = customer.UserProfile.DisplayName,
                    phone = customer.Phone
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Failed to update profile",
                    details = ex.Message
                });
            }
        }

        // PUT: api/Customers/UpdateAddress/{customerId}
        [HttpPut("UpdateAddress/{customerId}")]
        public async Task<IActionResult> UpdateAddress(int customerId, [FromBody] UpdateCustomerAddressDto dto)
        {
            try
            {
                // Find customer with their addresses
                var customer = await _context.Customers
                    .Include(c => c.CustomerAddresses)
                        .ThenInclude(ca => ca.Address)
                    .FirstOrDefaultAsync(c => c.Id == customerId);

                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found" });
                }

                // Get the default address or first address
                var customerAddress = customer.CustomerAddresses
                    .FirstOrDefault(ca => ca.Address.IsDefault)
                    ?? customer.CustomerAddresses.FirstOrDefault();

                if (customerAddress != null)
                {
                    // Update existing address
                    var address = customerAddress.Address;
                    address.Street = dto.Street ?? address.Street;
                    address.City = dto.City ?? address.City;
                    address.Region = dto.Region ?? address.Region;
                    address.PostalCode = dto.PostalCode ?? address.PostalCode;
                    address.Country = dto.Country ?? address.Country;
                    address.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new address if none exists
                    var newAddress = new Address
                    {
                        Street = dto.Street,
                        City = dto.City,
                        Region = dto.Region,
                        PostalCode = dto.PostalCode,
                        Country = dto.Country,
                        IsDefault = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Addresses.Add(newAddress);
                    await _context.SaveChangesAsync();

                    // Link address to customer
                    var newCustomerAddress = new CustomerAddress
                    {
                        CustomerId = customerId,
                        AddressId = newAddress.Id
                    };

                    _context.CustomerAddresses.Add(newCustomerAddress);
                }

                customer.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Address updated successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Failed to update address",
                    details = ex.Message
                });
            }
        }
    }
}
