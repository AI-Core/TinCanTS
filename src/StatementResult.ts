import { Logger } from "./Logger";
import { Statement, StatementCfg } from "./Statement";

interface StatementsResultCfg {
  statements?: Statement[] | StatementCfg[] | null;
  more?: string;
}

export class StatementsResult {
  statements: Statement[] | null = null;
  more: string | null = null;
  private readonly LOG_SRC = "StatementsResult";

  constructor(cfg?: StatementsResultCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: StatementsResultCfg): void {
    this.log("init");

    cfg = cfg || {};

    if ("statements" in cfg && cfg.statements !== null) {
      this.statements = cfg.statements ? cfg.statements.map(stmt => new Statement(stmt as StatementCfg)) : [];
    }

    if (cfg.hasOwnProperty("more")) {
      this.more = cfg.more ? cfg.more : null;
    }
  }

  static fromJSON(resultJSON: any): StatementsResult {
    Logger.log("fromJSON", "StatementsResult");
    let _result: StatementsResultCfg;

    try {
      _result = resultJSON;
    } catch (parseError) {
      Logger.log("fromJSON - JSON.parse error: " + parseError, "StatementsResult");
      throw parseError;
    }

    if (_result && _result.statements) {
      _result.statements = _result.statements.map(stmt => {
        try {
          return new Statement(stmt as StatementCfg);
        } catch (error) {
          Logger.log("fromJSON - statement instantiation failed: " + error + " (" + JSON.stringify(stmt) + ")", "StatementsResult");
          return new Statement({ id: stmt.id } as StatementCfg);
        }
      });
    }

    return new StatementsResult(_result);
  }
}