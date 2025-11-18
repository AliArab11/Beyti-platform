using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Beyti.Data;

namespace Beyti_MVC.Controllers.Api
{
    [ApiController]
    [Route("api/[controller]")]
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
            try
            {
                var plans = await _context.MembershipPlans.ToListAsync();
                return Ok(plans);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving membership plans.", error = ex.Message });
            }
        }

        // GET: api/MembershipPlans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MembershipPlan>> GetMembershipPlan(int id)
        {
            try
            {
                var membershipPlan = await _context.MembershipPlans.FindAsync(id);

                if (membershipPlan == null)
                {
                    return NotFound(new { message = $"Membership plan with ID {id} not found." });
                }

                return Ok(membershipPlan);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the membership plan.", error = ex.Message });
            }
        }

        // POST: api/MembershipPlans
        [HttpPost]
        public async Task<ActionResult<MembershipPlan>> CreateMembershipPlan([FromBody] MembershipPlan membershipPlan)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Set CreatedAt to current UTC time
                membershipPlan.CreatedAt = DateTime.UtcNow;

                _context.MembershipPlans.Add(membershipPlan);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMembershipPlan), new { id = membershipPlan.Id }, membershipPlan);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the membership plan.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PUT: api/MembershipPlans/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMembershipPlan(int id, [FromBody] MembershipPlan membershipPlan)
        {
            try
            {
                if (id != membershipPlan.Id)
                {
                    return BadRequest(new { message = "ID mismatch between route and body." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingPlan = await _context.MembershipPlans.FindAsync(id);
                if (existingPlan == null)
                {
                    return NotFound(new { message = $"Membership plan with ID {id} not found." });
                }

                // Update properties
                existingPlan.Name = membershipPlan.Name;
                existingPlan.Description = membershipPlan.Description;
                existingPlan.MonthlyPrice = membershipPlan.MonthlyPrice;
                existingPlan.DurationDays = membershipPlan.DurationDays;
                existingPlan.IsActive = membershipPlan.IsActive;
                // Keep the original CreatedAt value

                _context.Entry(existingPlan).State = EntityState.Modified;

                await _context.SaveChangesAsync();

                return Ok(existingPlan);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MembershipPlanExists(id))
                {
                    return NotFound(new { message = $"Membership plan with ID {id} not found." });
                }
                else
                {
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the membership plan.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // DELETE: api/MembershipPlans/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMembershipPlan(int id)
        {
            try
            {
                var membershipPlan = await _context.MembershipPlans.FindAsync(id);
                if (membershipPlan == null)
                {
                    return NotFound(new { message = $"Membership plan with ID {id} not found." });
                }

                _context.MembershipPlans.Remove(membershipPlan);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Membership plan with ID {id} has been deleted successfully." });
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the membership plan.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // Helper method to check if a membership plan exists
        private async Task<bool> MembershipPlanExists(int id)
        {
            return await _context.MembershipPlans.AnyAsync(e => e.Id == id);
        }
    }
}
