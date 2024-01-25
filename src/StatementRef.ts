import { Logger } from "./Logger";

export interface StatementRefCfg {
  id?: string;
  objectType?: string;
}

export class StatementRef {
  id: string | null = null;
  objectType: string = "StatementRef";
  private readonly LOG_SRC = "StatementRef";

  constructor(cfg?: StatementRefCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: StatementRefCfg): void {
    this.log("init");
    if (cfg?.id !== undefined && cfg.id !== null) {
      this.id = cfg.id;
    }
  }

  toString(): string {
    this.log("toString");
    return this.id ? this.id : "";
  }

  asVersion(version: string = "1.0.3"): { objectType: string; id: string | null } {
    this.log("asVersion");
    const result = {
      objectType: this.objectType,
      id: this.id
    };

    if (version === "0.9") {
      result.objectType = "Statement";
    }

    return result;
  }

  static fromJSON(stRefJSON: string): StatementRef {
    Logger.log("fromJSON", "StatementRef");
    const _stRef: StatementRefCfg = JSON.parse(stRefJSON);
    return new StatementRef(_stRef);
  }
}