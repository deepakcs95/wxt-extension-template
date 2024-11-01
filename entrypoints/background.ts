import { AuthMessage } from "./content";

export default defineBackground(() => {
  main();
  console.log("Hello background!", { id: browser.runtime.id });
});

function main() {
  chrome.runtime.onMessage.addListener(
    (
      message: AuthMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log("BACKGROUND RECIEVED A MESSAGE");

      switch (message.type) {
        case "AUTH_SUCCESS":
          handleAuthSuccess(message, sender);
          forwardMessage(message); // Forward to popup if additional handling needed

          break;
        case "AUTH_ERROR":
          handleAuthError(message, sender);
          forwardMessage(message);
          break;
        case "AUTH_LOGOUT":
          handleAuthLogout();
          forwardMessage(message);
          break;
      }
    }
  );

  async function handleAuthSuccess(
    message: AuthMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<void> {
    try {
      if (!message.token) {
        throw new Error("Invalid auth data received");
      }

      const token = message.token;

      await chrome.storage.sync.set({ token });
      console.log("token stored sucessfully ,", message);
    } catch (error) {
      console.error("Error handling auth success:", error);
    }
  }

  function handleAuthError(message: AuthMessage, sender: chrome.runtime.MessageSender) {
    console.error("Authentication error:", message.error);
  }

  async function handleAuthLogout() {
    try {
      await chrome.storage.sync.remove("token");
      console.log("User logged out, token removed");
    } catch (error) {
      console.log("Error handling logout:", error);
    }
  }

  function forwardMessage(message: AuthMessage) {
    chrome.runtime.sendMessage(message).catch((error) => console.log(error));
  }
}
