import { Message } from "@/lib/types";
import { IAuthService, AuthState, AuthCredentials } from "../interfaces/IAuthService";
import { StorageService } from "@/lib/storage";
import { IBackgroundService } from "../interfaces/IBackgroundService";

export class AuthService implements IAuthService {
  private readonly messageTypes = ["GET_AUTH_STATUS", "AUTH_SUCCESS", "AUTH_LOGOUT"];

  constructor(private backgroundService: IBackgroundService) {
    this.backgroundService.registerHandler(this);
  }

  public getHandledMessageTypes(): string[] {
    return this.messageTypes;
  }

  public async handleMessage(message: Message, sender: chrome.runtime.Port): Promise<void> {
    console.log("🔵 AUTH_SERVICE: handleMessage", message);
    switch (message.type) {
      case "GET_AUTH_STATUS":
        const state = await this.getCurrentState();
        sender.postMessage({
          type: "AUTH_STATUS_RESPONSE",
          ...state,
          timestamp: Date.now(),
        });
        break;

      case "AUTH_SUCCESS":
        await this.login({
          token: message.token,
          user: message.user,
        });
        break;

      case "AUTH_LOGOUT":
        await this.logout();
        break;
    }
  }

  public async getCurrentState(): Promise<AuthState> {
    return await StorageService.getAuthState();
  }

  public async login(credentials: AuthCredentials): Promise<void> {
    await StorageService.setAuthState({
      token: credentials.token,
      user: credentials.user || null,
      isAuthenticated: true,
    });

    this.backgroundService.broadcast({
      type: "AUTH_STATUS_RESPONSE",
      isAuthenticated: true,
      user: credentials.user,
      from: "background",
      timestamp: Date.now(),
    });
  }

  public async logout(): Promise<void> {
    await StorageService.clearAuthState();

    this.backgroundService.broadcast({
      type: "AUTH_STATUS_RESPONSE",
      isAuthenticated: false,
      user: null,
      from: "background",
      timestamp: Date.now(),
    });
  }

  public async isAuthenticated(): Promise<boolean> {
    const state = await this.getCurrentState();
    return state.isAuthenticated;
  }
}
