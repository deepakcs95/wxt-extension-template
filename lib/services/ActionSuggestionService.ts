import { Message } from "@/lib/types";

export interface ActionSuggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
}

export class ActionSuggestionService {
  private cache: Map<string, ActionSuggestion[]> = new Map();

  constructor() {
    // Initialize with basic actions
    this.registerDefaultActions();
  }

  private registerDefaultActions(): void {
    // Example default actions
    const defaultActions: ActionSuggestion[] = [
      {
        id: "search",
        title: "Search",
        description: "Search the selected text",
        action: () => {
          // Implementation
        },
      },
      {
        id: "copy",
        title: "Copy",
        description: "Copy to clipboard",
        action: () => {
          // Implementation
        },
      },
    ];

    this.cache.set("default", defaultActions);
  }

  public getSuggestions(text: string): ActionSuggestion[] {
    // For MVP, return default actions
    // Later, this can be enhanced with ML-based suggestions
    return this.cache.get("default") || [];
  }
}
