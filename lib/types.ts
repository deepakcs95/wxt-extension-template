// Message Type Constants
export type AUTH_MESSAGE_TYPE =
  | "AUTH_SUCCESS"
  | "AUTH_ERROR"
  | "AUTH_LOGOUT"
  | "GET_AUTH_STATUS"
  | "AUTH_STATUS_RESPONSE";

export type TEXT_MESSAGE_TYPE = "TEXT_SELECTED" | "TEXT_COPIED";

export type ACTION_MESSAGE_TYPE =
  | "GET_SUGGESTIONS"
  | "SUGGESTIONS_READY"
  | "EXECUTE_ACTION"
  | "ACTION_EXECUTED"
  | "ACTION_ERROR";

export type MESSAGE_TYPE = AUTH_MESSAGE_TYPE | TEXT_MESSAGE_TYPE | ACTION_MESSAGE_TYPE;

export type MESSAGE_SOURCE =
  | "content-script"
  | "popup"
  | "background"
  | "options"
  | "chrome"
  | "auth-service"
  | "action-suggestion-service";

// Basic Types
export type User = {
  id: string;
  name: string;
  email: string;
};

export type Action = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  type: ActionType;
};

export type ActionType = "search" | "copy" | "translate" | "summarize" | "custom";

export type ActionContext = {
  text: string;
  url: string;
  timestamp: number;
  metadata?: Record<string, any>;
};

// Base Message Interface
export interface BaseMessage {
  type: MESSAGE_TYPE;
  from: MESSAGE_SOURCE;
  id?: string;
  timestamp: number;
}

// Auth Messages
export interface AuthSuccessMessage extends BaseMessage {
  type: "AUTH_SUCCESS";
  token: string;
  user: User;
}

export interface AuthErrorMessage extends BaseMessage {
  type: "AUTH_ERROR";
  error: string;
}

export interface AuthLogoutMessage extends BaseMessage {
  type: "AUTH_LOGOUT";
}

export interface GetAuthStatusMessage extends BaseMessage {
  type: "GET_AUTH_STATUS";
}

export interface AuthStatusResponseMessage extends BaseMessage {
  type: "AUTH_STATUS_RESPONSE";
  isAuthenticated: boolean;
  user: User | null;
}

// Text Selection Messages
export interface TextSelectedMessage extends BaseMessage {
  type: "TEXT_SELECTED";
  data: {
    text: string;
    url: string;
    timestamp: number;
  };
}

export interface TextCopiedMessage extends BaseMessage {
  type: "TEXT_COPIED";
  data: {
    text: string;
    url: string;
    timestamp: number;
  };
}

// Action Messages
export interface GetSuggestionsMessage extends BaseMessage {
  type: "GET_SUGGESTIONS";
  data: {
    text: string;
    context: ActionContext;
  };
}

export interface SuggestionsReadyMessage extends BaseMessage {
  type: "SUGGESTIONS_READY";
  data: {
    suggestions: Action[];
    context: ActionContext;
  };
}

export interface ExecuteActionMessage extends BaseMessage {
  type: "EXECUTE_ACTION";
  data: {
    actionId: string;
    context: ActionContext;
  };
}

export interface ActionExecutedMessage extends BaseMessage {
  type: "ACTION_EXECUTED";
  data: {
    actionId: string;
    result?: any;
  };
}

export interface ActionErrorMessage extends BaseMessage {
  type: "ACTION_ERROR";
  error: string;
  actionId?: string;
}

// Union Type for all Messages
export type Message =
  | AuthSuccessMessage
  | AuthErrorMessage
  | AuthLogoutMessage
  | GetAuthStatusMessage
  | AuthStatusResponseMessage
  | TextSelectedMessage
  | TextCopiedMessage
  | GetSuggestionsMessage
  | SuggestionsReadyMessage
  | ExecuteActionMessage
  | ActionExecutedMessage
  | ActionErrorMessage;

// Storage Types
export interface StorageState {
  auth?: AuthState;
  suggestions?: {
    [key: string]: Action[];
  };
  cache?: {
    [key: string]: any;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
