import { ISuggestion, IToolbarConfig, IToolbarAction } from "../types/toolbar";
import { EventEmitter } from "../utils/EventEmitter";

export class SmartToolbar extends EventEmitter {
  private element: HTMLElement;
  private suggestions: ISuggestion[] = [];
  private config: IToolbarConfig;
  private style: string = `
  
  :root {
  --primary-color: #646cff;
  --background-color: #ffffff;
  --text-color: #213547;
  --border-color: #e5e7eb;
  --hover-color: #f3f4f6;
  --success-color: #10b981;
  --error-color: #ef4444;
}

.suggestions-panel {
  font-family: Inter, system-ui, sans-serif;
  width: 320px;
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}

.status-on {
  background-color: var(--success-color);
}

.status-off {
  background-color: var(--error-color);
}

.llm-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--background-color);
  color: var(--text-color);
  font-size: 0.875rem;
  width: 100%;
  margin: 16px;
  max-width: calc(100% - 32px);
  cursor: pointer;
}

.llm-select:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.suggestions-list {
  padding: 8px 0;
}

.suggestion-item {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: var(--hover-color);
}

.suggestion-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.suggestion-text {
  color: var(--text-color);
  font-size: 0.875rem;
}

.confidence-indicator {
  margin-left: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.confidence-high {
  background-color: #10b981;
}

.confidence-medium {
  background-color: #f59e0b;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.customize-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.customize-link:hover {
  text-decoration: underline;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #1a1a1a;
    --text-color: rgba(255, 255, 255, 0.87);
    --border-color: #2d2d2d;
    --hover-color: #2d2d2d;
  }
}
  `;

  constructor(config: Partial<IToolbarConfig> = {}) {
    super();
    this.config = {
      width: "",
      maxSuggestions: 5,
      showConfidenceIndicator: true,
      showCustomizeButton: true,
      theme: "dark",
      textColor: "#000000",
      ...config,
    };

    this.element = this.createToolbarElement();
    // this.element.className = `copilot-toolbar theme-${this.config.theme}`;
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
    // this.element.className = `copilot-toolbar theme-${this.config.theme}`;
    this.applyStyles(this.element);
    this.render();
    return this.element;
  }

  private render(): void {
    // this.element.innerHTML = `
    //   ${this.renderHeader()}
    //   ${this.renderSuggestionsContainer()}
    //   ${this.config.showCustomizeButton ? this.renderCustomizeButton() : ""}
    // `;

    this.element.innerHTML = `<div class="suggestions-panel">
        <label class="panel-header">
            <div class="header-content">
                <h3 class="header-title">Turn off for this site</h3>
                <input type="checkbox" id="siteToggle" checked style="display: none;">
                <span class="status-indicator status-on"></span>
            </div>
        </label>

        <select class="llm-select" id="llmSelect">
            <option value="">Select LLM</option>
            <option value="ask-chatgpt">Ask ChatGPT</option>
            <option value="ask-claude">Ask Claude</option>
            <option value="ask-bard">Ask Bard</option>
            <option value="ask-llama">Ask Llama</option>
        </select>

        <div class="suggestions-list">
            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 15a9 9 0 019-9m0 0a9 9 0 019 9m-9-9v6m0 0l-3-3m3 3l3-3"/>
                </svg>
                <span class="suggestion-text">Summarize Text</span>
                <span class="confidence-indicator confidence-high"></span>
            </div>

            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span class="suggestion-text">Add to Calendar</span>
                <span class="confidence-indicator confidence-high"></span>
            </div>

            <div class="suggestion-item">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20"/>
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
                <span class="suggestion-text">Translate</span>
                <span class="confidence-indicator confidence-medium"></span>
            </div>
        </div>

        <div class="panel-footer">
            <a href="#" class="customize-link">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Customize suggestions...
            </a>
        </div>
    </div>
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

    const styleElement = document.createElement("style");
    styleElement.innerHTML = this.style;
    document.head.appendChild(styleElement);
  }
}
