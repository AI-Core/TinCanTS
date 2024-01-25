import { AgentAccount } from "../AgentAccount";

export interface IAgentAccountCfg {
  homePage?: string | null;
  name?: string | null;
  accountServiceHomePage?: string | null;
  accountName?: string | null;
}

export interface IAgentCfg {
  name?: string;
  mbox?: string;
  mbox_sha1sum?: string;
  openid?: string;
  account?: AgentAccount | IAgentAccountCfg;
  firstName?: string;
  lastName?: string;
  familyName?: string;
  givenName?: string;
  objectType?: string;
//   [key: string]: string | AgentAccount | AgentAccountCfg | undefined;
}