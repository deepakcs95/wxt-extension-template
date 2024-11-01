export default defineContentScript({
  matches: ["*://967c-178-248-117-190.ngrok-free.app/*"],
  main() {
    console.log(" CONTENT LOADED");
    run();
  },
});

export interface AuthMessage {
  type: "AUTH_SUCCESS" | "AUTH_ERROR" | "AUTH_LOGOUT";
  token?: string;
  error?: string;
  userInfo?: Record<string, any>; // Allows for additional user information in future
}

const allowedOrigins = ["http://localhost:3000", "https://967c-178-248-117-190.ngrok-free.app"];

function isOriginAllowed(origin: string): boolean {
  return allowedOrigins.includes(origin);
}

function handleAuthMessage(message: AuthMessage) {
  if (message.token) {
    // Forward the token to the background script
    forwardMessage(message);
    console.log("Auth token forwarded to background script");
  } else {
    // Handle error if type is not AUTH_SUCCESS or token is missing
    handleAuthError("Invalid authentication message format");
  }
}

function forwardMessage(message: AuthMessage) {
  chrome.runtime.sendMessage(message).catch((error) => console.log(error));
}

function handleAuthError(errorMessage: string) {
  console.error("Error:", errorMessage);
  forwardMessage({
    type: "AUTH_ERROR",
    error: errorMessage,
  });
}

function run() {
  window.addEventListener("message", function (event) {
    // Security check: Verify the origin of the message

    if (!isOriginAllowed(event.origin)) {
      //  console.log("Received message from unauthorized origin:", event.origin);
      return;
    }

    const message = event.data as AuthMessage;
    console.log("message : ", message.type);

    switch (message.type) {
      case "AUTH_SUCCESS":
        handleAuthMessage(message);
        break;
      case "AUTH_ERROR":
        forwardMessage(message);
        break;
      case "AUTH_LOGOUT":
        forwardMessage(message);
        break;
    }
  });
}
