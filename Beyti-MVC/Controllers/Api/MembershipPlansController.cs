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

                // Set CreatedAt to current time
                membershipPlan.CreatedAt = DateTime.Now;

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

        // PUT: api/MembershipPlans/update/5
        [HttpPut("update/{id}")]
        public async Task<ActionResult<MembershipPlan>> UpdateMembershipPlan(int id, [FromBody] MembershipPlan membershipPlan)
        {
            try
            {
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

                await _context.SaveChangesAsync();

                return Ok(existingPlan);
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

        // DELETE: api/MembershipPlans/delete/5
        [HttpDelete("delete/{id}")]
        public async Task<ActionResult<MembershipPlan>> DeleteMembershipPlan(int id)
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

        //add new membership plan api/membershipplans/add
        [HttpPost("add")]
        public async Task<ActionResult<MembershipPlan>> AddMembershipPlan([FromBody] MembershipPlan membershipPlan)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                // Set CreatedAt to current UTC time
                membershipPlan.CreatedAt = DateTime.Now;
                membershipPlan.IsActive = true; // Set default value for IsActive
                _context.MembershipPlans.Add(membershipPlan);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetMembershipPlan), new { id = membershipPlan.Id }, membershipPlan);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the membership plan.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }

        // PATCH: api/MembershipPlans/toggle/5
        [HttpPatch("toggle/{id}")]
        public async Task<ActionResult<MembershipPlan>> ToggleMembershipPlanStatus(int id)
        {
            try
            {
                var membershipPlan = await _context.MembershipPlans.FindAsync(id);
                if (membershipPlan == null)
                {
                    return NotFound(new { message = $"Membership plan with ID {id} not found." });
                }

                // Toggle the IsActive status
                membershipPlan.IsActive = !membershipPlan.IsActive;

                await _context.SaveChangesAsync();

                return Ok(membershipPlan);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { message = "An error occurred while toggling the membership plan status.", error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An unexpected error occurred.", error = ex.Message });
            }
        }
    }
}
