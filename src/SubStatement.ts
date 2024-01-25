import { Logger } from "./Logger";
import { Agent } from "./Agent";
import { Verb, VerbCfg } from "./Verb";
import { Activity, ActivityCfg } from "./Activity";
import { Result, ResultCfg } from "./Result";
import { Context, ContextCfg } from "./Context";
import { StatementRef, StatementRefCfg } from "./StatementRef";
import { IAgentCfg } from "./interfaces/Agent";

export interface SubStatementCfg {
  objectType?: string;
  actor?: Agent | IAgentCfg;
  verb?: Verb | VerbCfg;
  target?: Activity | Agent | SubStatement | StatementRef | ActivityCfg | IAgentCfg | SubStatementCfg | StatementRefCfg;
  result?: Result | ResultCfg;
  context?: Context | ContextCfg;
  timestamp?: string;
}

export class SubStatement {
  actor: Agent | null = null;
  verb: Verb | null = null;
  target: Activity | Agent | SubStatement | StatementRef | null = null;
  result: Result | null = null;
  context: Context | null = null;
  timestamp: string | null = null;
  objectType: string = "SubStatement";

  private readonly LOG_SRC = "SubStatement";

  constructor(cfg?: SubStatementCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: SubStatementCfg): void {
    this.log("init");

    cfg = cfg || {};

    if (cfg.actor) {
      this.actor = cfg.actor instanceof Agent ? cfg.actor : new Agent(cfg.actor);
    }
    if (cfg.verb) {
      this.verb = cfg.verb instanceof Verb ? cfg.verb : new Verb(cfg.verb);
    }
    if (cfg.target) {
      this.target = this.initializeTarget(cfg.target);
    }
    if (cfg.result) {
      this.result = cfg.result instanceof Result ? cfg.result : new Result(cfg.result);
    }
    if (cfg.context) {
      this.context = cfg.context instanceof Context ? cfg.context : new Context(cfg.context);
    }
    if (cfg.timestamp) {
      this.timestamp = cfg.timestamp;
    }
  }

  private initializeTarget(obj: ActivityCfg | IAgentCfg | SubStatementCfg | StatementRefCfg ): Activity | Agent | SubStatement | StatementRef | null{
    switch (obj.objectType) {
      case "Activity":
        return new Activity(obj);
      case "Agent":
        return new Agent(obj);
      case "SubStatement":
        return new SubStatement(obj);
      case "StatementRef":
        return new StatementRef(obj as StatementRefCfg);
      default:
        this.log("Unrecognized target type: " + obj.objectType);
        return null;
    }
  }

  toString(lang?: string): string {
    this.log("toString");
    return (this.actor ? this.actor.toString() : "") +
           " " +
           (this.verb ? this.verb.toString(lang) : "") +
           " " +
           (this.target ? this.target.toString(lang) : "");
  }

  asVersion(version: string = "1.0.0"): SubStatementCfg {
    this.log("asVersion");
    const result: Partial<SubStatementCfg> = {
      objectType: "SubStatement"
    };

    if (this.actor) {
      result.actor = this.actor.asVersion(version);
    }
    if (this.verb) {
      result.verb = this.verb.asVersion(version);
    }
    if (this.result) {
      result.result = this.result.asVersion(); // Result has no version
    }
    if (this.context) {
      result.context = this.context.asVersion(version);
    }

    if (this.target) {
      result.target = this.target.asVersion(version);
    }
    if (this.timestamp) {
      result.timestamp = this.timestamp;
    }

    return result as SubStatementCfg;
  }

  static fromJSON(subStJSON: string): SubStatement {
    Logger.log("fromJSON", "SubStatement");
    const _subSt: SubStatementCfg = JSON.parse(subStJSON);

    return new SubStatement(_subSt);
  }
}