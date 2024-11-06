import { IMessageHandler } from "./IBackgroundService";

export interface IActionSuggestionService extends IMessageHandler {
  getSuggestions(text: string, context: ActionContext): Promise<Action[]>;
  executeAction(actionId: string, context: ActionContext): Promise<void>;
}

export interface Action {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type: ActionType;
}

export interface ActionContext {
  text: string;
  url: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export type ActionType = "search" | "copy" | "translate" | "summarize" | "custom";
