import { Message } from "@/lib/types";
import { ALLOWED_ORIGINS } from "../constants";
import { IContentScriptService } from "../interfaces/IContentScriptService";
import { Action, ActionContext } from "../interfaces/IActionSuggestionService";
import { createRoot } from "react-dom/client";
import { SmartToolbar } from "../components/SmartToolbar";
export class ContentScriptService implements IContentScriptService {
  private port: chrome.runtime.Port;
  private lastSelection: string | null = null;
  private selectionTimeout: NodeJS.Timeout | null = null;
  private toolbar: SmartToolbar | null = null;

  constructor() {
    this.port = chrome.runtime.connect({ name: "content-script" });
    this.initialize();
    this.setupMessageListener();
    // this.initializeContainer();
  }

  public initialize(): void {
    this.setupSelectionListener();
    this.setupScrollListener();
    this.monitorClipboard();
  }

  public handleTextSelection(): void {
    this.removeToolbar();

    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const selectionText = selection?.toString().trim();
      if (selectionText && selectionText !== this.lastSelection && selectionText.length > 3) {
        this.lastSelection = selectionText;
        this.showToolbar(selection!);

        this.sendToBackgroundService(selectionText);
      } else if (!selection) {
        this.removeToolbar();
      }
    }, 300);
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
        // console.warn("UNAUTHORIZED_ORIGIN", { origin: event.origin });
        return;
      }

      const message = event.data as Message;
      if (!message || !message.type || !message.from) return;

      console.log("🔽 MESSAGE_RECEIVED", message.type);
      this.handleMessage(message);
    });
  }

  public showToolbar(selection: Selection): void {
    this.removeToolbar();

    this.toolbar = new SmartToolbar();
    const range = window.getSelection()?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      this.toolbar.show(rect);
    }
  }

  public removeToolbar(): void {
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
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

      console.log("➡️ MESSAGE_FORWARDED", text);
    } catch (error) {
      console.warn("MESSAGE_FORWARD_ERROR", { error });
      this.handleError("FORWARD_MESSAGE_FAILED");
    }
  }

  private setupSelectionListener(): void {
    document.addEventListener("mouseup", (e) => {
      // Check if the click is inside the toolbar
      if (this.toolbar && (e.target as HTMLElement).closest(".copilot-toolbar")) {
        return; // Don't process selection changes if clicking inside toolbar
      }

      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }

      this.selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();

        const selectionText = selection ? selection.toString().trim() : null;

        if (!selectionText || selectionText.length <= 3) {
          // Only remove toolbar if click was outside toolbar
          if (!this.toolbar || !(e.target as HTMLElement).closest(".copilot-toolbar")) {
            this.removeToolbar();
          }
          return;
        }

        if (selection !== this.lastSelection) {
          this.lastSelection = selectionText;
          this.showToolbar(selection!);
          this.sendToBackgroundService(selectionText!);
        }
      }, 300);
    });
  }

  private handleMessage(message: Message): void {
    switch (message.type) {
      case "SUGGESTIONS_READY":
        this.handleSuggestions(message.data.suggestions, message.data.context);
        break;

      case "ACTION_EXECUTED":
        this.handleActionExecuted(message.data.actionId);
        break;

      case "ACTION_ERROR":
        this.handleError(message.error);
        break;

      case "AUTH_SUCCESS":
        // Handle authentication success
        break;
      case "AUTH_ERROR":
        this.handleError(message.error || "Unknown error");
        break;
      // Add more message handlers as needed
    }
  }

  private handleSuggestions(suggestions: Action[], context: ActionContext): void {
    // Update toolbar with suggestions
    this.updateToolbarWithSuggestions(suggestions);
  }

  private updateToolbarWithSuggestions(suggestions: Action[]): void {
    // // Add suggestion buttons
    // suggestions.forEach((suggestion) => {
    //   const button = document.createElement("button");
    //   button.className = "suggestion-button";
    //   button.innerHTML = `;
    //     <span class="icon">${suggestion.icon}</span>
    //     <span class="title">${suggestion.title}</span>
    //   `;
    //   button.onclick = () => this.executeAction(suggestion.id);
    //   this.toolbar?.updateSuggestions([button]);
    // });
  }

  private executeAction(actionId: string): void {
    this.port.postMessage({
      type: "EXECUTE_ACTION",
      data: {
        actionId,
        context: {
          text: this.lastSelection,
          url: window.location.href,
          timestamp: Date.now(),
        },
      },
      from: "content-script",
      timestamp: Date.now(),
    });
  }

  private handleActionExecuted(actionId: string): void {
    console.log(`Action executed: ${actionId}`);
    this.sendToBackgroundService(window.getSelection()?.toString() || "");

    // Optionally remove toolbar or show success message
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

  private setupScrollListener(): void {
    window.addEventListener("scroll", () => this.removeToolbar(), {
      capture: true,
      passive: true,
    });
  }
}
