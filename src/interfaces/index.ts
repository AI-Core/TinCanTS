import { Agent } from "../Agent";
import { Activity } from "../Activity";
import { Verb } from "../Verb";
import { ActivityProfile } from "../ActivityProfile";
import { StatementsResult } from "../StatementResult";
import { AgentProfile } from "../AgentProfile";
import { State } from "../State";

export interface IRecordStoreCfg {
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

export interface IGetStatementParams {
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

export interface IGetStatementCfg {
  params?: IGetStatementParams;
  sendActor?: boolean;
  sendActivity?: boolean;
  callback?: (err: Error | null, response?: StatementsResult | null) => void;
}

export interface IDropStateCfg {
  activity: Activity;
  agent: Agent;
  registration?: string;
  callback?: (error: Error | null, response?: Response) => void;
  requestHeaders?: { [key: string]: string };
}

export interface IRetrieveActivityProfileCfg {
  activity?: Activity; 
  callback?: (error: Error | null, result?: ActivityProfile) => void;
  requestHeaders?: { [key: string]: string };
}

export interface ISaveActivityProfileCfg {
  activity: Activity; 
  lastSHA1?: string;
  contentType?: string;
  overwriteJSON?: boolean;
  method?: 'PUT' | 'POST';
  callback?: (error: Error | null) => void;
  requestHeaders?: { [key: string]: string };
}

export interface IDropActivityProfileCfg {
  activity: Activity;
  callback?: (error: Error | null) => void;
  requestHeaders?: { [key: string]: string };
}

export interface IRetrieveAgentProfileCfg {
  agent: Agent;
  callback?: (error: Error | null, result?: AgentProfile | null) => void;
  requestHeaders?: { [key: string]: string };
}

export interface ISaveAgentProfileCfg {
  agent?: Agent;
  lastSHA1?: string;
  contentType?: string;
  method?: 'PUT' | 'POST';
  overwriteJSON: boolean;
  callback?: (err: Error | null, response?: Response) => void;
  requestHeaders?: { [key: string]: string };
}

export interface IDropAgentProfileConfig {
  agent: Agent;
  callback?: (err: Error | null, response?: Response) => void;
  requestHeaders?: { [key: string]: string };
}

export interface ISaveStateCfg {
  activity: Activity;
  agent: Agent;
  registration?: string;
  lastSHA1?: string;
  contentType?: string;
  method?: 'PUT' | 'POST';
  overwriteJSON?: boolean;
  callback?: (error: Error | null, response?: Response) => void;
  requestHeaders?: { [key: string]: string };
}

export interface ISaveStatementCfg {
  callback?: (err: Error | null, response?: Response | null) => void
}

export interface IRetrieveStateCfg {
  activity: Activity;
  agent: Agent;
  registration?: string;
  callback?: (error: Error | null, result?: State) => void;
  requestHeaders?: { [key: string]: string };
}