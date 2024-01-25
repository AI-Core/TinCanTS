import { Logger } from "./Logger";
import { Score, ScoreCfg } from "./Score";

export interface ResultCfg {
  score?: ScoreCfg | null;
  success?: boolean | null;
  completion?: boolean | null;
  duration?: string | null;
  response?: string | null;
  extensions?: { [key: string]: any } | null;
}

export class Result {
  score: Score | null = null;
  success: boolean | null = null;
  completion: boolean | null = null;
  duration: string | null = null;
  response: string | null = null;
  extensions: { [key: string]: any } | null = null;

  private readonly LOG_SRC = "Result";

  constructor(cfg?: ResultCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ResultCfg): void {
    this.log("init");

    cfg = cfg || {};

    if (cfg.score !== undefined && cfg.score !== null) {
      this.score = cfg.score instanceof Score ? cfg.score : new Score(cfg.score);
    }

    if (cfg.completion !== undefined && cfg.completion !== null) {
      this.completion = cfg.completion;
    }
    if (cfg.duration !== undefined && cfg.duration !== null) {
      this.duration = cfg.duration;
    }
    if (cfg.extensions !== undefined && cfg.extensions !== null) {
      this.extensions = cfg.extensions;
    }
    if (cfg.response !== undefined && cfg.response !== null) {
      this.response = cfg.response;
    }
    if (cfg.success !== undefined && cfg.success !== null) {
      this.success = cfg.success;
    }

    // Handle completion property specifically for older versions
    // Commented out because it's not needed for xAPI 1.0.3
    // if (this.completion === "Completed") {
    //   this.completion = true;
    // }
  }

  asVersion(): ResultCfg {
    this.log("asVersion");
    const result: Partial<ResultCfg> = this;

    if (this.score !== null) {
      result.score = this.score.asVersion();
    }

    return result as ResultCfg;
  }

  static fromJSON(resultJSON: string): Result {
    Logger.log("fromJSON", "Result");
    const _result: ResultCfg = JSON.parse(resultJSON);
    return new Result(_result);
  }
}