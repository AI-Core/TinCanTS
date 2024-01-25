
import { Logger } from "./Logger";
import { Utils } from "./Utils";
import { RecordStoreConfig } from "./interfaces";
import { Agent } from "./Agent";
import { Activity } from "./Activity";
import { Context } from "./Context";
import { LRS } from "./LRS";

interface TinCanConfig {
  url?: string;
  recordStores?: RecordStoreConfig[];
  actor?: Agent;
  activity?: Activity;
  registration?: string;
  context?: Context;
}

const _reservedQSParams = {
  //
  // these are reserved query string parameters that
  // are used by the library and/or the spec
  //
  statementId: true,
  voidedStatementId: true,
  verb: true,
  object: true,
  registration: true,
  context: true,
  actor: true,
  since: true,
  until: true,
  limit: true,
  authoritative: true,
  sparse:  true,
  instructor: true,
  ascending: true,
  continueToken: true,
  agent: true,
  activityId: true,
  stateId: true,
  profileId: true,
  activity_platform: true,
  grouping: true,
  "Accept-Language": true
};

export class TinCan {
  recordStores: Array<LRS>;
  actor: Agent | null;
  activity: Activity | null;
  registration: string | null;
  context: Context | null;

  constructor(cfg?: TinCanConfig) {
      this.log("constructor");
      this.recordStores = [];
      this.actor = null;
      this.activity = null;
      this.registration = null;
      this.context = null;
      this.init(cfg);
  }

  log(msg: string): void {
    Logger.log(msg, "TinCan");
  }
  
  private init(cfg?: TinCanConfig): void {
    this.log("init");
    cfg = cfg || {};
    
    if (cfg.url) {
      this._initFromQueryString(cfg.url);
    }
    if (cfg.recordStores) {
      cfg.recordStores.forEach(store => this.addRecordStore(store));
    }
    if (cfg.actor) {
      this.actor = cfg.actor instanceof Agent ? cfg.actor : new Agent(cfg.actor);
    }
    if (cfg.activity) {
      this.activity = cfg.activity instanceof Activity ? cfg.activity : new Activity(cfg.activity);
    }
    if (cfg.context) {
      this.context = cfg.context instanceof Context ? cfg.context : new Context(cfg.context);
    }
    if (cfg.registration) {
      this.registration = cfg.registration;
    }
  }

  private _initFromQueryString(url: string): void {
    this.log("_initFromQueryString");

    const qsParams = Utils.parseURL(url).params;
    let lrsCfg: RecordStoreConfig = {};
    let contextCfg: { [key: string]: any } = {};
    let extended: { [key: string]: any } | null = null;

    if (qsParams.actor) {
      this.log(`_initFromQueryString - found actor: ${qsParams.actor}`);
      try {
          this.actor = Agent.fromJSON(qsParams.actor);
          delete qsParams.actor;
      } catch (ex) {
          this.log(`_initFromQueryString - failed to set actor: ${ex}`);
      }
    }

    console.log("this.actor", this.actor)

    if (qsParams.activity_id) {
        this.activity = new Activity({ id: qsParams.activity_id });
        delete qsParams.activity_id;
    }

    if (qsParams.activity_platform || qsParams.registration || qsParams.grouping) {
        if (qsParams.activity_platform) {
            contextCfg.platform = qsParams.activity_platform;
            delete qsParams.activity_platform;
        }
        if (qsParams.registration) {
            contextCfg.registration = this.registration = qsParams.registration;
            delete qsParams.registration;
        }
        if (qsParams.grouping) {
            contextCfg.contextActivities = { grouping: qsParams.grouping };
            delete qsParams.grouping;
        }

        this.context = new Context(contextCfg);
    }

    if (qsParams.endpoint) {
      lrsCfg.endpoint = qsParams.endpoint;
      delete qsParams.endpoint;

      if (qsParams.auth) {
        lrsCfg.auth = qsParams.auth;
        delete qsParams.auth;
      }
      for (const key in qsParams) {
        if (qsParams.hasOwnProperty(key) && !_reservedQSParams.hasOwnProperty(key)) {
          extended = extended || {};
          extended[key] = qsParams[key];
        }
      }
      if (extended !== null) {
          lrsCfg.extended = extended;
      }

      lrsCfg.allowFail = false;
      this.log(`_initFromQueryString - adding LRS: ${lrsCfg.endpoint}`);
      
      this.addRecordStore(lrsCfg);
    }
  }

  addRecordStore(cfg: LRS | RecordStoreConfig): void {
    this.log("addRecordStore");
    let lrs: LRS;

    if (cfg instanceof LRS) {
        lrs = cfg;
    } else {
        lrs = new LRS(cfg);
    }

    this.recordStores.push(lrs);
  }
}
