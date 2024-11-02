import { Message } from "@/lib/types";

export abstract class MessageService {
  protected ports: chrome.runtime.Port[] = [];

  protected removePort(port: chrome.runtime.Port): void {
    this.ports = this.ports.filter((p) => p !== port);
    console.warn("PORT_REMOVED", { activeConnections: this.ports.length });
  }

  protected isPortConnected(port: chrome.runtime.Port): boolean {
    try {
      return !("disconnected" in port) || !port.disconnected;
    } catch (error) {
      console.warn("PORT_CONNECTION_CHECK_ERROR", { error });
      return false;
    }
  }

  protected async broadcast(
    message: Message,
    senderPort: chrome.runtime.Port | null
  ): Promise<void> {
    console.warn("BROADCASTING_MESSAGE", { message });

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
          console.warn("MESSAGE_BROADCAST_ERROR", { error });
          this.removePort(port);
        }
      }
    }
  }
}
