export interface IContentScriptService {
  initialize(): void;
  handleTextSelection(): void;
  monitorClipboard(): void;
  setupMessageListener(): void;
  showToolbar(selection: string): void;
  sendToBackgroundService(text: string): void;
  removeToolbar(): void;
}
