import { Message } from "@/lib/types";
import { StorageService } from "@/lib/storage";
import { MessageService } from "./base/Messaging";

export class AuthMessageService extends MessageService {
  constructor() {
    super();
    this.setupConnectionListener();
    this.setupStorageListener();
  }

  private setupConnectionListener(): void {
    chrome.runtime.onConnect.addListener((port) => {
      console.warn("NEW_CONNECTION", { url: port.sender?.url || "unknown" });
      this.ports.push(port);

      if (port.name === "popup") {
        this.sendCurrentState(port).catch((error) => {
          console.warn("INITIAL_STATE_SEND_ERROR", { error });
          this.removePort(port);
        });
      }

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });

      port.onMessage.addListener((message: Message) => {
        this.handleMessage(message, port).catch((error) => {
          console.warn("MESSAGE_HANDLING_ERROR", { error });
          this.removePort(port);
        });
      });
    });
  }

  private setupStorageListener(): void {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.authState) {
        this.broadcastAuthState(null).catch((error) => {
          console.warn("AUTH_STATE_BROADCAST_ERROR", { error });
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
      console.warn("SENDING_AUTH_STATUS", { state });

      port.postMessage({
        type: "AUTH_STATUS_RESPONSE",
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("CURRENT_STATE_SEND_ERROR", { error });
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
      console.warn("AUTH_STATE_BROADCAST_ERROR", { error });
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
        console.warn("AUTH_SUCCESS_RECEIVED", { message });
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
}
