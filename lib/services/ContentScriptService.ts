import { Message } from "@/lib/types";
import { ALLOWED_ORIGINS } from "../constants";

export class ContentScriptService {
  private port: chrome.runtime.Port;

  constructor() {
    this.port = chrome.runtime.connect({ name: "content-script" });
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    window.addEventListener("message", (event) => {
      if (!this.isOriginAllowed(event.origin)) {
        console.warn("UNAUTHORIZED_ORIGIN", { origin: event.origin });
        return;
      }

      const message = event.data as Message;
      if (!message || !message.type) {
        return;
      }

      this.forwardToBackground(message);
    });
  }

  private isOriginAllowed(origin: string): boolean {
    return ALLOWED_ORIGINS.includes(origin);
  }

  private forwardToBackground(message: Message): void {
    try {
      this.port.postMessage({
        ...message,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn("MESSAGE_FORWARD_ERROR", { error });
      this.handleError("FORWARD_MESSAGE_FAILED");
    }
  }

  private handleError(errorMessage: string): void {
    const errorMsg: Message = {
      type: "AUTH_ERROR",
      error: errorMessage,
      timestamp: Date.now(),
    };
    this.port.postMessage(errorMsg);
  }
}
