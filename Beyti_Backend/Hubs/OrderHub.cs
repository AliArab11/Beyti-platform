using Microsoft.AspNetCore.SignalR;
using Microsoft.DotNet.Scaffolding.Shared.CodeModifier.CodeChange;

namespace Beyti_Backend.Hubs;

public class OrderHub : Hub
{
    // Method to join seller-specific group
    public async Task JoinSellerGroup(int sellerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Seller_{sellerId}");
    }

    // Method to leave seller group
    public async Task LeaveSellerGroup(int sellerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Seller_{sellerId}");
    }

    // Customer group methods
    public async Task JoinCustomerGroup(int customerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Customer_{customerId}");
        Console.WriteLine($"✅ Connection {Context.ConnectionId} joined Customer_{customerId}");
    }

    public async Task LeaveCustomerGroup(int customerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Customer_{customerId}");
        Console.WriteLine($"👋 Connection {Context.ConnectionId} left Customer_{customerId}");
    }

    // Driver group methods
    public async Task JoinDriverGroup(int driverId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Driver_{driverId}");
        Console.WriteLine($"✅ Connection {Context.ConnectionId} joined Driver_{driverId}");
    }

    public async Task LeaveDriverGroup(int driverId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Driver_{driverId}");
        Console.WriteLine($"👋 Connection {Context.ConnectionId} left Driver_{driverId}");
    }
}