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
            Console.WriteLine($"[SignalRService] 📡 SendProductCreatedAsync - SellerId: {sellerId}");

            // Broadcast to all clients so customers viewing the store can see updates
            await _hubContext.Clients.All
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductCreated",
                    sellerId = sellerId,
                    data = productData
                });

            Console.WriteLine($"[SignalRService] ✅ Product creation notification broadcasted to all clients");
        }

        public async Task SendProductUpdatedAsync(int sellerId, object productData)
        {
            Console.WriteLine($"[SignalRService] 📡 SendProductUpdatedAsync - SellerId: {sellerId}");

            // Broadcast to all clients so customers viewing the store can see updates
            await _hubContext.Clients.All
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductUpdated",
                    sellerId = sellerId,
                    data = productData
                });

            Console.WriteLine($"[SignalRService] ✅ Product update notification broadcasted to all clients");
        }

        public async Task SendProductStatusChangedAsync(int sellerId, int productId, string newStatus, object productData)
        {
            Console.WriteLine($"[SignalRService] 📡 SendProductStatusChangedAsync - SellerId: {sellerId}, ProductId: {productId}, NewStatus: {newStatus}");

            // Broadcast to all clients so customers viewing the store can see updates
            await _hubContext.Clients.All
                .SendAsync("ReceiveProductUpdate", new
                {
                    type = "ProductStatusChanged",
                    sellerId = sellerId,
                    productId,
                    newStatus,
                    data = productData
                });

            Console.WriteLine($"[SignalRService] ✅ Product status change notification broadcasted to all clients");
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
            Console.WriteLine($"[SignalRService] 📡 SendServiceCreatedAsync - ServiceProviderId: {serviceProviderId}");

            // Broadcast to all clients so customers viewing the provider's page can see updates
            await _hubContext.Clients.All
                .SendAsync("ReceiveServiceUpdate", new
                {
                    type = "ServiceCreated",
                    serviceProviderId = serviceProviderId,
                    data = serviceData
                });

            Console.WriteLine($"[SignalRService] ✅ Service creation notification broadcasted to all clients");
        }

        public async Task SendServiceUpdatedAsync(int serviceProviderId, object serviceData)
        {
            Console.WriteLine($"[SignalRService] 📡 SendServiceUpdatedAsync - ServiceProviderId: {serviceProviderId}");

            // Broadcast to all clients so customers viewing the provider's page can see updates
            await _hubContext.Clients.All
                .SendAsync("ReceiveServiceUpdate", new
                {
                    type = "ServiceUpdated",
                    serviceProviderId = serviceProviderId,
                    data = serviceData
                });

            Console.WriteLine($"[SignalRService] ✅ Service update notification broadcasted to all clients");
        }
    }
}
