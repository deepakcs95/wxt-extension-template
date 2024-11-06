export type MessageType =
  | "AUTH_SUCCESS"
  | "AUTH_ERROR"
  | "AUTH_LOGOUT"
  | "GET_AUTH_STATUS"
  | "AUTH_STATUS_RESPONSE"
  | "TEXT_SELECTED";

export type User = {
  name: string;
  email: string;
};

export interface BaseMessage {
  type: MessageType;
  from: "content-script" | "popup" | "background" | "options" | "chrome";
  id?: string;
  timestamp?: number;
}

export interface AuthSuccessMessage extends BaseMessage {
  type: "AUTH_SUCCESS";
  token: string;
  user: User | null;
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

export interface TextSelectedMessage extends BaseMessage {
  type: "TEXT_SELECTED";
  data: {
    text: string;
    url: string;
    timestamp: number;
  };
}

export type Message =
  | AuthSuccessMessage
  | AuthErrorMessage
  | AuthLogoutMessage
  | GetAuthStatusMessage
  | AuthStatusResponseMessage
  | TextSelectedMessage;
