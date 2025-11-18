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
        public async Task<ActionResult<UserMembership>> PostUserMembership(UserMembership userMembership)
        {
            _context.UserMemberships.Add(userMembership);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUserMembership", new { id = userMembership.Id }, userMembership);
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
