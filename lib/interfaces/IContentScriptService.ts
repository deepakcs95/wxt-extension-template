export interface IContentScriptService {
  initialize(): void;
  handleTextSelection(): void;
  monitorClipboard(): void;
  setupMessageListener(): void;
  showToolbar(selection: Selection): void;
  sendToBackgroundService(text: string): void;
  removeToolbar(): void;
}
