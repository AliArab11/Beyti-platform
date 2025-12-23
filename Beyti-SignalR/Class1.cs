using Microsoft.AspNetCore.SignalR;

namespace Beyti_SignalR
{
    public class NotificationHub : Hub
    {
        private static readonly Dictionary<int, List<string>> UserConnections = new();
        // Maps sellerId -> userId (who is currently managing this seller)
        private static readonly Dictionary<int, int> SellerManagers = new();
        private static readonly object _lock = new object();

        public async Task RegisterUser(int userId)
        {
            if (Context?.ConnectionId == null)
            {
                Console.WriteLine($"[SignalR] RegisterUser called with null Context for userId: {userId}");
                return;
            }

            Console.WriteLine($"[SignalR] RegisterUser: userId={userId}, connectionId={Context.ConnectionId}");

            lock (_lock)
            {
                if (!UserConnections.ContainsKey(userId))
                    UserConnections[userId] = new List<string>();

                if (!UserConnections[userId].Contains(Context.ConnectionId))
                {
                    UserConnections[userId].Add(Context.ConnectionId);
                    Console.WriteLine($"[SignalR] Added connection {Context.ConnectionId} to user_{userId} group");
                }
                else
                {
                    Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} already registered for user_{userId}");
                }
            }

            try
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
                Console.WriteLine($"[SignalR] Successfully added to SignalR group: user_{userId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR] Error adding to group for userId {userId}: {ex.Message}");
            }
        }

        // Register which user is currently managing a seller
        // When orders come in for this seller, they'll be sent to the managing user
        public Task RegisterSellerManager(int sellerId, int userId)
        {
            Console.WriteLine($"[SignalR] 🏪 RegisterSellerManager: Seller {sellerId} is being managed by User {userId}");

            lock (_lock)
            {
                SellerManagers[sellerId] = userId;
                Console.WriteLine($"[SignalR] ✅ Seller {sellerId} registered to User {userId}");
                Console.WriteLine($"[SignalR] 📊 Total seller managers registered: {SellerManagers.Count}");
            }

            return Task.CompletedTask;
        }

        // Get the user ID who is managing a specific seller
        public static int? GetSellerManager(int sellerId)
        {
            lock (_lock)
            {
                if (SellerManagers.TryGetValue(sellerId, out int userId))
                {
                    Console.WriteLine($"[SignalR] 🔍 Seller {sellerId} is managed by User {userId}");
                    return userId;
                }

                Console.WriteLine($"[SignalR] ⚠️ No manager found for Seller {sellerId}");
                return null;
            }
        }

        public async Task UnregisterUser(int userId)
        {
            if (Context?.ConnectionId == null)
            {
                Console.WriteLine($"[SignalR] UnregisterUser called with null Context for userId: {userId}");
                return;
            }

            lock (_lock)
            {
                if (UserConnections.ContainsKey(userId))
                    UserConnections[userId].Remove(Context.ConnectionId);
            }

            try
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR] Error removing from group for userId {userId}: {ex.Message}");
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                // Check if Context and ConnectionId are available
                if (Context == null || Context.ConnectionId == null)
                {
                    Console.WriteLine($"[SignalR] OnDisconnectedAsync: Context or ConnectionId is null");
                    await base.OnDisconnectedAsync(exception);
                    return;
                }

                // Thread-safe removal of connection from all user groups
                var connectionId = Context.ConnectionId;
                Console.WriteLine($"[SignalR] OnDisconnectedAsync: Removing connection {connectionId}");

                lock (_lock)
                {
                    // Find and remove the connection from UserConnections
                    // Can't modify dictionary while iterating, so collect keys first
                    var keysToCheck = UserConnections.Keys.ToList();

                    foreach (var userId in keysToCheck)
                    {
                        if (UserConnections.ContainsKey(userId) && UserConnections[userId] != null)
                        {
                            if (UserConnections[userId].Remove(connectionId))
                            {
                                Console.WriteLine($"[SignalR] Removed connection {connectionId} from user_{userId}");
                            }

                            // Clean up empty lists to prevent memory leaks
                            if (UserConnections[userId].Count == 0)
                            {
                                UserConnections.Remove(userId);
                                Console.WriteLine($"[SignalR] Removed empty user group for user_{userId}");
                            }
                        }
                    }
                }

                Console.WriteLine($"[SignalR] OnDisconnectedAsync: Successfully cleaned up connection {connectionId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR] Error in OnDisconnectedAsync: {ex.Message}");
                Console.WriteLine($"[SignalR] Stack trace: {ex.StackTrace}");
            }
            finally
            {
                await base.OnDisconnectedAsync(exception);
            }
        }

        // Helper method to send notification to specific user
        public async Task SendNotificationToUser(int userId, object notification)
        {
            Console.WriteLine($"[NotificationHub] 📤 SendNotificationToUser: userId={userId}");

            // Check if user has active connections
            lock (_lock)
            {
                if (UserConnections.ContainsKey(userId))
                {
                    Console.WriteLine($"[NotificationHub] ✅ User {userId} has {UserConnections[userId].Count} active connection(s)");
                }
                else
                {
                    Console.WriteLine($"[NotificationHub] ⚠️ WARNING: User {userId} has NO registered connections!");
                }
            }

            await Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification);
            Console.WriteLine($"[NotificationHub] ✅ Notification sent to user_{userId}");
        }

        // Helper method to send notification to multiple users
        public async Task SendNotificationToUsers(List<int> userIds, object notification)
        {
            var tasks = userIds.Select(userId =>
                Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notification)
            );
            await Task.WhenAll(tasks);
        }

        // Order-related methods
        public async Task SendOrderUpdate(int userId, object orderData)
        {
            Console.WriteLine($"[NotificationHub] 📤 SendOrderUpdate: userId={userId}");

            // Check if user has active connections
            lock (_lock)
            {
                if (UserConnections.ContainsKey(userId))
                {
                    Console.WriteLine($"[NotificationHub] ✅ User {userId} has {UserConnections[userId].Count} active connection(s)");
                    foreach (var connId in UserConnections[userId])
                    {
                        Console.WriteLine($"[NotificationHub]    - Connection: {connId}");
                    }
                }
                else
                {
                    Console.WriteLine($"[NotificationHub] ⚠️ WARNING: User {userId} has NO registered connections!");
                }
            }

            await Clients.Group($"user_{userId}").SendAsync("ReceiveOrderUpdate", orderData);
            Console.WriteLine($"[NotificationHub] ✅ Order update sent to user_{userId}");
        }

        public async Task SendOrderStatusChange(int userId, int orderId, string newStatus, object orderData)
        {
            await Clients.Group($"user_{userId}").SendAsync("ReceiveOrderStatusChange", new
            {
                orderId,
                newStatus,
                order = orderData
            });
        }

        // Booking-related methods
        public async Task SendBookingUpdate(int userId, object bookingData)
        {
            await Clients.Group($"user_{userId}").SendAsync("ReceiveBookingUpdate", bookingData);
        }

        public async Task SendBookingStatusChange(int userId, int bookingId, string newStatus, object bookingData)
        {
            Console.WriteLine($"[SignalR] SendBookingStatusChange: Sending to user_{userId}, bookingId={bookingId}, newStatus={newStatus}");

            // Check if user is registered
            lock (_lock)
            {
                if (UserConnections.ContainsKey(userId))
                {
                    Console.WriteLine($"[SignalR] User {userId} has {UserConnections[userId].Count} active connection(s)");
                }
                else
                {
                    Console.WriteLine($"[SignalR] WARNING: User {userId} has NO registered connections!");
                }
            }

            await Clients.Group($"user_{userId}").SendAsync("ReceiveBookingStatusChange", new
            {
                bookingId,
                newStatus,
                booking = bookingData
            });

            Console.WriteLine($"[SignalR] SendBookingStatusChange: Event sent to user_{userId}");
        }

        // Product-related methods
        public async Task SendProductUpdate(int userId, object productData)
        {
            await Clients.Group($"user_{userId}").SendAsync("ReceiveProductUpdate", productData);
        }

        // Category-related methods
        public async Task SendCategoryUpdate(string updateType, object categoryData)
        {
            // Broadcast to all admins and sellers
            await Clients.All.SendAsync("ReceiveCategoryUpdate", new
            {
                updateType,
                category = categoryData
            });
        }

        // Service-related methods
        public async Task SendServiceUpdate(int userId, object serviceData)
        {
            await Clients.Group($"user_{userId}").SendAsync("ReceiveServiceUpdate", serviceData);
        }

        // Announcement-related methods
        public async Task SendAnnouncement(List<int> userIds, object announcementData)
        {
            var tasks = userIds.Select(userId =>
                Clients.Group($"user_{userId}").SendAsync("ReceiveAnnouncement", announcementData)
            );
            await Task.WhenAll(tasks);
        }

        // Unread count update
        public async Task SendUnreadCountUpdate(int userId, int unreadCount)
        {
            await Clients.Group($"user_{userId}").SendAsync("ReceiveUnreadCountUpdate", unreadCount);
        }

        // Diagnostic: Get all registered users
        public static Dictionary<int, int> GetRegisteredUsers()
        {
            lock (_lock)
            {
                return UserConnections.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.Count
                );
            }
        }

        // Diagnostic: Log all registered users
        public static void LogRegisteredUsers()
        {
            lock (_lock)
            {
                Console.WriteLine($"[NotificationHub] 📊 Currently registered users: {UserConnections.Count}");
                foreach (var user in UserConnections)
                {
                    Console.WriteLine($"[NotificationHub]    - User {user.Key}: {user.Value.Count} connection(s)");
                }
            }
        }
    }
}