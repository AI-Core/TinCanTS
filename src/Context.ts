import { Logger } from "./Logger";
import { Agent } from "./Agent";
import { Group, GroupCfg } from "./Group";
import { ContextActivities, ContextActivitiesCfg } from "./ContextActivities";
import { StatementRef } from "./StatementRef";
import { SubStatement, SubStatementCfg } from "./SubStatement";
import { StatementCfg } from "./Statement";
import { IAgentCfg } from "./interfaces/Agent";

export interface ContextCfg {
  registration?: string | null;
  instructor?: Agent | Group | IAgentCfg | GroupCfg | null;
  team?: Agent | Group | IAgentCfg | GroupCfg | null;
  contextActivities?: ContextActivitiesCfg | null;
  revision?: string | null;
  platform?: string | null;
  language?: string | null;
  statement?: StatementRef | SubStatement | StatementCfg | SubStatementCfg | null;
  extensions?: { [key: string]: any } | null;
  [key: string]: string | Agent | Group | ContextActivitiesCfg | StatementRef | SubStatement | { [key: string]: any } | null | undefined;
}

export class Context {
  registration: string | null = null;
  instructor: Agent | Group | null = null;
  team: Agent | Group | null = null;
  contextActivities: ContextActivities | null = null;
  revision: string | null = null;
  platform: string | null = null;
  language: string | null = null;
  statement: StatementRef | SubStatement | null = null;
  extensions: { [key: string]: any } | null = null;

  private readonly LOG_SRC = "Context";

  constructor(cfg?: ContextCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ContextCfg): void {
    this.log("init");

    cfg = cfg || {};

    const directProps = ["registration", "revision", "platform", "language", "extensions"];
    if (cfg?.registration) {
      this.registration = cfg.registration;
    }
    if (cfg?.revision) {
      this.revision = cfg.revision;
    }
    if (cfg?.platform) {
      this.platform = cfg.platform;
    }
    if (cfg?.language) {
      this.language = cfg.language;
    }
    if (cfg?.extensions) {
      this.extensions = cfg.extensions;
    }

    if (cfg?.instructor) {
      const val = cfg.instructor;
      if (typeof val.objectType === "undefined" || val.objectType === "Person") {
        val.objectType = "Agent";
      }
      if (val.objectType === "Agent" && !(val instanceof Agent)) {
        this.instructor = new Agent(val);
      } else if (val.objectType === "Group" && !(val instanceof Group)) {
        this.instructor = new Group(val as GroupCfg);
      }
    }

    if (cfg.contextActivities) {
      this.contextActivities = cfg.contextActivities instanceof ContextActivities
        ? cfg.contextActivities
        : new ContextActivities(cfg.contextActivities);
    }

    if (cfg.statement) {
      this.statement = this.initializeStatement(cfg.statement);
    }
  }

  private initializeStatement(statement: StatementRef | SubStatement | StatementCfg | SubStatementCfg): StatementRef | SubStatement {
    if (statement instanceof StatementRef || statement instanceof SubStatement) {
      return statement;
    } else {
      return statement.objectType === "StatementRef"
        ? new StatementRef(statement)
        : new SubStatement(statement);
    }
  }

  asVersion(version: string = "1.0.0"): ContextCfg {
    this.log("asVersion");
    const result: Partial<ContextCfg> = {};

    const optionalDirectProps = ["registration", "revision", "platform", "language", "extensions"];
    optionalDirectProps.forEach(prop => {
      if (this[prop as keyof Context] !== null) {
        result[prop as keyof ContextCfg] = this[prop as keyof Context];
      }
    });

    if (this.instructor) {
      result.instructor = this.instructor.asVersion(version);
    }
    if (this.team) {
      result.team = this.team.asVersion(version);
    }
    if (this.contextActivities) {
      result.contextActivities = this.contextActivities.asVersion(version);
    }
    if (this.statement) {
      result.statement = this.statement.asVersion(version);
    }

    return result as ContextCfg;
  }

  static fromJSON(contextJSON: string): Context {
    Logger.log("fromJSON", "Context");
    const _context: ContextCfg = JSON.parse(contextJSON);

    return new Context(_context);
  }
}