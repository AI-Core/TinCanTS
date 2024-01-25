import { Logger } from "./Logger";

export interface ScoreCfg {
  scaled?: number | null;
  raw?: number | null;
  min?: number | null;
  max?: number | null;
}

export class Score {
  scaled: number | null = null;
  raw: number | null = null;
  min: number | null = null;
  max: number | null = null;

  private readonly LOG_SRC = "Score";

  constructor(cfg?: ScoreCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ScoreCfg): void {
    this.log("init");

    cfg = cfg || {};
    // Redundant, but we need to make it explicit for the type checker
    if (cfg.scaled !== undefined && cfg.scaled !== null) {
      this.scaled = cfg.scaled;
    } else if (cfg.raw !== undefined && cfg.raw !== null) {
      this.raw = cfg.raw;
    } else if (cfg.min !== undefined && cfg.min !== null) {
      this.min = cfg.min;
    } else if (cfg.max !== undefined && cfg.max !== null) {
      this.max = cfg.max;
    }
  }

  asVersion(): Partial<ScoreCfg> {
    this.log("asVersion");
    const result: Partial<ScoreCfg> = {};

    const optionalDirectProps: Array<keyof ScoreCfg> = ["scaled", "raw", "min", "max"];

    optionalDirectProps.forEach(prop => {
      if (this[prop] !== null) {
        result[prop] = this[prop];
      }
    });

    return result;
  }

  static fromJSON(scoreJSON: string): Score {
    Logger.log("fromJSON", "Score");
    const _score: ScoreCfg = JSON.parse(scoreJSON);

    return new Score(_score);
  }
}