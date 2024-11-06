import { Message } from "@/lib/types";
import { ALLOWED_ORIGINS } from "../constants";
import { IContentScriptService } from "../interfaces/IContentScriptService";

export class ContentScriptService implements IContentScriptService {
  private port: chrome.runtime.Port;
  private lastSelection: string | null = null;
  private selectionTimeout: NodeJS.Timeout | null = null;
  private toolbar: HTMLElement | null = null;

  constructor() {
    this.port = chrome.runtime.connect({ name: "content-script" });
    this.initialize();
  }

  public initialize(): void {
    this.setupMessageListener();
    this.setupSelectionListener();
    this.monitorClipboard();
  }

  public handleTextSelection(): void {
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection()?.toString().trim();

      if (selection && selection !== this.lastSelection && selection.length > 3) {
        this.lastSelection = selection;
        this.showToolbar(selection);
        this.sendToBackgroundService(selection);
      } else if (!selection) {
        this.removeToolbar();
      }
    }, 500);
  }

  public monitorClipboard(): void {
    document.addEventListener("copy", (event) => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
        // Handle clipboard content

        this.sendToBackgroundService(selection);
      }
    });
  }

  public setupMessageListener(): void {
    window.addEventListener("message", (event) => {
      if (!this.isOriginAllowed(event.origin)) {
        console.warn("UNAUTHORIZED_ORIGIN", { origin: event.origin });
        return;
      }

      const message = event.data as Message;
      if (!message || !message.type || !message.from) return;

      console.log("🔽 MESSAGE_RECEIVED", message.type);
      this.handleMessage(message);
    });
  }

  public showToolbar(selection: string): void {
    this.removeToolbar(); // Remove existing toolbar if any

    this.toolbar = document.createElement("div");
    this.toolbar.className = "copilot-toolbar";
    Object.assign(this.toolbar.style, {
      position: "absolute",
      zIndex: "10000",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    });

    const askButton = document.createElement("button");
    askButton.textContent = "Ask ChatGPT";
    askButton.onclick = () => this.sendToBackgroundService(selection);
    this.toolbar.appendChild(askButton);

    // Position toolbar near selection
    const range = window.getSelection()?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (rect) {
      this.toolbar.style.left = `${rect.left + window.scrollX}px`;
      this.toolbar.style.top = `${rect.bottom + window.scrollY + 10}px`;
    }

    document.body.appendChild(this.toolbar);
  }

  public sendToBackgroundService(text: string): void {
    try {
      this.port.postMessage({
        type: "TEXT_SELECTED",
        data: {
          text,
          url: window.location.href,
          timestamp: Date.now(),
        },
        from: "content-script",
        timestamp: Date.now(),
      });

      console.log("➡️ MESSAGE_FORWARDED", "TEXT_SELECTED");
    } catch (error) {
      console.warn("MESSAGE_FORWARD_ERROR", { error });
      this.handleError("FORWARD_MESSAGE_FAILED");
    }
  }

  public removeToolbar(): void {
    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
      this.toolbar = null;
    }
  }

  private setupSelectionListener(): void {
    document.addEventListener("selectionchange", () => {
      this.handleTextSelection();
    });
  }

  private handleMessage(message: Message): void {
    switch (message.type) {
      case "AUTH_SUCCESS":
        // Handle authentication success
        break;
      case "AUTH_ERROR":
        this.handleError(message.error || "Unknown error");
        break;
      // Add more message handlers as needed
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

  private isOriginAllowed(origin: string): boolean {
    const normalizedOrigin = origin.replace(/\/$/, "");
    return ALLOWED_ORIGINS.some((allowedOrigin) => {
      const pattern = allowedOrigin
        .replace(/\./g, "\\.")
        .replace(/\*$/, "[0-9]*")
        .replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(normalizedOrigin);
    });
  }
}
