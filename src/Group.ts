import { Logger } from "./Logger";
import { Agent } from "./Agent";
import { IAgentCfg } from "./interfaces/Agent"

export interface GroupCfg extends IAgentCfg {
  member?: IAgentCfg[];
}

export class Group extends Agent {
  objectType: string = "Group";
  LOG_SRC: string = "Group";
  member: Agent[] = [];

  constructor(cfg?: GroupCfg) {
    super(cfg);
    this.log("constructor");

    if (cfg?.member) {
      cfg.member.forEach((m) => {
        if (m instanceof Agent) {
          this.member.push(m);
        } else {
          this.member.push(new Agent(m));
        }
      });
    }
  }

  log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  toString(): string {
    this.log("toString");

    const agentString = super.toString();
    return agentString !== "Agent: unidentified" ? `${this.objectType}: ${agentString}` : agentString;
  }

  asVersion(version: string = "1.0.0"): GroupCfg { // Replace with the actual default version if needed
    this.log("asVersion: " + version);
    const result: GroupCfg = super.asVersion(version);

    if (this.member.length > 0) {
      result.member = this.member.map((m) => m.asVersion(version));
    }

    return result;
  }

  static fromJSON(groupJSON: string): Group {
    const _group: GroupCfg = JSON.parse(groupJSON);
    return new Group(_group);
  }
}