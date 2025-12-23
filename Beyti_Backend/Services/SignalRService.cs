using Microsoft.AspNetCore.SignalR;
using Beyti_SignalR;

namespace Beyti_Backend.Services
{
    public interface ISignalRService
    {
        // Order methods
        Task SendOrderCreatedAsync(int customerId, int sellerId, object orderData);
        Task SendOrderStatusChangedAsync(int customerId, int? sellerId, int? driverId, int orderId, string newStatus, object orderData);
        Task SendOrderAssignedToDriverAsync(int driverId, int orderId, object orderData);

        // Booking methods
        Task SendBookingCreatedAsync(int customerId, int serviceProviderId, object bookingData);
        Task SendBookingStatusChangedAsync(int customerId, int serviceProviderId, int bookingId, string newStatus, object bookingData);
        Task SendQuoteSubmittedAsync(int customerId, int bookingId, object bookingData);

        // Product methods
        Task SendProductCreatedAsync(int sellerId, object productData);
        Task SendProductUpdatedAsync(int sellerId, object productData);
        Task SendProductStatusChangedAsync(int sellerId, int productId, string newStatus, object productData);

        // Category methods
        Task SendCategoryUpdatedAsync(string updateType, object categoryData);

        // Service methods
        Task SendServiceCreatedAsync(int serviceProviderId, object serviceData);
        Task SendServiceUpdatedAsync(int serviceProviderId, object serviceData);
    }

    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        // ==================== ORDER METHODS ====================

        public async Task SendOrderCreatedAsync(int customerId, int sellerId, object orderData)
        {
            Console.WriteLine($"[SignalRService] 📡 SendOrderCreatedAsync called");
            Console.WriteLine($"[SignalRService] 👤 CustomerId: {customerId}, SellerId: {sellerId}");

            // Log all registered users for debugging
            NotificationHub.LogRegisteredUsers();

            // Notify customer
            Console.WriteLine($"[SignalRService] 📤 Sending OrderCreated to customer group: user_{customerId}");
            await _hubContext.Clients.Group($"user_{customerId}")
                .SendAsync("ReceiveOrderUpdate", new
                {
                    type = "OrderCreated",
                    data = orderData
                });

            // Notify seller
            Console.WriteLine($"[SignalRService] 📤 Sending OrderReceived to seller group: user_{sellerId}");
            await _hubContext.Clients.Group($"user_{sellerId}")
                .SendAsync("ReceiveOrderUpdate", new
                {
                    type = "OrderReceived",
                    data = orderData
                });

            Console.WriteLine($"[SignalRService] ✅ Order notifications sent successfully");
        }

        public async Task SendOrderStatusChangedAsync(int customerId, int? sellerId, int? driverId, int orderId, string newStatus, object orderData)
        {
            var statusChangeData = new
            {
                orderId,
                newStatus,
                order = orderData
            };

            // Always notify customer
            await _hubContext.Clients.Group($"user_{customerId}")
                .SendAsync("ReceiveOrderStatusChange", statusChangeData);

            // Notify seller if present
            if (sellerId.HasValue)
            {
                await _hubContext.Clients.Group($"user_{sellerId.Value}")
                    .SendAsync("ReceiveOrderStatusChange", statusChangeData);
            }

            // Notify driver if present
            if (driverId.HasValue)
            {
                await _hubContext.Clients.Group($"user_{driverId.Value}")
                    .SendAsync("ReceiveOrderStatusChange", statusChangeData);
            }
        }

        public async Task SendOrderAssignedToDriverAsync(int driverId, int orderId, object orderData)
        {
            await _hubContext.Clients.Group($"user_{driverId}")
                .SendAsync("ReceiveOrderUpdate", new
                {
                    type = "OrderAssigned",
                    orderId,
                    data = orderData
                });
        }

        // ==================== BOOKING METHODS ====================

        public async Task SendBookingCreatedAsync(int customerId, int serviceProviderId, object bookingData)
        {
            // Notify customer
            await _hubContext.Clients.Group($"user_{customerId}")
                .SendAsync("ReceiveBookingUpdate", new
                {
                    type = "BookingCreated",
                    data = bookingData
                });

            // Notify service provider
            await _hubContext.Clients.Group($"user_{serviceProviderId}")
                .SendAsync("ReceiveBookingUpdate", new
                {
                    type = "BookingReceived",
                    data = bookingData
                });
        }

        public async Task SendBookingStatusChangedAsync(int customerId, int serviceProviderId, int bookingId, string newStatus, object bookingData)
        {
            var statusChangeData = new
            {
                bookingId,
                newStatus,
                booking = bookingData
            };

            // Notify customer
            await _hubContext.Clients.Group($"user_{customerId}")
                .SendAsync("ReceiveBookingStatusChange", statusChangeData);

            // Notify service provider
            await _hubContext.Clients.Group($"user_{serviceProviderId}")
                .SendAsync("ReceiveBookingStatusChange", statusChangeData);
        }

        public async Task SendQuoteSubmittedAsync(int customerId, int bookingId, object bookingData)
        {
            await _hubContext.Clients.Group($"user_{customerId}")
                .SendAsync("ReceiveBookingUpdate", new
                {
                    type = "QuoteSubmitted",
                    bookingId,
                    data = bookingData
                });
        }

        // ==================== PRODUCT METHODS ====================

        public async Task SendProductCreatedAsync(int sellerId, object productData)
        {
            await _hubContext.Clients.Group($"user_{sellerId}")
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductCreated",
                    data = productData
                });
        }

        public async Task SendProductUpdatedAsync(int sellerId, object productData)
        {
            await _hubContext.Clients.Group($"user_{sellerId}")
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductUpdated",
                    data = productData
                });
        }

        public async Task SendProductStatusChangedAsync(int sellerId, int productId, string newStatus, object productData)
        {
            await _hubContext.Clients.Group($"user_{sellerId}")
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductStatusChanged",
                    productId,
                    newStatus,
                    data = productData
                });
        }

        // ==================== CATEGORY METHODS ====================

        public async Task SendCategoryUpdatedAsync(string updateType, object categoryData)
        {
            // Broadcast to all connected clients (admins and sellers will see category updates)
            await _hubContext.Clients.All
                .SendAsync("ReceiveCategoryUpdate", new
                {
                    updateType,
                    category = categoryData
                });
        }

        // ==================== SERVICE METHODS ====================

        public async Task SendServiceCreatedAsync(int serviceProviderId, object serviceData)
        {
            await _hubContext.Clients.Group($"user_{serviceProviderId}")
                .SendAsync("ReceiveServiceUpdate", new
                {
                    type = "ServiceCreated",
                    data = serviceData
                });
        }

        public async Task SendServiceUpdatedAsync(int serviceProviderId, object serviceData)
        {
            await _hubContext.Clients.Group($"user_{serviceProviderId}")
                .SendAsync("ReceiveServiceUpdate", new
                {
                    type = "ServiceUpdated",
                    data = serviceData
                });
        }
    }
}
