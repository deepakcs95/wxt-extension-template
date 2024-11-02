import { StorageService } from "@/lib/storage";
import { Message } from "@/lib/types";

export default defineBackground(() => {
  new MessageBroker();
  console.log("Hello background!", { id: browser.runtime.id });
});

class MessageBroker {
  private ports: chrome.runtime.Port[] = [];

  constructor() {
    this.setupConnectionListener();
    this.setupStorageListener();
  }

  private setupConnectionListener(): void {
    chrome.runtime.onConnect.addListener((port) => {
      console.log(`New connection from ${port.sender?.url || "unknown"}`);
      this.ports.push(port);

      // Send current state to newly connected popup
      if (port.name === "popup") {
        this.sendCurrentState(port).catch((error) => {
          // console.log("Failed to send initial state:", error);
          this.removePort(port);
        });
      }

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });

      port.onMessage.addListener((message: Message) => {
        this.handleMessage(message, port).catch((error) => {
          this.removePort(port);
        });
      });
    });
  }

  private removePort(port: chrome.runtime.Port): void {
    this.ports = this.ports.filter((p) => p !== port);
    console.log(`Port removed. Active connections: ${this.ports.length}`);
  }

  private isPortConnected(port: chrome.runtime.Port): boolean {
    try {
      // Chrome sets port.disconnected when the port is no longer valid
      return !("disconnected" in port) || !port.disconnected;
    } catch (error) {
      // console.log("Error checking port connection:", error);
      return false;
    }
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.authState) {
        this.broadcastAuthState(null).catch((error) => {
          // console.log("Failed to broadcast auth state:", error);
        });
      }
    });
  }

  private async sendCurrentState(port: chrome.runtime.Port): Promise<void> {
    if (!this.isPortConnected(port)) {
      this.removePort(port);
      throw new Error("Port is disconnected");
    }

    try {
      const state = await StorageService.getAuthState();
      console.log("AUTH_STATUS_RESPONSE", state);

      port.postMessage({
        type: "AUTH_STATUS_RESPONSE",
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        timestamp: Date.now(),
      });
    } catch (error) {
      // console.log("Error sending current state:", error);
      this.removePort(port);
      throw error;
    }
  }

  private async broadcastAuthState(senderPort: chrome.runtime.Port | null): Promise<void> {
    try {
      const state = await StorageService.getAuthState();
      await this.broadcast(
        {
          type: "AUTH_STATUS_RESPONSE",
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          timestamp: Date.now(),
        },
        senderPort
      );
    } catch (error) {
      console.log("Error broadcating auth state ", error);
    }
  }

  private async handleMessage(message: Message, senderPort: chrome.runtime.Port): Promise<void> {
    if (!this.isPortConnected(senderPort)) {
      this.removePort(senderPort);
      throw new Error("Sender port is disconnected");
    }

    switch (message.type) {
      case "GET_AUTH_STATUS":
        await this.sendCurrentState(senderPort);
        break;

      case "AUTH_SUCCESS":
        console.log("AUTH_SUCCESS ", message);

        await StorageService.setAuthState({
          token: message.token,
          user: message.user || null,
          isAuthenticated: true,
        });
        break;

      case "AUTH_LOGOUT":
        await StorageService.clearAuthState();
        break;
    }
  }

  private async broadcast(message: Message, senderPort: chrome.runtime.Port | null): Promise<void> {
    console.log("Broadcasting message:", message);

    const connectedPorts = this.ports.filter((port) => this.isPortConnected(port));

    // Update ports list if any were disconnected
    if (connectedPorts.length !== this.ports.length) {
      this.ports = connectedPorts;
    }

    for (const port of connectedPorts) {
      if (port !== senderPort) {
        try {
          port.postMessage({
            ...message,
            timestamp: Date.now(),
          });
        } catch (error) {
          // console.log(`Failed to send message to port:`, error);
          this.removePort(port);
        }
      }
    }
  }
}
