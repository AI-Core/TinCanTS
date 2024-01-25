import { Logger } from './Logger';

interface InteractionComponentCfg {
  id?: string;
  description?: { [key: string]: string };
}

export class InteractionComponent {
  id: string | null = null;
  description: { [key: string]: string } | null = null;

  private LOG_SRC = "InteractionComponent";

  constructor(cfg?: InteractionComponentCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: InteractionComponentCfg): void {
    this.log("init");
  
    if (cfg) {
      if (cfg.id !== undefined) {
        this.id = cfg.id;
      }
      if (cfg.description !== undefined) {
        this.description = cfg.description;
      }
    }
  }

  asVersion(): InteractionComponentCfg {
    this.log("asVersion");
    const result: InteractionComponentCfg = {};

    if (this.id !== null) { // Non-null assertion if id is guaranteed to be non-null
      result.id = this.id;
    }
    if (this.description !== null) {
      result.description = this.description; // Ensuring that description is of type { [key: string]: string; }
    }

    return result;
  }

  static fromJSON(icJSON: string): InteractionComponent {
    Logger.log("fromJSON", "InteractionComponent");
    const _ic: InteractionComponentCfg = JSON.parse(icJSON);

    return new InteractionComponent(_ic);
  }
}
