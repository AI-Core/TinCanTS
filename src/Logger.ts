export class Logger {
  static DEBUG: boolean = false;

  static enableDebug(): void {
    Logger.DEBUG = true;
  }

  static disableDebug(): void {
    Logger.DEBUG = false;
  }

  static log(msg: string, src?: string): void {
    if (Logger.DEBUG && console && console.log) {
      src = src || "General";
      console.log(`[${src}] ${msg}`);
    }
  }
}