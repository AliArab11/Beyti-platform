using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using System.Security.Claims;

namespace Beyti_Backend.Authorization
{
    /// <summary>
    /// Authorization filter that checks if the user's account is suspended.
    /// Suspended users are blocked from accessing protected endpoints.
    /// </summary>
    public class NotSuspendedAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            // Get the user's profile ID from claims
            var profileIdClaim = context.HttpContext.User.FindFirst("ProfileId");

            if (profileIdClaim == null || !int.TryParse(profileIdClaim.Value, out int profileId))
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    error = "Unauthorized",
                    message = "User not authenticated"
                });
                return;
            }

            // Get the database context from services
            var dbContext = context.HttpContext.RequestServices.GetService<BeytiContext>();

            if (dbContext == null)
            {
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Check user's status in the database
            var userProfile = await dbContext.UserProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == profileId);

            if (userProfile == null)
            {
                context.Result = new NotFoundObjectResult(new
                {
                    error = "User not found",
                    message = "User profile does not exist"
                });
                return;
            }

            // Block access if user is suspended
            if (userProfile.Status == "Suspended")
            {
                context.Result = new ObjectResult(new
                {
                    error = "Account Suspended",
                    message = "Your account has been suspended. You cannot access this resource until your account is reactivated by an administrator.",
                    status = "Suspended",
                    isSuspended = true
                })
                {
                    StatusCode = 403 // Forbidden
                };
                return;
            }
        }
    }
}
