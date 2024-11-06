export class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  public on(event: string, callback: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  protected emit(event: string, data?: any): void {
    if (this.events[event]) {
      this.events[event].forEach((callback) => callback(data));
    }
  }
}
