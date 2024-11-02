import { AuthStatusResponseMessage, Message, User } from "@/lib/types";
import React, { useEffect, useState } from "react";

interface AuthState {
  isAuthenticated: boolean;
  userInfo: User | null;
}

export default function Popup() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userInfo: null,
  });

  const [port, setPort] = useState<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popup" });
    setPort(port);

    port.onMessage.addListener((message: Message) => {
      handleMessage(message);
    });

    // Request initial auth status
    port.postMessage({ type: "GET_AUTH_STATUS" });

    return () => {
      port.disconnect();
    };
  }, []);

  const handleMessage = (message: Message) => {
    switch (message.type) {
      case "AUTH_STATUS_RESPONSE":
        const response = message as AuthStatusResponseMessage;
        console.log(message);

        setAuthState({
          isAuthenticated: response.isAuthenticated,
          userInfo: response.user || null,
        });
        break;
      case "AUTH_SUCCESS":
        setAuthState({
          isAuthenticated: true,
          userInfo: message.user,
        });
        break;
      case "AUTH_LOGOUT":
        setAuthState({
          isAuthenticated: false,
          userInfo: null,
        });
        break;
    }
  };

  const handleLogout = () => {
    if (port) {
      port.postMessage({ type: "AUTH_LOGOUT" });
    }
  };

  return (
    <div className="p-4 w-80">
      <h1 className="text-xl font-bold mb-4">Extension Status</h1>

      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              authState.isAuthenticated ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span>{authState.isAuthenticated ? "Authenticated" : "Not authenticated"}</span>
        </div>
      </div>

      {authState.isAuthenticated && authState.userInfo && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">User Info</h2>
          <div className="bg-gray-100 p-2 rounded">
            <p className="text-sm">
              <strong>Name:</strong> {authState.userInfo.name}
            </p>
            <p className="text-sm">
              <strong>Email:</strong> {authState.userInfo.email}
            </p>
          </div>
        </div>
      )}

      {authState.isAuthenticated && (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      )}
    </div>
  );
}
