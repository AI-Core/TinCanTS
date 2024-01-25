import { Logger } from "./Logger";
import { Agent, AgentCfg } from "./Agent";
import { Group, GroupCfg } from "./Group";
import { Verb, VerbCfg } from "./Verb";
import { Activity, ActivityCfg } from "./Activity";
import { StatementRef } from "./StatementRef";
import { SubStatement } from "./SubStatement";
import { Result, ResultCfg } from "./Result";
import { Context, ContextCfg } from "./Context";
import { Attachment, AttachmentCfg } from "./Attachment";
import { Utils } from "./Utils";

export interface StatementCfg {
  id?: string;
  actor?: Agent | AgentCfg | Group | GroupCfg;
  verb?: Verb | VerbCfg;
  object?: Activity | Agent | Group | StatementRef | SubStatement | ActivityCfg | AgentCfg | GroupCfg | StatementRef | SubStatement;
  target?: Activity | Agent | Group | StatementRef | SubStatement | ActivityCfg | AgentCfg | GroupCfg | StatementRef | SubStatement;
  result?: Result | ResultCfg;
  context?: Context | ContextCfg;
  authority?: Agent | Group | AgentCfg | GroupCfg;
  attachments?: Attachment[] | AttachmentCfg[];
  timestamp?: string;
  stored?: string;
  version?: string;
  objectType?: string;
}

interface InitCfg {
  storeOriginal?: number | null;
  doStamp?: boolean;
}

export class Statement {
  id: string | null = null;
  actor: Agent | Group | null = null;
  verb: Verb | null = null;
  object: Activity | Agent | Group | StatementRef | SubStatement | null = null;
  result: Result | null = null;
  context: Context | null = null;
  timestamp: string | null = null;
  stored: string | null = null;
  authority: Agent | Group | null = null;
  attachments: Attachment[] | null = null;
  version: string | null = null;
  degraded: boolean = false;
  voided: boolean | null = null;
  inProgress: boolean | null = null;
  originalJSON: string | null = null;
  objectType: string = "Statement";

  private readonly LOG_SRC = "Statement";

  constructor(cfg?: StatementCfg, initCfg?: InitCfg) {
    this.log("constructor");
    this.init(cfg, initCfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: StatementCfg, initCfg: InitCfg = {}) {
    this.log("init");

    cfg = cfg || {};
    
    if (initCfg.storeOriginal) {
      this.originalJSON = JSON.stringify(cfg, null, initCfg.storeOriginal);
    }

    if (cfg.hasOwnProperty("object")) {
      cfg.target = cfg.object;
    }
    
    this.setObjectProperties(cfg);
    this.setResultContextAuthority(cfg);
    
    if (cfg?.id) {
      this.id = cfg.id;
    }
    if (cfg?.stored) {
      this.stored = cfg.stored;
    }
    if (cfg?.timestamp) {
      this.timestamp = cfg.timestamp;
    }
    if (cfg?.version) {
      this.version = cfg.version;
    }
    if (initCfg.doStamp !== false) {
      this.stamp();
    }
  }

  private setObjectProperties(cfg: StatementCfg) {
    this.log("setObjectProperties" + JSON.stringify(cfg));
    if (cfg?.actor) {
      this.actor = cfg.actor instanceof Agent ? cfg.actor : new Agent(cfg.actor);
    }
    if (cfg?.target) {
      this.object = cfg.target instanceof Activity ? cfg.target : new Activity(cfg.target);
    }
    if (cfg?.authority) {
      this.authority = cfg.authority instanceof Agent ? cfg.authority : new Agent(cfg.authority);
    }
    if (cfg?.verb) {
      this.verb = cfg.verb instanceof Verb ? cfg.verb : new Verb(cfg.verb);
    }
  }

  private setResultContextAuthority(cfg: StatementCfg) {
    if (cfg.result) {
      this.result = cfg.result instanceof Result ? cfg.result : new Result(cfg.result);
    }
    if (cfg.context) {
      this.context = cfg.context instanceof Context ? cfg.context : new Context(cfg.context);
    }
    if (cfg.authority) {
      this.authority = cfg.authority instanceof Agent ? cfg.authority : new Agent(cfg.authority);
    }
    if (cfg.attachments) {
      this.attachments = cfg.attachments.map(att => att instanceof Attachment ? att : new Attachment(att));
    }
  }

  stamp() {
    this.log("stamp");
    if (!this.id) {
      this.id = Utils.getUUID();
    }
    if (!this.timestamp) {
      this.timestamp = Utils.getISODateString(new Date());
    }
  }

  hasAttachmentWithContent(): boolean {
    this.log("hasAttachmentWithContent");

    return this.attachments?.some(att => att.content !== null) ?? false;
  }

  asVersion(version: string = "1.0.0"): StatementCfg {
    this.log("asVersion");
    const result: Partial<StatementCfg> = {};

    if (this.id) {
      result.id = this.id;
    }
    if (this.timestamp) {
      result.timestamp = this.timestamp;
    }
    if (this.version) {
      result.version = this.version;
    }
    if (this.actor !== null) {
      result.actor = this.actor.asVersion(version);
    }
    if (this.verb !== null) {
      result.verb = this.verb.asVersion(version);
    }
    if (this.result !== null) {
      result.result = this.result.asVersion(); // Result doesn't have a version parameter
    }
    if (this.context !== null) {
      result.context = this.context.asVersion(version);
    }
    if (this.authority !== null) {
      result.authority = this.authority.asVersion(version);
    }
    if (this.object !== null) {
      result.object = this.object.asVersion(version);
    }

    if (this.attachments) {
      result.attachments = this.attachments.map(att => {
        // Ensure 'att' is of type 'Attachment' before calling asVersion
        return att instanceof Attachment ? att.asVersion() : att;
      });
    }

    return result
  }

  static fromJSON(stJSON: string): Statement {
    Logger.log("fromJSON", "Statement");
    const _st: StatementCfg = JSON.parse(stJSON);

    return new Statement(_st);
  }
}
