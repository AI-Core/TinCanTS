import { Logger } from "./Logger";
import { AgentAccount } from "./AgentAccount";
import { Versions } from "./Versions";
import { AgentAccountCfg } from "./interfaces";


export interface AgentCfg {
  name?: string;
  mbox?: string;
  mbox_sha1sum?: string;
  openid?: string;
  account?: AgentAccount | AgentAccountCfg;
  firstName?: string;
  lastName?: string;
  familyName?: string;
  givenName?: string;
  objectType?: string;
//   [key: string]: string | AgentAccount | AgentAccountCfg | undefined;
}

export class Agent {
  objectType: string = "Agent";
  name: string | null = null;
  mbox: string | null = null;
  mbox_sha1sum: string | null = null;
  openid: string | null = null;
  account: AgentAccount | AgentAccountCfg | null = null;
  degraded: boolean = false;

  LOG_SRC = "Agent";

  constructor(cfg?: AgentCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: AgentCfg): void {
    this.log("init");
  
    cfg = cfg || {};
    if (cfg.lastName || cfg.firstName) {
      cfg.name = "";
      if (cfg.firstName && cfg.firstName.length > 0) {
        cfg.name = cfg.firstName[0];
        if (cfg.firstName.length > 1) {
          this.degraded = true;
        }
      }
  
      if (cfg.name !== "") {
        cfg.name += " ";
      }
  
      if (cfg.lastName && cfg.lastName.length > 0) {
        cfg.name += cfg.lastName[0];
        if (cfg.lastName.length > 1) {
          this.degraded = true;
        }
      }
    } else if (cfg.familyName || cfg.givenName) {
      cfg.name = "";
      if (cfg.givenName && cfg.givenName.length > 0) {
        cfg.name = cfg.givenName[0];
        if (cfg.givenName.length > 1) {
          this.degraded = true;
        }
      }
  
      if (cfg.name !== "") {
        cfg.name += " ";
      }
  
      if (cfg.familyName && cfg.familyName.length > 0) {
        cfg.name += cfg.familyName[0];
        if (cfg.familyName.length > 1) {
          this.degraded = true;
        }
      }
    }
    if (cfg.account) {
      this.account = cfg.account instanceof AgentAccount ? cfg.account : new AgentAccount(cfg.account);
    }

    if (cfg.name) {
      this.name = cfg.name;
    }
    if (cfg.mbox) {
      if (cfg.mbox.indexOf("mailto:") === -1) {
        cfg.mbox = "mailto:" + cfg.mbox;
      }
      this.mbox = cfg.mbox;
    }
    if (cfg.mbox_sha1sum) {
      this.mbox_sha1sum = cfg.mbox_sha1sum;
    }
    if (cfg.openid) {
      this.openid = cfg.openid;
    }
  }

  toString(): string {
    this.log("toString");

    if (this.name !== null) {
      return this.name;
    }
    if (this.mbox !== null) {
      return this.mbox.replace("mailto:", "");
    }
    if (this.mbox_sha1sum !== null) {
        return this.mbox_sha1sum;
    }
    if (this.openid !== null) {
        return this.openid;
    }
    if (this.account !== null) {
        return this.account.toString();
    }

    return this.objectType + ": unidentified";
  }

  asVersion(version: string = Versions[0]): AgentCfg {
    this.log("asVersion: " + version);
  
    const result: AgentCfg = {
      objectType: this.objectType
    };
  
    if (this.mbox !== null) {
      result.mbox = this.mbox;
    } else if (this.mbox_sha1sum !== null) {
      result.mbox_sha1sum = this.mbox_sha1sum;
    } else if (this.openid !== null) {
      result.openid = this.openid;
    } else if (this.account !== null) {
      const account = this.account as AgentAccount;
      result.account = account.asVersion(version);
    }
    if (this.name !== null) {
      result.name = this.name;
    }

  
    return result;
  }

  static fromJSON(agentJSON: string): Agent {
    Logger.log("fromJSON", "Agent");
    console.log(agentJSON)
    const _agent: AgentCfg = JSON.parse(agentJSON);
    if (Array.isArray(_agent.name) && _agent.name.length > 0) {
      console.log(_agent.name[0])
      _agent.name = _agent.name[0];
    }
    if (Array.isArray(_agent.mbox) && _agent.mbox.length > 0) {
      _agent.mbox = _agent.mbox[0];
    }
    return new Agent(_agent);
  }
}

export default Agent;
