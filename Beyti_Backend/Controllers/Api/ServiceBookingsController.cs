using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BeytiDB.Data;
using Beyti_Backend.Services;
 
namespace Beyti_Backend.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceBookingsController : ControllerBase
    {
        private readonly BeytiContext _context;
        private readonly INotificationService _notificationService;
        private readonly ISignalRService _signalRService;

        public ServiceBookingsController(BeytiContext context, INotificationService notificationService, ISignalRService signalRService)
        {
            _context = context;
            _notificationService = notificationService;
            _signalRService = signalRService;
        }

        // GET: api/ServiceBookings
        // Note: Bookings with active statuses will block the associated TimeSlot from being available
        // Active statuses (block availability): Pending, PendingQuote, DepositPending, Confirmed, InProgress
        // Final statuses (don't block availability): Completed, Canceled, Rejected
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetServiceBookings(
            [FromQuery] int? serviceProviderId = null,
            [FromQuery] int? customerId = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int? timeSlotId = null,
            [FromQuery] string? status = null)
        {
            var query = _context.ServiceBookings
                .Include(b => b.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(b => b.ServiceProvider)
                    .ThenInclude(sp => sp.UserProfile)
                .Include(b => b.ServiceCatalog)
                .Include(b => b.Service)
                .Include(b => b.ServiceAddress)
                .Include(b => b.TimeSlot)
                .AsQueryable();

            // Debug logging
            Console.WriteLine($"[ServiceBookings] Query params - ProviderId: {serviceProviderId}, CustomerId: {customerId}, Date: {date}, TimeSlotId: {timeSlotId}, Status: {status}");

            // Filter by service provider if specified
            if (serviceProviderId.HasValue)
            {
                query = query.Where(b => b.ServiceProviderId == serviceProviderId.Value);
            }

            // Filter by customer if specified
            if (customerId.HasValue)
            {
                query = query.Where(b => b.CustomerId == customerId.Value);
            }

            // Filter by date if specified (compare only the date part)
            if (date.HasValue)
            {
                var dateOnly = date.Value.Date;
                Console.WriteLine($"[ServiceBookings] Filtering by date: {dateOnly}");
                query = query.Where(b => b.BookingDateTime.Date == dateOnly);
            }

            // Filter by time slot if specified
            if (timeSlotId.HasValue)
            {
                query = query.Where(b => b.TimeSlotId == timeSlotId.Value);
            }

            // Filter by status if specified
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(b => b.Status == status);
            }

            var results = await query
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.Id,
                    b.CustomerId,
                    b.ServiceProviderId,
                    b.ServiceCatalogId,
                    b.ServiceId,
                    b.ServiceAddressId,
                    b.TimeSlotId,
                    b.BookingDateTime,
                    serviceDate = b.BookingDateTime.Date,
                    serviceTime = b.TimeSlot != null ? b.TimeSlot.StartTime.ToString(@"hh\:mm") : null,
                    b.Status,
                    b.ServiceType,
                    b.QuotedPrice,
                    b.FinalPrice,
                    b.PaymentType,
                    b.Notes,
                    b.CanceledBy,
                    b.CancellationReason,
                    b.CancellationFee,
                    b.CreatedAt,
                    b.UpdatedAt,
                    // Provider info
                    providerName = b.ServiceProvider.UserProfile.DisplayName,
                    businessName = b.ServiceProvider.BusinessName,
                    // Service info - use Service table if available, otherwise fall back to ServiceCatalog
                    serviceName = b.Service != null ? b.Service.Name : b.ServiceCatalog.Name,
                    serviceDescription = b.Service != null ? b.Service.Description : null,
                    serviceCategoryName = b.ServiceCatalog.Name,
                    // Customer info
                    customerName = b.Customer.UserProfile.DisplayName,
                    // Address info
                    serviceAddress = b.ServiceAddress != null ? new
                    {
                        b.ServiceAddress.Id,
                        b.ServiceAddress.Street,
                        b.ServiceAddress.City,
                        b.ServiceAddress.Region,
                        b.ServiceAddress.PostalCode,
                        b.ServiceAddress.Country
                    } : null
                })
                .ToListAsync();

            var count = results.Count;
            Console.WriteLine($"[ServiceBookings] Found {count} bookings");
            return Ok(results);
        }

        // GET: api/ServiceBookings/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ServiceBooking>> GetServiceBooking(int id)
        {
            var serviceBooking = await _context.ServiceBookings.FindAsync(id);

            if (serviceBooking == null)
            {
                return NotFound();
            }

            return serviceBooking;
        }

        // PUT: api/ServiceBookings/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServiceBooking(int id, ServiceBooking serviceBooking)
        {
            if (id != serviceBooking.Id)
            {
                return BadRequest();
            }

            // Get the old booking to track status changes
            var oldBooking = await _context.ServiceBookings
                .Include(b => b.Customer)
                    .ThenInclude(c => c.UserProfile)
                .Include(b => b.ServiceProvider)
                    .ThenInclude(sp => sp.UserProfile)
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id);

            // Update timestamp
            serviceBooking.UpdatedAt = DateTime.Now;

            _context.Entry(serviceBooking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                // Update TimeSlot IsActive based on booking status
                await UpdateTimeSlotAvailability(serviceBooking.TimeSlotId, serviceBooking.Status);

                // Send real-time status change if status changed
                Console.WriteLine($"[ServiceBookings] Checking status change - oldBooking: {oldBooking != null}, statusChanged: {oldBooking?.Status != serviceBooking.Status}");

                if (oldBooking != null && oldBooking.Status != serviceBooking.Status &&
                    oldBooking.Customer?.UserProfile != null && oldBooking.ServiceProvider?.UserProfile != null)
                {
                    var customerUserProfileId = oldBooking.Customer.UserProfile.Id;
                    var providerUserProfileId = oldBooking.ServiceProvider.UserProfile.Id;

                    Console.WriteLine($"[ServiceBookings] Sending status change - CustomerUserProfileId: {customerUserProfileId}, ProviderUserProfileId: {providerUserProfileId}, BookingId: {serviceBooking.Id}, NewStatus: {serviceBooking.Status}");

                    // Fetch the complete updated booking with all related data to send to clients
                    // This structure MUST match the GET endpoint to ensure UI consistency
                    var updatedBooking = await _context.ServiceBookings
                        .Include(b => b.Customer)
                            .ThenInclude(c => c.UserProfile)
                        .Include(b => b.ServiceProvider)
                            .ThenInclude(sp => sp.UserProfile)
                        .Include(b => b.ServiceCatalog)
                        .Include(b => b.Service)
                        .Include(b => b.ServiceAddress)
                        .Include(b => b.TimeSlot)
                        .Where(b => b.Id == serviceBooking.Id)
                        .Select(b => new
                        {
                            b.Id,
                            b.CustomerId,
                            b.ServiceProviderId,
                            b.ServiceCatalogId,
                            b.ServiceId,
                            b.ServiceAddressId,
                            b.TimeSlotId,
                            b.BookingDateTime,
                            serviceDate = b.BookingDateTime.Date,
                            serviceTime = b.TimeSlot != null ? b.TimeSlot.StartTime.ToString(@"hh\:mm") : null,
                            b.Status,
                            b.ServiceType,
                            b.QuotedPrice,
                            b.FinalPrice,
                            b.PaymentType,
                            b.Notes,
                            b.CanceledBy,
                            b.CancellationReason,
                            b.CancellationFee,
                            b.CreatedAt,
                            b.UpdatedAt,
                            // Provider info
                            providerName = b.ServiceProvider.UserProfile.DisplayName,
                            businessName = b.ServiceProvider.BusinessName,
                            // Service info - use Service table if available, otherwise fall back to ServiceCatalog
                            serviceName = b.Service != null ? b.Service.Name : b.ServiceCatalog.Name,
                            serviceDescription = b.Service != null ? b.Service.Description : null,
                            serviceCategoryName = b.ServiceCatalog.Name,
                            // Customer info
                            customerName = b.Customer.UserProfile.DisplayName,
                            // Address info
                            serviceAddress = b.ServiceAddress != null ? new
                            {
                                b.ServiceAddress.Id,
                                b.ServiceAddress.Street,
                                b.ServiceAddress.City,
                                b.ServiceAddress.Region,
                                b.ServiceAddress.PostalCode,
                                b.ServiceAddress.Country
                            } : null
                        })
                        .FirstOrDefaultAsync();

                    await _signalRService.SendBookingStatusChangedAsync(
                        customerId: customerUserProfileId,
                        serviceProviderId: providerUserProfileId,
                        bookingId: serviceBooking.Id,
                        newStatus: serviceBooking.Status,
                        bookingData: updatedBooking
                    );
                }
                else
                {
                    Console.WriteLine($"[ServiceBookings] Status change NOT sent - Reasons:");
                    if (oldBooking == null) Console.WriteLine("  - oldBooking is null");
                    if (oldBooking?.Status == serviceBooking.Status) Console.WriteLine($"  - Status unchanged: {oldBooking?.Status}");
                    if (oldBooking?.Customer?.UserProfile == null) Console.WriteLine("  - Customer.UserProfile is null");
                    if (oldBooking?.ServiceProvider?.UserProfile == null) Console.WriteLine("  - ServiceProvider.UserProfile is null");
                }
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServiceBookingExists(id))
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

        // POST: api/ServiceBookings
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ServiceBooking>> PostServiceBooking(ServiceBooking serviceBooking)
        {
            // Set timestamps FIRST
            serviceBooking.CreatedAt = DateTime.Now;
            serviceBooking.UpdatedAt = DateTime.Now;

            // Debug logging for timezone verification
            Console.WriteLine($"[ServiceBooking] Received BookingDateTime: {serviceBooking.BookingDateTime}");
            Console.WriteLine($"[ServiceBooking] DateTime.Now: {DateTime.Now}");
            Console.WriteLine($"[ServiceBooking] BookingDateTime Kind: {serviceBooking.BookingDateTime.Kind}");

            // Remove navigation properties from ModelState BEFORE any validation
            ModelState.Remove("serviceBooking.Customer");
            ModelState.Remove("serviceBooking.ServiceAddress");
            ModelState.Remove("serviceBooking.ServiceCatalog");
            ModelState.Remove("serviceBooking.ServiceProvider");
            ModelState.Remove("serviceBooking.Service");
            ModelState.Remove("serviceBooking.TimeSlot");
            ModelState.Remove("serviceBooking.Payments");
            ModelState.Remove("serviceBooking.ServiceReviews");

            // Validate model state
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _context.ServiceBookings.Add(serviceBooking);
                await _context.SaveChangesAsync();

                // Update TimeSlot IsActive based on booking status
                await UpdateTimeSlotAvailability(serviceBooking.TimeSlotId, serviceBooking.Status);

                // Send notification to service provider about new booking
                var customer = await _context.Customers
                    .Include(c => c.UserProfile)
                    .FirstOrDefaultAsync(c => c.Id == serviceBooking.CustomerId);

                var serviceProvider = await _context.ServiceProviders
                    .Include(sp => sp.UserProfile)
                    .FirstOrDefaultAsync(sp => sp.Id == serviceBooking.ServiceProviderId);

                var serviceCatalog = await _context.ServiceCatalogs
                    .FirstOrDefaultAsync(sc => sc.Id == serviceBooking.ServiceCatalogId);

                if (serviceProvider?.UserProfile != null && customer?.UserProfile != null)
                {
                    var customerName = customer.UserProfile.DisplayName ?? "A customer";
                    var serviceName = serviceCatalog?.Name ?? "a service";
                    var bookingDate = serviceBooking.BookingDateTime.ToString("MMM dd, yyyy") ?? "a scheduled date";

                    var notificationMessage = $"New booking request #{serviceBooking.Id} from {customerName} for {serviceName} on {bookingDate}. Please review and respond.";

                    await _notificationService.SendNotificationAsync(
                        recipientUserId: serviceProvider.UserProfile.Id,
                        senderUserId: customer.UserProfile.Id,
                        type: "NewBooking",
                        title: "New Service Booking",
                        body: notificationMessage,
                        relatedEntityType: "ServiceBooking",
                        relatedEntityId: serviceBooking.Id
                    );

                    // Send real-time booking update via SignalR
                    await _signalRService.SendBookingCreatedAsync(
                        customerId: customer.UserProfile.Id,
                        serviceProviderId: serviceProvider.UserProfile.Id,
                        bookingData: new
                        {
                            id = serviceBooking.Id,
                            customerId = serviceBooking.CustomerId,
                            serviceProviderId = serviceBooking.ServiceProviderId,
                            serviceCatalogId = serviceBooking.ServiceCatalogId,
                            status = serviceBooking.Status,
                            bookingDateTime = serviceBooking.BookingDateTime,
                            quotedPrice = serviceBooking.QuotedPrice,
                            createdAt = serviceBooking.CreatedAt
                        }
                    );
                }

                return CreatedAtAction("GetServiceBooking", new { id = serviceBooking.Id }, serviceBooking);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message, innerError = ex.InnerException?.Message });
            }
        }

        // DELETE: api/ServiceBookings/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServiceBooking(int id)
        {
            var serviceBooking = await _context.ServiceBookings.FindAsync(id);
            if (serviceBooking == null)
            {
                return NotFound();
            }

            var timeSlotId = serviceBooking.TimeSlotId;

            _context.ServiceBookings.Remove(serviceBooking);
            await _context.SaveChangesAsync();

            // When a booking is deleted, re-evaluate the TimeSlot availability
            if (timeSlotId.HasValue)
            {
                await UpdateTimeSlotAvailability(timeSlotId, null);
            }

            return NoContent();
        }

        private bool ServiceBookingExists(int id)
        {
            return _context.ServiceBookings.Any(e => e.Id == id);
        }

        /// <summary>
        /// Updates the TimeSlot IsActive status based on associated ServiceBooking statuses.
        /// TimeSlot.IsActive = false when there's an active booking (Pending, Confirmed, InProgress)
        /// TimeSlot.IsActive = true when there are no active bookings
        /// </summary>
        private async Task UpdateTimeSlotAvailability(int? timeSlotId, string? currentStatus)
        {
            if (!timeSlotId.HasValue)
            {
                return;
            }

            var timeSlot = await _context.TimeSlots.FindAsync(timeSlotId.Value);
            if (timeSlot == null)
            {
                return;
            }

            // Define active statuses that should block the time slot
            var activeStatuses = new[] { "Pending", "Confirmed", "InProgress" };

            // Check if there are any active bookings for this time slot
            var hasActiveBooking = await _context.ServiceBookings
                .AnyAsync(b => b.TimeSlotId == timeSlotId.Value &&
                              activeStatuses.Contains(b.Status));

            // Update IsActive: false if there's an active booking, true otherwise
            timeSlot.IsActive = !hasActiveBooking;

            await _context.SaveChangesAsync();
        }
    }
}
