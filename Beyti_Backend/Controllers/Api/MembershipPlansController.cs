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

        // PUT: api/MembershipPlans/update/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("update/{id}")]
        public async Task<ActionResult<MembershipPlan>> UpdateMembershipPlan(int id, MembershipPlan membershipPlan)
        {
            var existingPlan = await _context.MembershipPlans.FindAsync(id);
            if (existingPlan == null)
            {
                return NotFound();
            }

            // Update properties
            existingPlan.Name = membershipPlan.Name;
            existingPlan.Description = membershipPlan.Description;
            existingPlan.MonthlyPrice = membershipPlan.MonthlyPrice;
            existingPlan.DurationDays = membershipPlan.DurationDays;
            existingPlan.IsActive = membershipPlan.IsActive;

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

            return Ok(existingPlan);
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

        // DELETE: api/MembershipPlans/delete/5
        [HttpDelete("delete/{id}")]
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

        // PATCH: api/MembershipPlans/toggle/5
        [HttpPatch("toggle/{id}")]
        public async Task<ActionResult<MembershipPlan>> ToggleMembershipPlanStatus(int id)
        {
            var membershipPlan = await _context.MembershipPlans.FindAsync(id);
            if (membershipPlan == null)
            {
                return NotFound();
            }

            // Toggle the IsActive status
            membershipPlan.IsActive = !membershipPlan.IsActive;

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

            return Ok(membershipPlan);
        }

        private bool MembershipPlanExists(int id)
        {
            return _context.MembershipPlans.Any(e => e.Id == id);
        }
    }
}
