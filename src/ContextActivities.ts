import { Logger } from "./Logger";
import { Activity } from "./Activity"; // Adjust the import path as needed
import { ActivityDefinitionCfg } from "./interfaces";

interface ActivityCfg {
  id?: string | null;
  objectType?: string;
  definition?: ActivityDefinitionCfg;
}

export interface ContextActivitiesCfg {
  category?: ActivityCfg[];
  parent?: ActivityCfg[];
  grouping?: ActivityCfg[];
  other?: ActivityCfg[];
}

export class ContextActivities {
  category: Activity[] | null = null;
  parent: Activity[] | null = null;
  grouping: Activity[] | null = null;
  other: Activity[] | null = null;

  private readonly LOG_SRC = "ContextActivities";

  constructor(cfg?: ContextActivitiesCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ContextActivitiesCfg): void {
    this.log("init");
  
    const objProps: Array<keyof ContextActivitiesCfg> = ["category", "parent", "grouping", "other"];
  
    cfg = cfg || {};
  
    objProps.forEach((prop) => {
      if (cfg?.hasOwnProperty(prop) && cfg[prop] !== null) {
        const propValue = cfg[prop];
        if (Array.isArray(propValue)) {
          propValue.forEach((val) => {
            this.add(prop, val);
          });
        } else if (propValue) {
          // If it's not an array, add it directly
          this.add(prop, propValue);
        }
      }
    });
  }

  add(key: keyof ContextActivitiesCfg, val: ActivityCfg | string): number | undefined {
    if (!this[key]) {
      this[key] = [];
    }

    let activity: Activity;

    if (!(val instanceof Activity)) {
      const activityCfg = typeof val === "string" ? { id: val } : val;
      activity = new Activity(activityCfg);
    } else {
      activity = val;
    }

    this[key]!.push(activity);

    return this[key]!.length - 1;
  }

  asVersion(version: string = "1.0.0"): ContextActivitiesCfg {
    this.log("asVersion");
    const result: ContextActivitiesCfg = {};
  
    // Define the properties that are common to both ContextActivities and ContextActivitiesCfg
    const commonProps: Array<keyof ContextActivitiesCfg> = ["parent", "grouping", "other", "category"];
  
    commonProps.forEach((prop) => {
      const propValue = this[prop as keyof ContextActivities]; // Cast to keyof ContextActivities
      if (propValue !== null && Array.isArray(propValue)) {
        result[prop] = propValue.map((activity) => activity.asVersion(version));
      }
    });
  
    return result;
  }

  static fromJSON(contextActivitiesJSON: string): ContextActivities {
    Logger.log("fromJSON", "ContextActivities");
    const _contextActivities: ContextActivitiesCfg = JSON.parse(contextActivitiesJSON);

    return new ContextActivities(_contextActivities);
  }
}
