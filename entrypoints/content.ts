import { Message } from "@/lib/types";

export default defineContentScript({
  matches: ["https://8cea-178-248-117-190.ngrok-free.app/*"],
  main() {
    console.log(" CONTENT LOADED");
    new ContentScriptMessageHandler();
  },
});

export interface AuthMessage {
  type: "AUTH_SUCCESS" | "AUTH_ERROR" | "AUTH_LOGOUT";
  token?: string;
  error?: string;
  userInfo?: Record<string, any>; // Allows for additional user information in future
}

const allowedOrigins = ["http://localhost:3000", "https://8cea-178-248-117-190.ngrok-free.app"];

class ContentScriptMessageHandler {
  private port: chrome.runtime.Port;

  constructor() {
    this.port = chrome.runtime.connect({ name: "content-script" });
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    // Only listen for messages from the webpage
    window.addEventListener("message", (event) => {
      if (!this.isOriginAllowed(event.origin)) {
        console.debug("Ignored message from unauthorized origin:", event.origin);
        return;
      }

      const message = event.data as Message;
      if (!message || !message.type) {
        return;
      }

      // Forward only to background, no need to send back to webpage
      this.forwardToBackground(message);
    });
  }

  private isOriginAllowed(origin: string): boolean {
    return allowedOrigins.includes(origin);
  }

  private forwardToBackground(message: Message): void {
    try {
      this.port.postMessage({
        ...message,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Failed to forward message to background:", error);
      this.handleError("Failed to forward message to extension");
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
