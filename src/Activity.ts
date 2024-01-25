import { Logger } from "./Logger";
import { ActivityDefinition } from "./ActivityDefinition";
import { Versions } from "./Versions";
import { ActivityDefinitionCfg } from "./interfaces";

export interface ActivityCfg {
  id?: string | null;
  objectType?: string;
  definition?: ActivityDefinitionCfg;
}

export class Activity {
  objectType: string;
  id: string | null;
  definition: ActivityDefinition | null;
  private readonly LOG_SRC = "Activity";

  constructor(cfg?: ActivityCfg) {
    this.log("constructor");
    this.objectType = "Activity";
    this.id = null;
    this.definition = null;
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ActivityCfg): void {
    this.log("init");

    if (cfg) {
      if (cfg.definition instanceof ActivityDefinition) {
        this.definition = cfg.definition;
      } else if (cfg.definition) {
        this.definition = new ActivityDefinition(cfg.definition);
      }

      if (cfg.id !== undefined) {
        this.id = cfg.id;
      }
    }
  }

  toString(lang?: string): string {
    this.log("toString");
    let defString = "";

    if (this.definition !== null) {
      defString = this.definition.toString(lang);
      if (defString !== "") {
        return defString;
      }
    }

    if (this.id !== null) {
      return this.id;
    }

    return "Activity: unidentified";
  }

  asVersion(version: string = Versions[0]): ActivityCfg {
    this.log("asVersion");
    const result: ActivityCfg = {
      id: this.id,
      objectType: this.objectType
    };

    if (this.definition !== null) {
      result.definition = this.definition.asVersion(version);
    }

    return result;
  }

  static fromJSON(activityJSON: string): Activity {
    const _activity: ActivityCfg = JSON.parse(activityJSON);
    const activityInstance = new Activity(_activity);
    activityInstance.log("fromJSON");
    return activityInstance;
  }
}
