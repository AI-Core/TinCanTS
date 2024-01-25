import { Logger } from "./Logger";

interface AboutCfg {
  version?: string[];
}

export class About {
  version: string[] | null;
  private readonly LOG_SRC = "About";

  constructor(cfg?: AboutCfg) {
    this.log("constructor");
    this.version = null;
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: AboutCfg): void {
    this.log("init");

    if (cfg) {
      if (cfg.version !== undefined) {
        this.version = cfg.version;
      }
    }
  }

  static fromJSON(aboutJSON: AboutCfg): About {
    Logger.log("fromJSON", "About");
    const _about: AboutCfg = aboutJSON;
    const aboutInstance = new About(_about);
    aboutInstance.log("fromJSON");
    return aboutInstance;
  }
}
