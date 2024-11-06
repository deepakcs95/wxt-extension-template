import { Message } from "@/lib/types";
import { StorageService } from "@/lib/storage";

export class AuthMessageService {
  private ports: chrome.runtime.Port[] = [];

  constructor() {
    this.setupConnectionListener();
    this.setupStorageListener();
  }

  private setupConnectionListener(): void {
    chrome.runtime.onConnect.addListener((port) => {
      console.log("🔗 NEW_CONNECTION", { url: port.sender?.url || "unknown" });
      this.ports.push(port);

      if (port.name === "popup") {
        this.sendCurrentState(port).catch((error) => {
          console.warn("🚨 INITIAL_STATE_SEND_ERROR", { error });
          this.removePort(port);
        });
      }

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });

      port.onMessage.addListener((message: Message) => {
        this.handleMessage(message, port).catch((error) => {
          console.log("🚨 MESSAGE_HANDLING_ERROR", { error });
          this.removePort(port);
        });
      });
    });
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.authState) {
        this.broadcastAuthState(null).catch((error) => {
          console.log("🚨 AUTH_STATE_BROADCAST_ERROR", { error });
        });
      }
    });
  }

  private async sendCurrentState(port: chrome.runtime.Port): Promise<void> {
    if (!this.isPortConnected(port)) {
      this.removePort(port);
      throw new Error("PORT_DISCONNECTED");
    }

    try {
      const state = await StorageService.getAuthState();
      console.log("🔄 SENDING_AUTH_STATUS", { state });

      port.postMessage({
        type: "AUTH_STATUS_RESPONSE",
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.log("🚨 CURRENT_STATE_SEND_ERROR", { error });
      this.removePort(port);
      throw error;
    }
  }

  private async broadcastAuthState(senderPort: chrome.runtime.Port | null): Promise<void> {
    try {
      const state = await StorageService.getAuthState();
      this.broadcast(
        {
          type: "AUTH_STATUS_RESPONSE",
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          from: "background",
          timestamp: Date.now(),
        },
        senderPort
      );
    } catch (error) {
      console.log("🚨 AUTH_STATE_BROADCAST_ERROR", { error });
    }
  }

  private async handleMessage(message: Message, senderPort: chrome.runtime.Port): Promise<void> {
    if (!this.isPortConnected(senderPort)) {
      this.removePort(senderPort);
      throw new Error("SENDER_PORT_DISCONNECTED");
    }

    switch (message.type) {
      case "GET_AUTH_STATUS":
        await this.sendCurrentState(senderPort);
        break;

      case "AUTH_SUCCESS":
        console.table({
          ...message,
          message: "🔽 AUTH_SUCCESS_RECEIVED",
        });
        await StorageService.setAuthState({
          token: message.token,
          user: message.user || null,
          isAuthenticated: true,
        });
        break;

      case "AUTH_LOGOUT":
        await StorageService.clearAuthState();
        console.log("🙋‍♂️ AUTH_LOGOUT_RECEIVED");
        break;

      default:
        console.warn("🚨 UNKNOWN_MESSAGE_TYPE", { message });
        break;
    }
  }

  private removePort(port: chrome.runtime.Port): void {
    this.ports = this.ports.filter((p) => p !== port);
  }

  private isPortConnected(port: chrome.runtime.Port): boolean {
    try {
      return !("disconnected" in port) || !port.disconnected;
    } catch (error) {
      console.log("🚨 PORT_CONNECTION_CHECK_ERROR", { error });
      return false;
    }
  }

  private broadcast(message: Message, senderPort: chrome.runtime.Port | null): void {
    const connectedPorts = this.ports.filter((port) => this.isPortConnected(port));

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
          console.log("🚨 MESSAGE_BROADCAST_ERROR", { error });
          this.removePort(port);
        }
      }
    }
  }
}
