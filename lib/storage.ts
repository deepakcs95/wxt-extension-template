import { AuthState } from "./interfaces/IAuthService";
import { User } from "./types";

export const StorageKeys = {
  AUTH_STATE: "authState",
} as const;

export const StorageService = {
  async getAuthState(): Promise<AuthState> {
    const result = await chrome.storage.local.get(StorageKeys.AUTH_STATE);
    return (
      result[StorageKeys.AUTH_STATE] ?? {
        token: null,
        user: null,
        isAuthenticated: false,
      }
    );
  },

  async setAuthState(state: AuthState): Promise<void> {
    await chrome.storage.local.set({
      [StorageKeys.AUTH_STATE]: state,
    });
  },

  async clearAuthState(): Promise<void> {
    await chrome.storage.local.remove(StorageKeys.AUTH_STATE);
  },
};
