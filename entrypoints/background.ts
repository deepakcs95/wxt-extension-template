export default defineBackground(() => {
  main();
  console.log("Hello background!", { id: browser.runtime.id });
});
interface TokenData {
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface AuthMessage {
  type: string;
  token?: string;
  expiresIn?: number;
  timestamp?: number;
  error?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  error?: string;
  reason?: string;
}

function main() {
  chrome.runtime.onMessage.addListener(
    (
      message: AuthMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log(message);

      switch (message.type) {
        case "AUTH_SUCCESS":
          handleAuthSuccess(message, sender);
          break;
      }
    }
  );

  async function handleAuthSuccess(
    message: AuthMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    try {
      console.log(message);

      if (!message.token || !message.expiresIn) {
        throw new Error("Invalid auth data received");
      }

      const tokenData: TokenData = {
        token: message.token,
        // Store expiration in UTC
        expiresAt: new Date(Date.now() + message.expiresIn * 1000).toISOString(),
        // Store creation time in UTC
        createdAt: new Date().toISOString(),
      };
      console.log(tokenData);

      // Store the token
      await chrome.storage.sync.set({ tokenData });

      // Notify all extension pages (popup, options, etc.)
      const authState: AuthState = {
        isAuthenticated: true,
      };
    } catch (error) {
      console.error("Error handling auth success:", error);
    }
  }
}
