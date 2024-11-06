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

      if (!message || !message.type || !message.from) {
        return;
      }
      console.log("🔽 MESSAGE_RECEIVED", message.type);

      this.forwardToBackground(message);
    });
  }

  private isOriginAllowed(origin: string): boolean {
    const normalizedOrigin = origin.replace(/\/$/, "");

    return ALLOWED_ORIGINS.some((allowedOrigin) => {
      // Convert wildcard pattern to regex
      const pattern = allowedOrigin
        .replace(/\./g, "\\.") // Escape dots
        .replace(/\*$/, "[0-9]*") // Convert * at the end to match port numbers
        .replace(/\*/g, ".*"); // Convert remaining * to .*
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(normalizedOrigin);
    });
  }

  private forwardToBackground(message: Message): void {
    try {
      this.port.postMessage({
        ...message,
        timestamp: Date.now(),
        from: "content-script",
      });

      console.log("➡️ MESSAGE_FORWARDED", message.type);
    } catch (error) {
      console.warn("MESSAGE_FORWARD_ERROR", { error });
      this.handleError("FORWARD_MESSAGE_FAILED");
    }
  }

  private handleError(errorMessage: string): void {
    const errorMsg: Message = {
      type: "AUTH_ERROR",
      error: errorMessage,
      from: "content-script",
      timestamp: Date.now(),
    };
    this.port.postMessage(errorMsg);
  }
}
