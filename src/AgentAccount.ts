import { Logger } from "./Logger";
import { Versions } from "./Versions";
import { IAgentAccountCfg } from "./interfaces/Agent";

export class AgentAccount {
  homePage: string | null;
  name: string | null;
  private readonly LOG_SRC = "AgentAccount";

  constructor(cfg?: IAgentAccountCfg) {
    this.log("constructor");
    this.homePage = null;
    this.name = null;
    this.init(cfg);
  }

  private log(message: string): void {
    Logger.log(message, this.LOG_SRC);
  }

  private init(cfg?: IAgentAccountCfg): void {
    this.log("init");

    cfg = cfg || {};

    // handle .9 name changes
    if (cfg.accountServiceHomePage) {
      cfg.homePage = cfg.accountServiceHomePage;
    }
    if (cfg.accountName) {
      cfg.name = cfg.accountName;
    }

    const directProps: Array<keyof IAgentAccountCfg> = ["name", "homePage"];

    directProps.forEach(prop => {
      if (cfg && cfg[prop] !== undefined) {
        (this as any)[prop] = cfg[prop];
      }
    });
  }

  toString(): string {
    this.log("toString");
    let result = "";

    if (this.name !== null || this.homePage !== null) {
      result += this.name !== null ? this.name : "-";
      result += ":";
      result += this.homePage !== null ? this.homePage : "-";
    } else {
      result = "AgentAccount: unidentified";
    }

    return result;
  }

  asVersion(version: string = Versions[0]): IAgentAccountCfg {
    this.log("asVersion: " + version);
    const result: IAgentAccountCfg = {};

    if (version === "0.9") {
      result.accountName = this.name;
      result.accountServiceHomePage = this.homePage;
    } else {
      result.name = this.name;
      result.homePage = this.homePage;
    }

    return result;
  }

  static fromJSON(acctJSON: string): AgentAccount {
    const _acct: IAgentAccountCfg = JSON.parse(acctJSON);
    return new AgentAccount(_acct);
  }
}