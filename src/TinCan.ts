
import {
  IRetrieveStateCfg,
  IRecordStoreCfg,
  IDropStateCfg,
  IGetStatementCfg,
  IRetrieveActivityProfileCfg,
  ISaveActivityProfileCfg,
  IDropActivityProfileCfg,
  IRetrieveAgentProfileCfg,
  ISaveAgentProfileCfg,
  IDropAgentProfileConfig,
  ISaveStateCfg
} from "./interfaces";
import { Logger } from "./Logger";
import { Utils } from "./Utils";
import { Agent } from "./Agent";
import { Activity } from "./Activity";
import { Context } from "./Context";
import { LRS } from "./LRS";
import { Statement } from "./Statement";
import { StatementsResult } from "./StatementResult";
import { State } from "./State";
import { ActivityProfile } from "./ActivityProfile"
import { AgentProfile } from "./AgentProfile";

interface TinCanConfig {
  url?: string;
  recordStores?: IRecordStoreCfg[];
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
    cfg = cfg ?? {};
    
    if (cfg.url) {
      this._initFromQueryString(cfg.url);
    }
    if (cfg.recordStores) {
      cfg.recordStores.forEach(store => this.addRecordStore(store));
    }
    // If, in addition to the url, the user pass more parameters, the parameters
    // in the URL will be overwritten
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
    let lrsCfg: IRecordStoreCfg = {};
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
          extended = extended ?? {};
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

  addRecordStore(cfg: LRS | IRecordStoreCfg): void {
    this.log("addRecordStore");
    let lrs: LRS;

    if (cfg instanceof LRS) {
        lrs = cfg;
    } else {
        lrs = new LRS(cfg);
    }

    this.recordStores.push(lrs);
  }

  prepareStatement(stmt: Statement): Statement {
    this.log("prepareStatement");
    if (!(stmt instanceof Statement)) {
      stmt = new Statement(stmt);
    }

    let statement = stmt;

    if (statement.actor === null && this.actor !== null) {
      statement.actor = this.actor;
    }
    if (statement.object === null && this.activity !== null) {
      statement.object = this.activity;
    }

    if (this.context !== null) {
      if (statement.context === null) {
        statement.context = this.context;
      } else {
        if (statement.context.registration === null) {
          statement.context.registration = this.context.registration;
        }
        if (statement.context.platform === null) {
          statement.context.platform = this.context.platform;
        }

        if (this.context.contextActivities !== null) {
          if (statement.context.contextActivities === null) {
            statement.context.contextActivities = this.context.contextActivities;
          } else {
            if (this.context.contextActivities.grouping !== null && statement.context.contextActivities.grouping === null) {
              statement.context.contextActivities.grouping = this.context.contextActivities.grouping;
            }
            if (this.context.contextActivities.parent !== null && statement.context.contextActivities.parent === null) {
              statement.context.contextActivities.parent = this.context.contextActivities.parent;
            }
            if (this.context.contextActivities.other !== null && statement.context.contextActivities.other === null) {
              statement.context.contextActivities.other = this.context.contextActivities.other;
            }
          }
        }
      }
    }

    return statement;
  }

  async sendStatement(stmt: Statement, callback?: (results: any[], statement: Statement) => void): Promise<{ statement: Statement, results: any[] }> {
    this.log("sendStatement");
  
    let statement = this.prepareStatement(stmt);
    let rsCount = this.recordStores.length;
    let callbackResults: any[] = [];
  
    if (rsCount > 0) {
      const promises = this.recordStores.map(lrs => {
        return lrs.saveStatement(statement);
      });
  
      try {
        const responses = await Promise.all(promises);
        responses.forEach((response) => {
          callbackResults.push({ err: null, response });
        });
  
        // Execute callback if provided
        if (typeof callback === "function") {
          callback(callbackResults, statement);
        }
      } catch (error) {
        // Handle errors, potentially from any of the LRS saveStatement calls
        this.log("[error] sendStatement encountered an error: " + error);
  
        // Populate callbackResults with error details for each failed request
        callbackResults = this.recordStores.map((_) => {
          return { err: error, response: null };
        });
  
        if (typeof callback === "function") {
          callback(callbackResults, statement);
        }
      }
    } else {
      this.log("[warning] sendStatement: No LRSs added yet (statement not sent)");
      if (typeof callback === "function") {
        callback([], statement);
      }
    }
  
    return { statement, results: callbackResults };
  }

  async getStatement(stmtId: string, callback?: (err: Error | null, result?: Statement) => void, cfg?: { params?: { attachments?: boolean } }): Promise<Statement | void> {
    this.log("getStatement");
  
    cfg = cfg ?? {};
    cfg.params = cfg.params ?? {};
  
    if (this.recordStores.length > 0) {
      // For statements (for now) we only need to read from the first LRS
      // In the future, it may make sense to get all from all LRSes and
      // compare to remove duplicates or allow inspection of them for differences
      // TODO: make this the first non-allowFail LRS but for now it should
      // be good enough to make it the first since we know the LMS provided
      // LRS is the first
      const lrs = this.recordStores[0];
  
      try {
        const result = await lrs.retrieveStatement(stmtId, cfg);
        if (callback) {
          callback(null, result as Statement);
        }
        return result;
      } catch (error) {
        if (callback) {
          callback(error as Error);
        }
      }
    } else {
      this.log("[warning] getStatement: No LRSs added yet (statement not retrieved)");
    }
  }

  async voidStatement(
    stmt: Statement | string,
    callback?: (results: any[], statement: Statement) => void,
    options?: { actor?: Agent }
  ): Promise<{ statement: Statement, results: any[] }> {
    this.log("voidStatement");
  
    const actor = options?.actor ?? this.actor;
    let voidingStatement: Statement;
    let results: any[] = [];
    let callbackResults: any[] = [];

    if (stmt instanceof Statement) {
      if (stmt.id === null) {
        throw new Error("Statement does not have an ID, cannot be voided");
      }
      stmt = stmt.id;
    }
    if (actor === null) {
      throw new Error("No actor specified, cannot void statement");
    }
  
  
    voidingStatement = new Statement({
      actor: actor,
      verb: {
        id: "http://adlnet.gov/expapi/verbs/voided"
      },
      target: {
        objectType: "StatementRef",
        id: stmt
      }
    });
  
    if (this.recordStores.length > 0) {
      const callbackWrapper = (err: Error | null, response?: Response | null) => {
        this.log("voidStatement - callbackWrapper");
        callbackResults.push({ err, response });
  
        if (callbackResults.length === this.recordStores.length) {
          const args: [any[], Statement] = [callbackResults, voidingStatement];
          callback?.apply(this, args);
        }
      };
  
      for (const lrs of this.recordStores) {
        const result = await lrs.saveStatement(voidingStatement, { callback: callbackWrapper });
        results.push(result);
      }
    } else {
      this.log("[warning] voidStatement: No LRSs added yet (statement not sent)");
      if (typeof callback === "function") {
        callback([], voidingStatement);
      }
    }
  
    return { statement: voidingStatement, results };
  }

  async getVoidedStatement(stmtId: string, callback?: (err: Error | null, result?: Statement) => void): Promise<Statement | void> {
    this.log("getVoidedStatement");
  
    if (this.recordStores.length > 0) {
      // For statements (for now) we only need to read from the first LRS
      // In the future, it may make sense to get all from all LRSes and
      // compare to remove duplicates or allow inspection of them for differences
      // TODO: make this the first non-allowFail LRS but for now it should
      // be good enough to make it the first since we know the LMS provided
      // LRS is the first
      const lrs = this.recordStores[0];
  
      try {
        const result = await lrs.retrieveVoidedStatement(stmtId);
        if (callback) {
          callback(null, result as Statement);
        }
        return result;
      } catch (error) {
        if (callback) {
          callback(error as Error);
        }
      }
    } else {
      this.log("[warning] getVoidedStatement: No LRSs added yet (statement not retrieved)");
    }
  }

  async sendStatements(
    stmts: Statement[],
    callback?: (results: any[], statements: Statement[]) => void
  ): Promise<{ statements: Statement[], results: Array<void | Response> }> {
    this.log("sendStatements");
  
    let statements: Statement[] = [];
    let results: Array<void | Response> = [];
    let callbackResults: Array<{ err: Error | null, response?: Response | null }> = [];
  
    if (stmts.length === 0) {
      if (typeof callback === "function") {
        callback([], []);
      }
    } else {
      statements = stmts.map(stmt => this.prepareStatement(stmt));
  
      if (this.recordStores.length > 0) {
        const callbackWrapper = (err: Error | null, response?: Response | null) => {
          this.log("sendStatements - callbackWrapper");
  
          callbackResults.push({ err, response });
  
          if (callbackResults.length === this.recordStores.length) {
            const args: [Array<{ err: Error | null, response?: Response | null }>, Statement[]] = [callbackResults, statements];
            callback?.apply(this, args);
          }
        };
  
        for (const lrs of this.recordStores) {
          const result = await lrs.saveStatements(statements, { callback: callbackWrapper });
          results.push(result);
        }
      } else {
        this.log("[warning] sendStatements: No LRSs added yet (statements not sent)");
        if (typeof callback === "function") {
          callback([], statements);
        }
      }
    }
  
    return { statements, results };
  }

  async getStatements(cfg?: IGetStatementCfg): Promise<StatementsResult | void> {
    this.log("getStatements");
  
    if (this.recordStores.length > 0) {
      const lrs = this.recordStores[0];
      cfg = cfg ?? {};
  
      let params = cfg.params ?? {};
  
      // Send the instance actor if not defined
      if (cfg.sendActor && this.actor !== null) {
        if (lrs.version === "0.9" || lrs.version === "0.95") {
          params.actor = this.actor;
        } else {
          params.agent = this.actor;
        }
      }
      // Send the instance activity if not defined
      if (cfg.sendActivity && this.activity !== null) {
        if (lrs.version === "0.9" || lrs.version === "0.95") {
          params.target = this.activity;
        } else {
          params.activity = this.activity;
        }
      }
      if (params.registration === undefined && this.registration !== null) {
        params.registration = this.registration;
      }
  
      const queryCfg: IGetStatementCfg = {
        params: params,
      };

      if (cfg.callback) {
        queryCfg.callback = cfg.callback;
      }
  
      try {
        const result = await lrs.queryStatements(queryCfg);
        if (cfg.callback) {
          cfg.callback(null, result as StatementsResult);
        }
        return result;
      } catch (error) {
        if (cfg.callback) {
          cfg.callback(error as Error);
        } else {
          throw error;
        }
      }
    } else {
      this.log("[warning] getStatements: No LRSs added yet (statements not read)");
    }
  }

  async getState(key: string, cfg?: IRetrieveStateCfg): Promise<State | void> {
    this.log("getState");
  
    if (this.recordStores.length > 0) {
      const lrs = this.recordStores[0];
      cfg = cfg ?? {} as IRetrieveStateCfg
  
      const queryCfg: {
        agent: Agent,
        activity: Activity,
        registration?: string
      } = {
        agent: cfg.agent ?? this.actor as Agent,
        activity: cfg.activity ?? this.activity as Activity
      };
  
      if (cfg.registration !== undefined) {
        queryCfg.registration = cfg.registration;
      } else if (this.registration !== null) {
        queryCfg.registration = this.registration;
      }
  
      const result = await lrs.retrieveState(key, queryCfg);
      return result;
    } else {
      this.log("[warning] getState: No LRSs added yet (state not retrieved)");
    }
  }

  async setState(key: string, val: any, cfg?: ISaveStateCfg): Promise<void | Response> {
    this.log("setState");
  
    if (this.recordStores.length > 0) {
      const lrs = this.recordStores[0];
      cfg = cfg ?? {} as ISaveStateCfg;
  
      const queryCfg: ISaveStateCfg = {
        agent: cfg.agent ?? this.actor as Agent,
        activity: cfg.activity ?? this.activity as Activity
      };
  
      if (cfg.registration !== undefined) {
        queryCfg.registration = cfg.registration;
      } else if (this.registration !== null) {
        queryCfg.registration = this.registration;
      }
  
      if (cfg.lastSHA1 !== undefined) {
        queryCfg.lastSHA1 = cfg.lastSHA1;
      }
  
      if (cfg.contentType !== undefined) {
        queryCfg.contentType = cfg.contentType;
        if (cfg.overwriteJSON !== undefined && !cfg.overwriteJSON && Utils.isApplicationJSON(cfg.contentType)) {
          queryCfg.method = "POST";
        }
      }
  
      try {
        const response = await lrs.saveState(key, val, queryCfg);
        if (cfg.callback) {
          cfg.callback(null, response as Response);
        }
        return response;
      } catch (error) {
        if (cfg.callback) {
          cfg.callback(error as Error);
        } else {
          throw error;
        }
      }
    } else {
      this.log("[warning] setState: No LRSs added yet (state not saved)");
    }
  }

  async deleteState(key: string, cfg?: IDropStateCfg): Promise<void> {
    this.log("deleteState");
  
    if (this.recordStores.length > 0) {
      const lrs = this.recordStores[0];
  
      const queryCfg: IDropStateCfg = {
        agent: cfg?.agent ?? this.actor as Agent,
        activity: cfg?.activity ?? this.activity as Activity
      };
  
      if (cfg?.registration !== undefined) {
        queryCfg.registration = cfg.registration;
      } else if (this.registration !== null) {
        queryCfg.registration = this.registration;
      }
      await lrs.dropState(key, queryCfg);
    } else {
      this.log("[warning] deleteState: No LRSs added yet (state not deleted)");
    }
  }

  async getActivityProfile(key: string, cfg: IRetrieveActivityProfileCfg): Promise<ActivityProfile | void> {
    this.log("getActivityProfile")
    if (this.recordStores.length > 0) {
      const lrs = this.recordStores[0];
      if (!cfg.activity && !this.activity) {
        throw new Error("There is no activity in your configuration or in the TinCan object")
      }
      const queryCfg: IRetrieveActivityProfileCfg = {
        ...cfg,
        activity: cfg.activity ?? this.activity as Activity,
      }

      return lrs.retrieveActivityProfile(key, queryCfg);
    } else {
      this.log("[warning] getActivityProfile: No LRSs added yet (state not deleted)");
    }
  }

  async setActivityProfile(key: string, val: any, cfg: ISaveActivityProfileCfg): Promise<void> {
    this.log("setActivityProfile")
    if (this.recordStores.length > 0){
      let method: "PUT" | "POST" = cfg.method ?? "PUT";
      if (
        cfg.contentType &&
        cfg.overwriteJSON === false &&
        Utils.isApplicationJSON(cfg.contentType)
      ) {
        method = "POST"
      }
      const queryCfg: ISaveActivityProfileCfg = {
        ...cfg,
        method,
        activity: cfg.activity ?? this.activity
      };
      const lrs = this.recordStores[0]
      return lrs.saveActivityProfile(key, val, queryCfg);
    } else {
      this.log("[warning] setActivityProfile: No LRSs added yet (state not deleted)");
    }
  }

  async deleteActivityProfile(key: string, cfg: IDropActivityProfileCfg): Promise<void> {
    this.log("deleteActivityProfile")
    if (this.recordStores.length > 0){
      const queryCfg: ISaveActivityProfileCfg = {
        ...cfg,
        activity: cfg.activity ?? this.activity
      };
      const lrs = this.recordStores[0]
      return lrs.dropActivityProfile(key, queryCfg);
    } else {
      this.log("[warning] deleteActivityProfile: No LRSs added yet (state not deleted)");
    }
  }

  async getAgentProfile(key:string, cfg: IRetrieveAgentProfileCfg): Promise<void | AgentProfile> {
    this.log("getAgentProfile")
    if (this.recordStores.length > 0){
      const queryCfg: IRetrieveAgentProfileCfg = {
        ...cfg,
        agent: cfg.agent ?? this.actor
      };
      const lrs = this.recordStores[0]
      return lrs.retrieveAgentProfile(key, queryCfg);
    } else {
      this.log("[warning] getAgentProfile: No LRSs added yet (state not deleted)");
    }
  }

  async setAgentProfile(key:string, val: any, cfg: ISaveAgentProfileCfg): Promise<void | Response> {
    this.log("setAgentProfile")
    if (this.recordStores.length > 0){
      let method: "PUT" | "POST" = cfg.method ?? "PUT";
      if (
        cfg.contentType &&
        cfg.overwriteJSON === false &&
        Utils.isApplicationJSON(cfg.contentType)
      ) {
        method = "POST"
      }
      const queryCfg: ISaveAgentProfileCfg = {
        ...cfg,
        method,
        agent: cfg.agent ?? this.actor as Agent
      };
      const lrs = this.recordStores[0]
      return lrs.saveAgentProfile(key, val, queryCfg);
    } else {
      this.log("[warning] setAgentProfile: No LRSs added yet (state not deleted)");
    }
  }

  async deleteAgentProfile(key: string, cfg: IDropAgentProfileConfig) {
    this.log("deleteAgentProfile")
    if (this.recordStores.length > 0){
      const queryCfg: IDropAgentProfileConfig = {
        ...cfg,
        agent: cfg.agent ?? this.actor
      };
      const lrs = this.recordStores[0]
      return lrs.dropAgentProfile(key, queryCfg);
    } else {
      this.log("[warning] deleteAgentProfile: No LRSs added yet (state not deleted)");
    }
  }
}
