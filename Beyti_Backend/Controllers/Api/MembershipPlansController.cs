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
    public class MembershipPlansController : ControllerBase
    {
        private readonly BeytiContext _context;

        public MembershipPlansController(BeytiContext context)
        {
            _context = context;
        }

        // GET: api/MembershipPlans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MembershipPlan>>> GetMembershipPlans()
        {
            return await _context.MembershipPlans.ToListAsync();
        }

        // GET: api/MembershipPlans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MembershipPlan>> GetMembershipPlan(int id)
        {
            var membershipPlan = await _context.MembershipPlans.FindAsync(id);

            if (membershipPlan == null)
            {
                return NotFound();
            }

            return membershipPlan;
        }

        // PUT: api/MembershipPlans/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMembershipPlan(int id, MembershipPlan membershipPlan)
        {
            if (id != membershipPlan.Id)
            {
                return BadRequest();
            }

            _context.Entry(membershipPlan).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MembershipPlanExists(id))
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

        // POST: api/MembershipPlans
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<MembershipPlan>> PostMembershipPlan(MembershipPlan membershipPlan)
        {
            _context.MembershipPlans.Add(membershipPlan);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetMembershipPlan", new { id = membershipPlan.Id }, membershipPlan);
        }

        // DELETE: api/MembershipPlans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMembershipPlan(int id)
        {
            var membershipPlan = await _context.MembershipPlans.FindAsync(id);
            if (membershipPlan == null)
            {
                return NotFound();
            }

            _context.MembershipPlans.Remove(membershipPlan);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MembershipPlanExists(int id)
        {
            return _context.MembershipPlans.Any(e => e.Id == id);
        }
    }
}
