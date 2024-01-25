import { Agent } from "../Agent";
import { Activity } from "../Activity";
import { Verb } from "../Verb";
import { Result } from "../Result";
import { StatementsResult } from "../StatementResult";

export interface RecordStoreConfig {
  endpoint?: string;
  allowFail?: boolean;
  auth?: string;
  username?: string;
  password?: string;
  extended?: Record<string, unknown>;
  version?: string | null;
  alertOnRequestFailure?: boolean;
}

export interface DirectProps {
  name?: { [key: string]: string };
  description?: { [key: string]: string };
  moreInfo?: string;
  extensions?: { [key: string]: any };
  correctResponsesPattern?: string[];
  interactionType?: string;
}

export interface InteractionComponentCfg {
  id?: string;
  description?: { [key: string]: string };
}

export interface InteractionComponentProps {
  choices?: InteractionComponentCfg[];
  scale?: InteractionComponentCfg[];
  source?: InteractionComponentCfg[];
  target?: InteractionComponentCfg[];
  steps?: InteractionComponentCfg[];
}

export interface ActivityDefinitionCfg extends Partial<DirectProps>, Partial<InteractionComponentProps> {
  type?: string;
}

export interface AgentAccountCfg {
  homePage?: string | null;
  name?: string | null;
  accountServiceHomePage?: string | null;
  accountName?: string | null;
}

export interface QueryParams {
  agent?: Agent;
  actor?: Agent;
  object?: Activity | Agent; // Define other possible types for 'object' and 'target' as needed
  target?: Activity | Agent;
  instructor?: Agent;
  verb?: Verb | string;
  activity?: Activity | string;
  registration?: string;
  context?: boolean;
  since?: string;
  until?: string;
  limit?: number;
  authoritative?: boolean;
  sparse?: boolean;
  ascending?: boolean;
  related_activities?: boolean;
  related_agents?: boolean;
  format?: string;
  attachments?: boolean;
  [key: string]: any;
}

export interface QueryCfg {
  params?: QueryParams;
  callback?: (err: Error | null, response?: StatementsResult | null) => void;
}