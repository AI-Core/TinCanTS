import { Logger } from "./Logger";

interface StateCfg {
  id?: string;
  contents?: string;
  etag?: string;
  contentType?: string;
}

export class State {
  id: string | null = null;
  updated: boolean = false;
  contents: string | null = null;
  etag: string | null = null;
  contentType: string | null = null;

  private readonly LOG_SRC = "State";

  constructor(cfg?: StateCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: StateCfg): void {
    this.log("init");

    cfg = cfg || {};

    // Verbose, but explicit for type checking
    if (cfg.id !== undefined) {
      this.id = cfg.id;
    }
    if (cfg.contents !== undefined) {
      this.contents = cfg.contents;
    }
    if (cfg.etag !== undefined) {
      this.etag = cfg.etag;
    }
    if (cfg.contentType !== undefined) {
      this.contentType = cfg.contentType;
    }

    // Default value set to false
    this.updated = false;
  }

  static fromJSON(stateJSON: string): State {
    Logger.log("fromJSON", "State");
    const _state: StateCfg = JSON.parse(stateJSON);
    return new State(_state);
  }
}