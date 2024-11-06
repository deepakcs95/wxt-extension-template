import { ALLOWED_ORIGINS } from "@/lib/constants";
import { AuthStatusResponseMessage, Message, User } from "@/lib/types";
import React, { useEffect, useState } from "react";

interface AuthState {
  isAuthenticated: boolean;
  userInfo: User | null;
  isLoading: boolean;
}

function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userInfo: null,
    isLoading: true,
  });

  const [port, setPort] = useState<chrome.runtime.Port | null>(null);

  useEffect(() => {
    // First try to get data from storage
    chrome.storage.local.get(["authState"], (result) => {
      if (result.authState) {
        setAuthState({
          ...result.authState,
          isLoading: false,
        });
      }
    });

    // Then connect to service worker for real-time updates
    const port = chrome.runtime.connect({ name: "popup" });
    setPort(port);

    port.onMessage.addListener((message: Message) => {
      handleMessage(message);
    });

    // Still request auth status to ensure we're in sync
    port.postMessage({ type: "GET_AUTH_STATUS" });

    return () => {
      port.disconnect();
    };
  }, []);

  const handleMessage = (message: Message) => {
    switch (message.type) {
      case "AUTH_STATUS_RESPONSE":
        const response = message as AuthStatusResponseMessage;
        const newState = {
          isAuthenticated: response.isAuthenticated,
          userInfo: response.user || null,
          isLoading: false,
        };
        setAuthState(newState);
        // Update storage
        chrome.storage.local.set({ authState: newState });
        break;
      case "AUTH_SUCCESS":
        const successState = {
          isAuthenticated: true,
          userInfo: message.user,
          isLoading: false,
        };
        setAuthState(successState);
        // Update storage
        chrome.storage.local.set({ authState: successState });
        break;
      case "AUTH_LOGOUT":
        const logoutState = {
          isAuthenticated: false,
          userInfo: null,
          isLoading: false,
        };
        setAuthState(logoutState);
        // Update storage
        chrome.storage.local.set({ authState: logoutState });
        break;
    }
  };

  const handleLogout = () => {
    if (port) {
      port.postMessage({ type: "AUTH_LOGOUT" });
    }
  };

  return { authState, handleLogout };
}

export default function Popup() {
  const { authState, handleLogout } = useAuth();

  const handleLogin = () => {
    if (!authState.isAuthenticated) {
      if (!import.meta.env.VITE_BACKEND_URL) {
        console.error("Environment variable VITE_BACKEND_URL is not defined");
        return;
      }
      console.log(import.meta.env.VITE_BACKEND_URL);
      chrome.tabs.create({ url: import.meta.env.VITE_BACKEND_URL + "/auth/sign-in" });
    }
  };

  if (authState.isLoading) {
    return (
      <div className="p-4 w-80 flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

      {authState.isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </button>
      )}
    </div>
  );
}
