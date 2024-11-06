import { ISuggestion, IToolbarConfig, IToolbarAction } from "../types/toolbar";
import { EventEmitter } from "../utils/EventEmitter";

export class SmartToolbar extends EventEmitter {
  private element: HTMLElement;
  private suggestions: ISuggestion[] = [];
  private config: IToolbarConfig;

  constructor(config: Partial<IToolbarConfig> = {}) {
    super();
    this.config = {
      width: "16rem",
      maxSuggestions: 5,
      showConfidenceIndicator: true,
      showCustomizeButton: true,
      theme: "dark",
      textColor: "#000000",
      ...config,
    };

    this.element = this.createToolbarElement();
    this.element.className = `copilot-toolbar theme-${this.config.theme}`;
    this.applyStyles(this.element);

    // Then render the content
    this.render();

    this.setupEventListeners();
  }

  /**
   * Updates the suggestions displayed in the toolbar
   */
  public updateSuggestions(suggestions: ISuggestion[]): void {
    this.suggestions = suggestions.slice(0, this.config.maxSuggestions);
    this.render();
  }

  /**
   * Shows the toolbar at the specified position
   */
  public show(rect: DOMRect): void {
    const toolbarLeft = rect.left + rect.width / 2;
    this.element.style.left = `${toolbarLeft + window.scrollX}px`;
    this.element.style.top = `${rect.bottom + window.scrollY + 10}px`;
    this.element.style.transform = "translateX(-50%)";

    document.body.appendChild(this.element);
    this.emit("show");
  }

  /**
   * Removes the toolbar from the DOM
   */
  public remove(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.emit("remove");
    }
  }

  /**
   * Updates toolbar configuration
   */
  public updateConfig(config: Partial<IToolbarConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
  }

  private createToolbarElement(): HTMLElement {
    this.element = document.createElement("div");
    this.element.className = `copilot-toolbar theme-${this.config.theme}`;
    this.applyStyles(this.element);
    this.render();
    return this.element;
  }

  private render(): void {
    this.element.innerHTML = `
      ${this.renderHeader()}
      ${this.renderSuggestionsContainer()}
      ${this.config.showCustomizeButton ? this.renderCustomizeButton() : ""}
    `;
  }

  private renderHeader(): string {
    return `
      <div class="toolbar-header">
        <span class="toolbar-title">Suggested Actions</span>
        <div class="toolbar-badges">
          <span class="badge-icon">🔒</span>
          <span class="badge-text">Local</span>
        </div>
      </div>
    `;
  }

  private renderSuggestionsContainer(): string {
    return `
      <div class="suggestions-container">
      
        ${this.suggestions.map((suggestion) => this.renderSuggestionButton(suggestion)).join("")}
      </div>
    `;
  }

  private renderSuggestionButton(suggestion: ISuggestion): string {
    return `
      <button 
        class="suggestion-button" 
        data-action="${suggestion.id}"
        title="${suggestion.description || suggestion.text}"
      >
        <span class="suggestion-icon">${suggestion.icon}</span>
        <span class="suggestion-text">${suggestion.text}</span>
        ${
          this.config.showConfidenceIndicator
            ? `<div class="confidence-indicator" style="background: rgba(59, 130, 246, ${suggestion.confidence});"></div>`
            : ""
        }
      </button>
    `;
  }

  private renderCustomizeButton(): string {
    return `
      <div class="customize-container">
        <button class="customize-button">
          Customize suggestions...
        </button>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Suggestion button clicks
    this.element.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest(".suggestion-button");
      if (button) {
        const actionId = button.getAttribute("data-action");
        this.emit("actionSelected", actionId);
      }
    });

    // Customize button clicks
    this.element.addEventListener("click", (e) => {
      const button = (e.target as HTMLElement).closest(".customize-button");
      if (button) {
        this.emit("customize");
        console.log("🎯 Customize button clicked!");
      }
    });

    // Hover effects
    this.element.addEventListener("mouseover", (e) => {
      const button = (e.target as HTMLElement).closest(".suggestion-button");
      if (button) {
        button.classList.add("hover");
      }
    });

    this.element.addEventListener("mouseout", (e) => {
      const button = (e.target as HTMLElement).closest(".suggestion-button");
      if (button) {
        button.classList.remove("hover");
      }
    });
  }

  private applyStyles(element: HTMLElement): void {
    Object.assign(element.style, {
      position: "absolute",
      zIndex: "10000",
      width: this.config.width,
      background: "white",
      borderRadius: "0.5rem",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      padding: "0.5rem",
    });
  }
}
