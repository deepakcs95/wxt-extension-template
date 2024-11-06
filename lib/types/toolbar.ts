export interface ISuggestion {
  id: string;
  icon: string;
  text: string;
  description?: string;
  confidence: number;
  action?: () => Promise<void>;
}

export interface IToolbarConfig {
  width?: string;
  maxSuggestions?: number;
  showConfidenceIndicator?: boolean;
  showCustomizeButton?: boolean;
  theme?: "light" | "dark";
  textColor?: string;
}

export interface IToolbarAction {
  type: string;
  payload?: any;
}
