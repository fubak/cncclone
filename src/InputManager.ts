// (window as any).VERBOSE_LOGGING = false;

export class InputManager {
  private listeners: { [key: string]: ((event: Event) => void)[] } = {};

  constructor() {
    window.addEventListener('keydown', (event) => this.trigger('keydown', event));
    window.addEventListener('mousemove', (event) => this.trigger('mousemove', event));
    window.addEventListener('mousedown', (event) => this.trigger('mousedown', event));
  }

  on(event: string, callback: (event: Event) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private trigger(event: string, data: Event): void {
    if ((window as any).VERBOSE_LOGGING) console.log('InputManager trigger:', event, data);
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
} 