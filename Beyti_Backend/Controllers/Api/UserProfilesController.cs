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
    public class UserProfilesController : ControllerBase
    {
        private readonly BeytiContext _context;

        public UserProfilesController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/UserProfiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserProfile>>> GetUserProfiles()
        {
            return await _context.UserProfiles.ToListAsync();
        }

        // GET: api/UserProfiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserProfile>> GetUserProfile(int id)
        {
            var userProfile = await _context.UserProfiles.FindAsync(id);

            if (userProfile == null)
            {
                return NotFound();
            }

            return userProfile;
        }

        // GET: api/UserProfiles/Profile/5
        // Returns complete profile data for any user type
        [HttpGet("Profile/{userProfileId}")]
        public async Task<IActionResult> GetCompleteProfile(int userProfileId)
        {
            try
            {
                var userProfile = await _context.UserProfiles.FindAsync(userProfileId);

                if (userProfile == null)
                    return NotFound("User profile not found");

                // Base profile data
                var response = new Dictionary<string, object>
                {
                    { "UserProfileId", userProfile.Id },
                    { "DisplayName", userProfile.DisplayName },
                    { "RoleType", userProfile.RoleType },
                    { "Status", userProfile.Status },
                    { "CreatedAt", userProfile.CreatedAt },
                    { "UpdatedAt", userProfile.UpdatedAt }
                };

                // Fetch role-specific data based on RoleType
                switch (userProfile.RoleType)
                {
                    case "Admin":
                        var admin = await _context.AdminProfiles
                            .FirstOrDefaultAsync(a => a.UserProfileId == userProfileId);
                        if (admin != null)
                        {
                            response.Add("AdminId", admin.Id);
                            response.Add("Title", admin.Title);
                            response.Add("Permissions", admin.Permissions);
                        }
                        break;

                    case "ServiceProvider":
                        var provider = await _context.ServiceProviders
                            .Include(sp => sp.ServiceProviderAddresses)
                                .ThenInclude(spa => spa.Address)
                            .FirstOrDefaultAsync(sp => sp.UserProfileId == userProfileId);

                        if (provider != null)
                        {
                            Console.WriteLine($"[GetCompleteProfile] ServiceProvider {provider.Id} has Status: '{provider.Status}'");
                            response.Add("ServiceProviderId", provider.Id);
                            response.Add("BusinessName", provider.BusinessName);
                            response.Add("Phone", provider.Phone);
                            // Keep UserProfile.Status as AccountStatus for suspension checking
                            // ServiceProvider.Status is for availability (Available/Busy/Unavailable)
                            response.Add("AccountStatus", userProfile.Status); // Admin-controlled (Active/Suspended)
                            response["Status"] = provider.Status; // User-controlled availability
                            Console.WriteLine($"[GetCompleteProfile] Returning Status: '{response["Status"]}', AccountStatus: '{response["AccountStatus"]}'");

                            var primaryAddress = provider.ServiceProviderAddresses
                                .Select(spa => spa.Address)
                                .FirstOrDefault();

                            if (primaryAddress != null)
                            {
                                response.Add("Street", primaryAddress.Street);
                                response.Add("City", primaryAddress.City);
                                response.Add("Region", primaryAddress.Region);
                                response.Add("PostalCode", primaryAddress.PostalCode);
                                response.Add("Country", primaryAddress.Country);

                                // Build formatted address
                                var addressParts = new List<string>();
                                if (!string.IsNullOrEmpty(primaryAddress.Street)) addressParts.Add(primaryAddress.Street);
                                if (!string.IsNullOrEmpty(primaryAddress.City)) addressParts.Add(primaryAddress.City);
                                if (!string.IsNullOrEmpty(primaryAddress.Region)) addressParts.Add(primaryAddress.Region);
                                if (!string.IsNullOrEmpty(primaryAddress.PostalCode)) addressParts.Add(primaryAddress.PostalCode);
                                if (!string.IsNullOrEmpty(primaryAddress.Country)) addressParts.Add(primaryAddress.Country);

                                if (addressParts.Count > 0)
                                {
                                    response.Add("Address", string.Join(", ", addressParts));
                                }
                            }
                        }
                        break;

                    case "Seller":
                        var seller = await _context.Sellers
                            .Include(s => s.SellerAddresses)
                                .ThenInclude(sa => sa.Address)
                            .FirstOrDefaultAsync(s => s.UserProfileId == userProfileId);

                        if (seller != null)
                        {
                            response.Add("SellerId", seller.Id);
                            response.Add("StoreName", seller.StoreName);
                            response.Add("Phone", seller.Phone);

                            var primaryAddress = seller.SellerAddresses
                                .Select(sa => sa.Address)
                                .FirstOrDefault();

                            if (primaryAddress != null)
                            {
                                response.Add("Street", primaryAddress.Street);
                                response.Add("City", primaryAddress.City);
                                response.Add("Region", primaryAddress.Region);
                                response.Add("PostalCode", primaryAddress.PostalCode);
                                response.Add("Country", primaryAddress.Country);
                            }
                        }
                        break;

                    case "Customer":
                        var customer = await _context.Customers
                            .Include(c => c.CustomerAddresses)
                                .ThenInclude(ca => ca.Address)
                            .FirstOrDefaultAsync(c => c.UserProfileId == userProfileId);

                        if (customer != null)
                        {
                            response.Add("CustomerId", customer.Id);
                            response.Add("Phone", customer.Phone);

                            var primaryAddress = customer.CustomerAddresses
                                .Select(ca => ca.Address)
                                .FirstOrDefault();

                            if (primaryAddress != null)
                            {
                                response.Add("Street", primaryAddress.Street);
                                response.Add("City", primaryAddress.City);
                                response.Add("Region", primaryAddress.Region);
                                response.Add("PostalCode", primaryAddress.PostalCode);
                                response.Add("Country", primaryAddress.Country);
                            }
                        }
                        break;

                    case "Driver":
                        var driver = await _context.Drivers
                            .FirstOrDefaultAsync(d => d.UserProfileId == userProfileId);

                        if (driver != null)
                        {
                            response.Add("DriverId", driver.Id);
                            response.Add("Phone", driver.Phone);
                            response.Add("DriverStatus", driver.Status);
                        }
                        break;
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/UserProfiles/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUserProfile(int id, UserProfile userProfile)
        {
            if (id != userProfile.Id)
            {
                return BadRequest();
            }

            _context.Entry(userProfile).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserProfileExists(id))
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

        // POST: api/UserProfiles
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<UserProfile>> PostUserProfile(UserProfile userProfile)
        {
            _context.UserProfiles.Add(userProfile);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUserProfile", new { id = userProfile.Id }, userProfile);
        }

        // DELETE: api/UserProfiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserProfile(int id)
        {
            var userProfile = await _context.UserProfiles.FindAsync(id);
            if (userProfile == null)
            {
                return NotFound();
            }

            _context.UserProfiles.Remove(userProfile);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserProfileExists(int id)
        {
            return _context.UserProfiles.Any(e => e.Id == id);
        }
    }
}
