import { EXTENSION_URL } from "@/lib/constants";

export default defineContentScript({
  matches: ["https://695c-178-248-117-190.ngrok-free.app/dashboard"],
  main() {
    console.log("Hello content.");
    run();
  },
});

interface AuthMessage {
  type: "AUTH_SUCCESS";
  token: string;
  timestamp?: number;
}

function run() {
  window.addEventListener("message", function (event) {
    // Security check: Verify the origin of the message
    console.warn("Received message from unauthorized origin:", event.data);
    // Replace with your actual domain
    const allowedOrigins = ["http://localhost:3000", EXTENSION_URL];

    if (!allowedOrigins.includes(event.origin)) {
      console.warn("Received message from unauthorized origin:", event.data);
      return;
    }
    try {
      const message = event.data as AuthMessage;

      // Check if it's our auth message
      if (message.type === "AUTH_SUCCESS" && message.token) {
        // Calculate token expiration (example: 1 hour)
        const expiresIn = 3600; // seconds

        // Send the token to the extension's background script
        chrome.runtime.sendMessage({
          type: "AUTH_SUCCESS",
          token: message.token,
          expiresIn: expiresIn,
          timestamp: message.timestamp || Date.now(),
        });

        console.log("Auth token forwarded to background script");

        // Optional: Show a notification
        chrome.runtime.sendMessage({
          type: "SHOW_NOTIFICATION",
          message: "Successfully authenticated!",
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);

      // Notify background script of error
      chrome.runtime.sendMessage({
        type: "AUTH_ERROR",
        error: "Failed to process authentication message",
      });
    }
  });
}
