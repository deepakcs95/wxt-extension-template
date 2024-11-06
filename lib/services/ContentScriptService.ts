import { Message } from "@/lib/types";
import { ALLOWED_ORIGINS } from "../constants";
import { IContentScriptService } from "../interfaces/IContentScriptService";
import { Action, ActionContext } from "../interfaces/IActionSuggestionService";
import { createRoot } from "react-dom/client";
import React, { createElement } from "react";
import { SmartToolbar, ToolbarProps } from "../components/SmartToolbar.js";

export class ContentScriptService implements IContentScriptService {
  private port: chrome.runtime.Port;
  private lastSelection: string | null = null;
  private selectionTimeout: NodeJS.Timeout | null = null;
  private toolbar: React.FC<ToolbarProps> | null = null;
  private root: ReturnType<typeof createRoot> | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    this.port = chrome.runtime.connect({ name: "content-script" });
    this.initialize();
    this.setupMessageListener();
    this.initializeContainer();
  }

  public initialize(): void {
    this.setupSelectionListener();
    this.setupScrollListener();
    this.monitorClipboard();
  }

  private initializeContainer(): void {
    // Create container and root only once
    this.container = document.createElement("div");
    this.container.id = "copilot-toolbar-container";
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
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
    console.log("🎯 Showing toolbar for selection:", selection.toString(), this.root);

    if (!this.root || !this.container) {
      this.initializeContainer();
    }

    const props: ToolbarProps = {
      selection: window.getSelection() as Selection,
      onAction: () => {},
      onClose: this.removeToolbar,
    };

    this.root?.render(createElement(SmartToolbar, props));
  }

  public removeToolbar(): void {
    if (this.root) {
      this.root.render(null);
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

      if ((e.target as HTMLElement).closest(".copilot-toolbar")) {
        return;
      }

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text) {
        this.removeToolbar();
        return;
      }

      this.showToolbar(selection!);
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
    //   button.innerHTML = `
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
