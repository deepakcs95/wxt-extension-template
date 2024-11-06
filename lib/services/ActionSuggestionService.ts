import { Message, Action, ActionContext, ExecuteActionMessage } from "../types";
import { IBackgroundService } from "../interfaces/IBackgroundService";

/**
 * Service responsible for managing and suggesting actions based on user text selections
 * and handling their execution.
 */
export class ActionSuggestionService {
  private messageTypes: Message["type"][] = ["TEXT_SELECTED", "EXECUTE_ACTION"];

  /**
   * Initializes the service and registers it with the background service
   * @param backgroundService - The background service instance to register with
   */
  constructor(private backgroundService: IBackgroundService) {
    this.backgroundService.registerHandler(this);
  }

  /**
   * Returns the message types that this service can handle
   * @returns Array of message types
   */
  public getHandledMessageTypes(): Message["type"][] {
    return this.messageTypes;
  }

  /**
   * Main message handler that routes different message types to their specific handlers
   * @param message - The incoming message to process
   * @param sender - The Chrome runtime port that sent the message
   */
  public async handleMessage(message: Message, sender: chrome.runtime.Port): Promise<void> {
    switch (message.type) {
      case "TEXT_SELECTED":
        await this.handleTextSelection(message.data, sender);
        break;
      case "EXECUTE_ACTION":
        await this.handleActionExecution(message as ExecuteActionMessage, sender);
        break;
    }
  }

  /**
   * Handles text selection events and generates appropriate action suggestions
   * @param data - The selected text data and metadata
   * @param sender - The Chrome runtime port to send responses to
   */
  private async handleTextSelection(data: any, sender: chrome.runtime.Port): Promise<void> {
    const context: ActionContext = {
      text: data.text,
      url: data.url,
      timestamp: data.timestamp,
    };

    console.log("HANDLING_TEXT_SELECTION", { data });

    const suggestions = await this.getSuggestions(data.text, context);

    sender.postMessage({
      type: "SUGGESTIONS_READY",
      data: {
        suggestions,
        context,
      },
      from: "action-suggestion-service",
      timestamp: Date.now(),
    });
  }

  /**
   * Handles action execution requests and sends success/error responses
   * @param data - The action execution data containing actionId and context
   * @param sender - The Chrome runtime port to send responses to
   */
  private async handleActionExecution(
    data: ExecuteActionMessage,
    sender: chrome.runtime.Port
  ): Promise<void> {
    try {
      await this.executeAction(data.data.actionId, data.data.context);
      sender.postMessage({
        type: "ACTION_EXECUTED",
        data: { actionId: data.data.actionId },
        from: "action-suggestion-service",
        timestamp: Date.now(),
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        error = new Error(String(error) || "Unknown error");
      }

      sender.postMessage({
        type: "ACTION_ERROR",
        error: (error as Error).message,
        from: "action-suggestion-service",
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Generates action suggestions based on the selected text and context
   * @param text - The selected text to generate suggestions for
   * @param context - The context in which the text was selected
   * @returns Array of suggested actions
   */
  public async getSuggestions(text: string, context: ActionContext): Promise<Action[]> {
    // Basic suggestions for MVP
    const suggestions: Action[] = [
      {
        id: "search",
        title: "Search Web",
        description: `Search for "${text.substring(0, 30)}..."`,
        icon: "search",
        type: "search",
      },
      {
        id: "summarize",
        title: "Summarize",
        description: "Get a quick summary",
        icon: "book",
        type: "summarize",
      },
    ];

    // Add contextual suggestions based on text content
    if (text.length > 100) {
      suggestions.push({
        id: "tldr",
        title: "TLDR",
        description: "Get key points",
        icon: "list",
        type: "summarize",
      });
    }

    return suggestions;
  }

  /**
   * Executes a specific action based on its ID and context
   * @param actionId - The unique identifier of the action to execute
   * @param context - The context in which to execute the action
   * @throws Error if the action ID is unknown
   */
  public async executeAction(actionId: string, context: ActionContext): Promise<void> {
    switch (actionId) {
      case "search":
        window.open(`https://www.google.com/search?q=${encodeURIComponent(context.text)}`);
        break;

      case "summarize":
        // Implement summarization logic
        break;

      default:
        throw new Error(`Unknown action: ${actionId}`);
    }
  }
}
