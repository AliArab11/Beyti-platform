import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
  }

  async startConnection(customerId) {
    console.log('🔌 SignalR startConnection called with customerId:', customerId);
    
    if (this.connection) {
      console.log('⚠️ Connection already exists, skipping');
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7062/orderHub", {
        withCredentials: false
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.onreconnecting(() => {
      console.log('🔄 SignalR Reconnecting...');
    });

    this.connection.onreconnected(() => {
      console.log('✅ SignalR Reconnected');
      // Rejoin group after reconnection
      if (customerId) {
        this.connection.invoke("JoinCustomerGroup", customerId)
          .then(() => console.log(`✅ Rejoined Customer_${customerId} group after reconnect`))
          .catch(err => console.error('❌ Error rejoining group:', err));
      }
    });

    this.connection.onclose(() => {
      console.log('❌ SignalR Connection Closed');
    });

    try {
      await this.connection.start();
      console.log("✅ SignalR Connected - Connection ID:", this.connection.connectionId);
      
      if (customerId) {
        await this.connection.invoke("JoinCustomerGroup", customerId);
        console.log(`✅ Joined Customer_${customerId} group`);
      } else {
        console.warn('⚠️ No customerId provided, cannot join group');
      }
    } catch (err) {
      console.error("❌ SignalR Connection Error:", err);
      throw err;
    }
  }

  async joinCustomerGroup(customerId) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinCustomerGroup', customerId);
        console.log(`✅ SignalR: Joined Customer_${customerId} group`);
      } catch (error) {
        console.error('❌ Error joining customer group:', error);
      }
    }
  }

  async leaveCustomerGroup(customerId) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveCustomerGroup', customerId);
        console.log(`✅ SignalR: Left Customer_${customerId} group`);
      } catch (error) {
        console.error('❌ Error leaving customer group:', error);
      }
    }
  }

  onOrderStatusChanged(callback) {
    console.log('📡 Setting up OrderStatusChanged listener');
    if (this.connection) {
      this.connection.on("OrderStatusChanged", (data) => {
        console.log('🔔 OrderStatusChanged event received:', data);
        callback(data);
      });
    } else {
      console.error('❌ Cannot set up listener - no connection');
    }
  }

  async stopConnection() {
    if (this.connection) {
      console.log('🔌 Stopping SignalR connection');
      await this.connection.stop();
      this.connection = null;
      console.log("✅ SignalR Disconnected");
    }
  }
}

export default new SignalRService();