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
    public class UserMembershipsController : ControllerBase
    {
        private readonly BeytiContext _context;

        public UserMembershipsController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/UserMemberships
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserMembership>>> GetUserMemberships()
        {
            return await _context.UserMemberships.ToListAsync();
        }

        // GET: api/UserMemberships/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserMembership>> GetUserMembership(int id)
        {
            var userMembership = await _context.UserMemberships.FindAsync(id);

            if (userMembership == null)
            {
                return NotFound();
            }

            return userMembership;
        }

        // PUT: api/UserMemberships/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUserMembership(int id, UserMembership userMembership)
        {
            if (id != userMembership.Id)
            {
                return BadRequest();
            }

            _context.Entry(userMembership).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserMembershipExists(id))
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

        // POST: api/UserMemberships
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<UserMembership>> PostUserMembership(CreateMembershipDto dto)
        {
            // Validate UserProfileId exists
            var userProfile = await _context.UserProfiles.FindAsync(dto.UserProfileId);
            if (userProfile == null)
            {
                return NotFound(new { error = "User profile not found" });
            }

            // Validate MembershipPlanId exists
            var plan = await _context.MembershipPlans.FindAsync(dto.MembershipPlanId);
            if (plan == null)
            {
                return NotFound(new { error = "Membership plan not found" });
            }

            // Check if user already has active membership
            var existing = await _context.UserMemberships
                .FirstOrDefaultAsync(um => um.UserProfileId == dto.UserProfileId && um.Status == "Active");

            if (existing != null)
            {
                return BadRequest(new { error = "User already has an active membership" });
            }

            var membership = new UserMembership
            {
                UserProfileId = dto.UserProfileId,
                MembershipPlanId = dto.MembershipPlanId,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(plan.DurationDays ?? 30)),
                Status = "Active",
                AutoRenew = dto.AutoRenew ?? false,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserMemberships.Add(membership);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUserMembership", new { id = membership.Id }, membership);
        }

        // DTO class for membership creation
        public class CreateMembershipDto
        {
            public int UserProfileId { get; set; }
            public int MembershipPlanId { get; set; }
            public bool? AutoRenew { get; set; }
        }

        // DELETE: api/UserMemberships/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUserMembership(int id)
        {
            var userMembership = await _context.UserMemberships.FindAsync(id);
            if (userMembership == null)
            {
                return NotFound();
            }

            _context.UserMemberships.Remove(userMembership);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UserMembershipExists(int id)
        {
            return _context.UserMemberships.Any(e => e.Id == id);
        }
    }
}
