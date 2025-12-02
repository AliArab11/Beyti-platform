using Beyti_Backend.DTOs.Auth;    
using BeytiDB.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Beyti_Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        // Tool 1: Manages Identity Users (Password, Email, etc.)
        private readonly UserManager<IdentityUser> _userManager;

        // Tool 2: Manages Business Data (UserProfiles, Products, etc.)
        private readonly BeytiContext _businessContext;

        // Tool 3: Reads settings from appsettings.json (for the JWT Key)
        private readonly IConfiguration _configuration;

        // Constructor: Injecting the tools we need
        public AuthController(
            UserManager<IdentityUser> userManager,
            BeytiContext businessContext,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _businessContext = businessContext;
            _configuration = configuration;
        }

        // ============================================================
        // 1. REGISTER ENDPOINT
        // ============================================================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // A. Create Identity User (Auth DB)
            var identityUser = new IdentityUser
            {
                UserName = model.Email,
                Email = model.Email,
                PhoneNumber = model.PhoneNumber
            };

            var result = await _userManager.CreateAsync(identityUser, model.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // B. Create Business Profile (Business DB)
            try
            {
                // UserProfile does not contain FirstName/LastName/Email fields.
                // Use DisplayName to store combined name, set required RoleType/Status and timestamps.
                var userProfile = new UserProfile
                {
                    IdentityUserId = identityUser.Id, // Link the two DBs
                    DisplayName = $"{model.FirstName} {model.LastName}".Trim(),
                    RoleType = "Customer", // Default role
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _businessContext.UserProfiles.Add(userProfile);
                await _businessContext.SaveChangesAsync();

                return Ok(new { Message = "User registered successfully", UserId = identityUser.Id });
            }
            catch (Exception)
            {
                // Rollback: If profile creation fails, delete the Identity user
                await _userManager.DeleteAsync(identityUser);
                return StatusCode(500, "Error creating user profile.");
            }
        }

        // ============================================================
        // 2. LOGIN ENDPOINT
        // ============================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
        {
            // A. Find user in Auth DB
            var identityUser = await _userManager.FindByEmailAsync(model.Email);
            if (identityUser == null) return Unauthorized("Invalid credentials");

            // B. Check Password
            if (!await _userManager.CheckPasswordAsync(identityUser, model.Password))
                return Unauthorized("Invalid credentials");

            // C. Find Profile in Business DB
            var userProfile = await _businessContext.UserProfiles
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);

            if (userProfile == null) return Unauthorized("User profile not found");

            // D. Generate Token
            var token = GenerateJwtToken(identityUser, userProfile);

            return Ok(new
            {
                Token = token,
                UserId = userProfile.Id,
                Role = userProfile.RoleType
            });
        }

        [HttpGet("me")]
        [Authorize] // <--- The Bouncer: No Token, No Entry.
        public async Task<IActionResult> GetMyProfile()
        {
            // 1. Read the "ProfileId" claim from the Token
            var profileIdClaim = User.Claims.FirstOrDefault(c => c.Type == "ProfileId");

            if (profileIdClaim == null)
                return Unauthorized();

            var profileId = int.Parse(profileIdClaim.Value);

            // 2. Fetch data from Business DB
            var userProfile = await _businessContext.UserProfiles
                .Include(u => u.UserMemberships) // Example of fetching related data
                .FirstOrDefaultAsync(u => u.Id == profileId);

            if (userProfile == null)
                return NotFound("Profile not found");

            return Ok(userProfile);
        }

        // Helper Method to generate JWT
        private string GenerateJwtToken(IdentityUser user, UserProfile profile)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("ProfileId", profile.Id.ToString()),
                new Claim(ClaimTypes.Role, profile.RoleType)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}