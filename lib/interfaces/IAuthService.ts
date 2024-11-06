import { User } from "../types";
import { IMessageHandler } from "./IBackgroundService";

export interface IAuthService extends IMessageHandler {
  getCurrentState(): Promise<AuthState>;
  login(credentials: AuthCredentials): Promise<void>;
  logout(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

export interface AuthCredentials {
  token: string;
  user: User | null;
}
