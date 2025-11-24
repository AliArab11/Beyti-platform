using Microsoft.AspNetCore.SignalR;

namespace Beyti_SignalR
{
    public class NotificationHub : Hub
    {
        private static readonly Dictionary<int, List<string>> UserConnections = new();

        public async Task RegisterUser(int userId)
        {
            if (!UserConnections.ContainsKey(userId))
                UserConnections[userId] = new List<string>();

            if (!UserConnections[userId].Contains(Context.ConnectionId))
                UserConnections[userId].Add(Context.ConnectionId);

            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task UnregisterUser(int userId)
        {
            if (UserConnections.ContainsKey(userId))
                UserConnections[userId].Remove(Context.ConnectionId);

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            foreach (var user in UserConnections)
            {
                user.Value.Remove(Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}