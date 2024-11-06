import { Message } from "../types";

export interface IBackgroundService {
  initialize(): void;
  registerHandler(handler: IMessageHandler): void;
  broadcast(message: Message, sender?: chrome.runtime.Port): void;
}

export interface IMessageHandler {
  handleMessage(message: Message, sender: chrome.runtime.Port): Promise<void>;
  getHandledMessageTypes(): string[];
}
