import { Message } from "@/lib/types";
import { IBackgroundService, IMessageHandler } from "../interfaces/IBackgroundService";

export class BackgroundService implements IBackgroundService {
  private ports: chrome.runtime.Port[] = [];
  private messageHandlers: Map<string, IMessageHandler> = new Map();

  constructor() {
    this.initialize();
  }

  public initialize(): void {
    this.setupConnectionListener();
  }

  public registerHandler(handler: IMessageHandler): void {
    handler.getHandledMessageTypes().forEach((type) => {
      this.messageHandlers.set(type, handler);
    });
  }

  public broadcast(message: Message, senderPort?: chrome.runtime.Port): void {
    const connectedPorts = this.ports.filter((port) => this.isPortConnected(port));

    for (const port of connectedPorts) {
      if (port !== senderPort) {
        try {
          port.postMessage({
            ...message,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("BROADCAST_ERROR", { error });
          this.removePort(port);
        }
      }
    }
  }

  private setupConnectionListener(): void {
    chrome.runtime.onConnect.addListener((port) => {
      console.log("NEW_CONNECTION", { port: port.name });
      this.ports.push(port);

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });

      port.onMessage.addListener(async (message: Message) => {
        try {
          await this.routeMessage(message, port);
        } catch (error) {
          console.error("MESSAGE_HANDLING_ERROR", { error });
          this.removePort(port);
        }
      });
    });
  }

  private async routeMessage(message: Message, port: chrome.runtime.Port): Promise<void> {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler.handleMessage(message, port);
    } else {
      console.warn("NO_HANDLER_FOR_MESSAGE", { type: message.type });
    }
  }

  private removePort(port: chrome.runtime.Port): void {
    this.ports = this.ports.filter((p) => p !== port);
  }

  private isPortConnected(port: chrome.runtime.Port): boolean {
    try {
      return !("disconnected" in port) || !port.disconnected;
    } catch {
      return false;
    }
  }
}
