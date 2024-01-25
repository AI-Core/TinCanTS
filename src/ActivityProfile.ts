import { Logger } from "./Logger";
import { Activity } from "./Activity";

interface ActivityProfileCfg {
    id?: string | null;
    activity?: Activity;
    contents?: string | null;
    etag?: string | null;
    contentType?: string | null;
}

export class ActivityProfile {
  id: string | null = null;
  activity: Activity | null = null;
  updated: boolean = false;
  contents: string | null = null;
  etag: string | null = null;
  contentType: string | null = null;

  private LOG_SRC = "ActivityProfile";

  constructor(cfg?: ActivityProfileCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ActivityProfileCfg): void {
    this.log("init");

    cfg = cfg || {};

    if (cfg.activity !== undefined) {
      this.activity = cfg.activity instanceof Activity ? cfg.activity : new Activity(cfg.activity);
    }

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
  }


  static fromJSON(stateJSON: string): ActivityProfile {
    Logger.log("fromJSON", "ActivityProfile");
    const _state: ActivityProfileCfg = JSON.parse(stateJSON);

    return new ActivityProfile(_state);
  }
}

export default ActivityProfile;