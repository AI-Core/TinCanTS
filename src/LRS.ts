import {
  IRecordStoreCfg,
  IDropStateCfg,
  IRetrieveActivityProfileCfg,
  ISaveActivityProfileCfg,
  IDropActivityProfileCfg,
  IRetrieveAgentProfileCfg,
  ISaveAgentProfileCfg,
  IDropAgentProfileConfig,
  IGetStatementCfg,
  IGetStatementParams,
  ISaveStateCfg,
  IRetrieveStateCfg,
  ISaveStatementCfg
} from "./interfaces";
import { Utils } from "./Utils";
import { Statement } from "./Statement";
import { About } from "./About";
import { Attachment, AttachmentCfg } from "./Attachment";
import { Logger } from "./Logger";
import { Versions } from "./Versions";
import { StatementsResult } from "./StatementResult";
import { Agent } from "./Agent";
import { Activity } from "./Activity";
import { State } from "./State";
import { ActivityProfile } from "./ActivityProfile";
import { AgentProfile } from "./AgentProfile";

interface IRetrieveStateIdsCfg {
  activity: Activity;
  agent: Agent;
  registration?: string;
  callback?: (error: Error | null, result?: string[]) => void;
  since?: string;
  requestHeaders?: { [key: string]: string };
}

interface IRequestCfg {
  url: string;
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' | string;
  params?: { [key: string]: any };
  data?: string | ArrayBuffer | Blob;
  headers: { [key: string]: string };
  callback?: (err: Error | null, response?: Response) => void;
  expectMultipart?: boolean;
  ignore404?: boolean;
}

interface IRetrieveActivityCfg {
  callback?: (error: Error | null, result?: Activity) => void;
  requestHeaders?: { [key: string]: string };
}

interface IRetrieveActivityProfileIdsCfg {
  activity: Activity;
  callback?: (error: Error | null, result?: string[]) => void;
  since?: string;
  requestHeaders?: { [key: string]: string };
}

interface RetrieveAgentProfileIdsConfig {
  agent: Agent;
  callback?: (err: Error | null, result?: string[] | null) => void;
  since?: string;
  requestHeaders?: { [key: string]: string };
}

interface IGetStatementResultsParams {
  attachments?: boolean;
}

export class LRS {
  endpoint: string | null = null;
  version?: string | null = null;
  auth: string | null = null;
  allowFail: boolean = true;
  extended: Record<string, unknown> | null = null;

  private readonly LOG_SRC = "LRS";

  constructor(cfg: any) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(message: string): void {
    Logger.log(message, this.LOG_SRC);
  }

  private init(cfg: IRecordStoreCfg): void {
    this.log("init");
    this.log("init - cfg: " + JSON.stringify(cfg));

    const versions: string[] = Versions;
    let versionMatch = false;

    if (!cfg.endpoint || cfg.endpoint === "") {
      console.error("LRS invalid: no endpoint");
      throw { code: 3, mesg: "LRS invalid: no endpoint" };
    }

    this.endpoint = String(cfg.endpoint);
    if (this.endpoint.slice(-1) !== "/") {
      console.log("adding trailing slash to endpoint");
      this.endpoint += "/";
    }

    if (cfg?.allowFail !== undefined) {
      this.log("setting allowFail: " + cfg.allowFail);
      this.allowFail = cfg.allowFail;
    }
    if (cfg?.auth) this.auth = cfg.auth;
    if (cfg?.extended) this.extended = cfg.extended;
    else if (cfg?.username && cfg?.password) {
      // TODO: Add assertion so both username and password are present
      this.auth = "Basic " + Utils.getBase64String(cfg.username + ":" + cfg.password);
    }
    if (cfg?.version) {
      versions.forEach(version => {
        if (version === cfg.version) versionMatch = true;
      });
      if (!versionMatch) {
        console.error("LRS invalid: version not supported (" + cfg.version + ")");
        throw { code: 5, mesg: "LRS invalid: version not supported (" + cfg.version + ")" };
      }
      this.version = cfg.version;
    } else {
      this.version = versions[0];
    }
  }

  async sendRequest(cfg: IRequestCfg): Promise<Response | void> {
    this.log("sendRequest");
    let fullUrl = this.endpoint + cfg.url;
    this.log("sendRequest - fullUrl: " + fullUrl);

    if (cfg.url.startsWith("http")) {
        fullUrl = cfg.url;
    }

    cfg.params = cfg.params || {};
    if (this.extended !== null) {
        for (const prop in this.extended) {
            if (this.extended.hasOwnProperty(prop) && !cfg.params.hasOwnProperty(prop)) {
                cfg.params[prop] = this.extended[prop];
            }
        }
    }

    const headers = cfg.headers || {};
    headers["Authorization"] = this.auth || '';
    if (this.version && this.version !== "0.9") {
        headers["X-Experience-API-Version"] = this.version;
    }

    try {
        const response = await this._makeRequest(fullUrl, {
            ...cfg,
            headers: headers
        });

        if (cfg.callback) {
            cfg.callback(null, response as Response);
            return;
        }
        return response;
    } catch (error) {
        if (cfg.callback) {
            cfg.callback(error as Error);
        } else {
            throw error;
        }
    }
  }

  private async _makeRequest(fullUrl: string, cfg: IRequestCfg): Promise<Response | void> {
    this.log("makeRequest");
    let queryString = '';

    if (cfg.params) {
        const queryParams = new URLSearchParams();
        for (const key in cfg.params) {
            if (cfg.params.hasOwnProperty(key)) {
                queryParams.append(key, cfg.params[key]);
            }
        }
        queryString = queryParams.toString();
    }

    if (queryString) {
        fullUrl += '?' + queryString;
    }

    this.log("makeRequest - fullUrl: " + fullUrl)
    const headers = new Headers(cfg.headers || {});
    if (this.version && this.version !== "0.9") {
        headers.set("X-Experience-API-Version", this.version);
    }
    if (this.auth) {
      headers.set("Authorization", this.auth);
    }

    this.log("makeRequest - cfg" + JSON.stringify(cfg.data));
    console.log("fullUrl: " + fullUrl);

    try {
        const response = await fetch(fullUrl, {
            method: cfg.method,
            headers: headers,
            body: cfg.data instanceof ArrayBuffer ? null : cfg.data
        });
        console.log("makeRequest - response: " + JSON.stringify(response));
        // await response.json());

        if (cfg.expectMultipart) {
            console.warn("expectMultipart is not supported");
            return response;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        if (cfg.callback) {
            cfg.callback(null, response);
        } else {
            return response;
        }
    } catch (error) {
      this.log("sendRequest caught fetch exception: " + error);
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  private _getMultipartRequestData(boundary: string, jsonContent: any, requestAttachments: AttachmentCfg[] | Attachment[]): Blob {
    const parts: BlobPart[] = [];

    // Add JSON content
    parts.push(this._createJSONSegment(boundary, jsonContent));

    // Add attachments
    for (const attachment of requestAttachments) {
        if (attachment.content) {
          parts.push(this._createAttachmentSegment(
            boundary,
            attachment.content,
            attachment.sha2 as string,
            attachment.contentType as string));
        }
    }

    // Final boundary
    parts.push(`\r\n--${boundary}--\r\n`);

    return new Blob(parts, { type: 'multipart/mixed; boundary=' + boundary });
  }

  private _createJSONSegment(boundary: string, jsonContent: any): string {
    return [
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        JSON.stringify(jsonContent),
        ''
    ].join('\r\n');
  }

  private _createAttachmentSegment(boundary: string, content: Blob | ArrayBuffer, sha2: string, contentType: string): Blob {
    const header = [
        `--${boundary}`,
        `Content-Type: ${contentType}`,
        'Content-Transfer-Encoding: binary',
        `X-Experience-API-Hash: ${sha2}`,
        '',
        ''
    ].join('\r\n');

    return new Blob([header, content], { type: contentType });
  }

  private async _processGetStatementResult(response: Response, params: IGetStatementResultsParams): Promise<Statement> {
    if (!params.attachments) {
        const jsonResponse = await response.json();
        return Statement.fromJSON(jsonResponse);
    }

    const contentType = response.headers.get("Content-Type") || "";
    const boundary = contentType.split("boundary=")[1];

    const responseText = await response.text();
    const parsedResponse = this._parseMultipart(boundary, responseText);

    const statementJson = JSON.parse(parsedResponse[0].body);
    const attachmentMap: { [key: string]: string } = {};
    for (let i = 1; i < parsedResponse.length; i++) {
        attachmentMap[parsedResponse[i].headers["X-Experience-API-Hash"]] = parsedResponse[i].body;
    }

    this._assignAttachmentContent([statementJson], attachmentMap);

    return new Statement(statementJson);
  }

  // Placeholder for _parseMultipart method
  private _parseMultipart(boundary: string, responseText: string): any[] {
    const __boundary = "--" + boundary;
    let sliceStart = responseText.indexOf(__boundary);
    const parts: any[] = [];
    const CRLF = "\r\n".length;

    while (sliceStart !== -1) {
      let sliceEnd = responseText.indexOf(__boundary, sliceStart + __boundary.length);

      let headerStart = sliceStart + __boundary.length + CRLF;
      let headerEnd = responseText.indexOf("\r\n\r\n", sliceStart);
      let bodyStart = headerEnd + CRLF + CRLF;
      let bodyEnd = sliceEnd - CRLF;

      let headers = this._parseHeaders(responseText.substring(headerStart, headerEnd));
      let body = responseText.substring(bodyStart, bodyEnd);

      if (parts.length === 0) {
        //ODO: Additional processing if needed for the first part
      }

      parts.push({ headers, body });

      sliceStart = (sliceEnd === -1) ? -1 : responseText.indexOf(__boundary, sliceEnd + __boundary.length);
    }

    return parts;
  }

  private _parseHeaders(rawHeaders: string): { [key: string]: string } {
    const headers: { [key: string]: string } = {};
    const headerList = rawHeaders.split("\n");

    for (let i = 0; i < headerList.length; i++) {
      const h = headerList[i].split(":", 2);

      if (h.length === 2) {
        headers[h[0].trim()] = h[1].trim();
      }
    }

    return headers;
  }

  private _assignAttachmentContent(stmts: any[], attachmentMap: { [key: string]: string }): any[] {
    for (let i = 0; i < stmts.length; i++) {
        if (stmts[i].attachments && stmts[i].attachments.length > 0) {
            for (let j = 0; j < stmts[i].attachments.length; j++) {
                const sha2 = stmts[i].attachments[j].sha2;
                if (attachmentMap.hasOwnProperty(sha2)) {
                    stmts[i].attachments[j].content = attachmentMap[sha2];
                }
            }
        }
    }
    return stmts;
  }

  private _getBoundary(): string {
    return Utils.getUUID().replace(/-/g, "");
  }

  async about(cfg?: {
    callback?: (err: Error | null, result?: any) => void,
    params?: { [key: string]: any }
  }): Promise<any> {
    this.log("about");
    cfg = cfg || {};

    const requestCfg = {
      url: "about",
      method: "GET",
      params: cfg.params || {},
      headers: {}
    };

    try {
      const response = await this.sendRequest(requestCfg);

      let result;
      if (response instanceof Response) {
        if (response.ok) {
          const jsonResponse = await response.json();
          this.log("about - response: " + JSON.stringify(jsonResponse));
          result = About.fromJSON(jsonResponse);
        } else {
          throw new Error(`HTTP Error: ${response?.status} ${response?.statusText}`);
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result);
      } else {
        return result;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }
  
  async saveStatement(stmt: Statement, cfg?: ISaveStatementCfg): Promise<Response | void> {
    this.log("saveStatement");
    cfg = cfg || {} as ISaveStatementCfg;

    let versionedStatement;
    try {
      versionedStatement = stmt.asVersion(this.version as string);
      this.log("saveStatement - versionedStatement: " + JSON.stringify(versionedStatement));
    } catch (ex) {
      if (this.allowFail) {
        this.log("[warning] statement could not be serialized in version (" + this.version + "): " + ex);
        if (cfg.callback) {
          cfg.callback(null);
          return;
        }
        return;
      }

      this.log("[error] statement could not be serialized in version (" + this.version + "): " + ex);
      if (cfg.callback) {
        cfg.callback(ex as Error);
        return;
      }
      throw ex;
    }

    const requestCfg: IRequestCfg = {
      url: "statements",
      headers: {},
      method: stmt.id ? "PUT" : "POST",
      params: stmt.id ? { statementId: stmt.id } : undefined
    };

    if (versionedStatement.attachments && stmt.hasAttachmentWithContent() && stmt.attachments) {
      const boundary = this._getBoundary();
      requestCfg.headers["Content-Type"] = "multipart/mixed; boundary=" + boundary;
      requestCfg.data = this._getMultipartRequestData(boundary, versionedStatement, stmt.attachments);
    } else {
      requestCfg.headers["Content-Type"] = "application/json";
      requestCfg.data = JSON.stringify(versionedStatement);
    }

    try {
      const response = await this.sendRequest(requestCfg);
      if (cfg.callback) {
        cfg.callback(null, response as Response);
      } else {
        return response;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async saveStatements(stmts: Statement[], cfg?: {
    callback?: (err: Error | null, response?: Response | null) => void
  }): Promise<Response | void> {
    this.log("saveStatements");

    cfg = cfg ?? {};

    if (stmts.length === 0) {
      const noStatementsError = new Error("no statements");
      if (cfg.callback) {
        cfg.callback(noStatementsError);
      } else {
        throw noStatementsError;
      }
      return;
    }

    let versionedStatements: any[] = [];
    let requestAttachments: Attachment[] = [];
    let boundary: string | undefined;

    for (const stmt of stmts) {
      try {
        const versionedStatement = stmt.asVersion(this.version as string);

        if (stmt.hasAttachmentWithContent() && stmt.attachments) {
          requestAttachments = requestAttachments.concat(
            stmt.attachments.filter(att => att.content !== null)
          );
        }

        versionedStatements.push(versionedStatement);
      } catch (ex) {
        if (this.allowFail) {
          this.log("[warning] statement could not be serialized in version (" + this.version + "): " + ex);
          if (cfg.callback) {
            cfg.callback(null, null);
            return;
          }
          return;
        }

        this.log("[error] statement could not be serialized in version (" + this.version + "): " + ex);
        if (cfg.callback) {
          cfg.callback(ex as Error, null);
          return;
        }
        throw ex;
      }
    }

    const requestCfg: IRequestCfg = {
      url: "statements",
      method: "POST",
      headers: {}
    };

    if (requestAttachments.length !== 0) {
      boundary = this._getBoundary();
      requestCfg.headers["Content-Type"] = `multipart/mixed; boundary=${boundary}`;
      requestCfg.data = this._getMultipartRequestData(boundary, versionedStatements, requestAttachments);
    } else {
      requestCfg.headers["Content-Type"] = "application/json";
      requestCfg.data = JSON.stringify(versionedStatements);
    }

    if (cfg.callback) {
      requestCfg.callback = cfg.callback;
    }

    try {
      const response = await this.sendRequest(requestCfg);
      return response;
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveStatement(stmtId: string, cfg?: {
    params?: { attachments?: boolean },
    callback?: (err: Error | null, result?: Statement) => void
  }): Promise<Statement | void> {
    this.log("retrieveStatement");

    cfg = cfg || {};
    const params = cfg.params || {};

    const requestCfg: IRequestCfg = {
      url: "statements",
      method: "GET",
      params: {
        statementId: stmtId,
        attachments: params.attachments || false
      },
      headers: {}
    };

    if (params.attachments) {
      requestCfg.expectMultipart = true;
    }

    try {
      const response = await this.sendRequest(requestCfg);
      
      let result: Statement | null = null;
      
      if (response instanceof Response && response.ok) {
        result = await this._processGetStatementResult(response, params);
      }

      if (cfg.callback) {
        cfg.callback(null, result as Statement);
      } else {
        return result as Statement;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveVoidedStatement(stmtId: string, cfg?: {
    params?: { attachments?: boolean },
    callback?: (err: Error | null, result?: Statement) => void
  }): Promise<Statement | void> {
    this.log("retrieveVoidedStatement");

    cfg = cfg ?? {};
    const params = cfg.params ?? {};

    const requestCfg: IRequestCfg = {
      url: "statements",
      method: "GET",
      params: {},
      headers: {}
    };

    if (this.version === "0.9" || this.version === "0.95") {
      requestCfg.params = {
        statementId: stmtId
      };

    } else {
      requestCfg.params = {
        voidedStatementId: stmtId
      };
      if (params.attachments) {
        requestCfg.params.attachments = true;
        requestCfg.expectMultipart = true;
      }
    }

    try {
      const response = await this.sendRequest(requestCfg);
      
      let result: Statement | null = null;
      if (response instanceof Response && response.ok) {
        result = await this._processGetStatementResult(response, params);
      }

      if (cfg.callback) {
        cfg.callback(null, result as Statement);
      } else {
        return result as Statement;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async queryStatements(cfg: IGetStatementCfg): Promise<StatementsResult | void> {
    this.log("queryStatements");

    cfg = cfg || {};
    const params = cfg.params ?? {};

    let requestCfg: IRequestCfg;
    try {
      requestCfg = this._queryStatementsRequestCfg(cfg);

      console.log("queryStatements - requestCfg: " + JSON.stringify(requestCfg));

      if (params.attachments) {
        requestCfg.expectMultipart = true;
      }
    } catch (ex) {
      this.log("[error] Query statements failed - " + ex);
      if (cfg.callback) {
        cfg.callback(ex as Error, new StatementsResult());
      }
      throw ex;
    }

    try {
      const response = await this.sendRequest(requestCfg);

      let result: StatementsResult | null = null;
      if (response instanceof Response && response.ok) {
        if (!params.attachments) {
          const jsonResponse = await response.json();
          result = StatementsResult.fromJSON(jsonResponse);
        } else {
          const contentType = response.headers.get("Content-Type") ?? "";
          const boundary = contentType.split("boundary=")[1];

          const responseText = await response.text();
          const parsedResponse = this._parseMultipart(boundary, responseText);

          const statementJson = JSON.parse(parsedResponse[0].body);
          const attachmentMap: { [key: string]: string } = {};
          for (let i = 1; i < parsedResponse.length; i++) {
              attachmentMap[parsedResponse[i].headers["X-Experience-API-Hash"]] = parsedResponse[i].body;
          }

          this._assignAttachmentContent([statementJson], attachmentMap);

          result = new StatementsResult({ statements: [statementJson] });
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as StatementsResult);
      } else {
        return result as StatementsResult;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error, null);
      } else {
        throw error;
      }
    }
  }

  private _queryStatementsRequestCfg(cfg: { params?: IGetStatementParams }): any {
    this.log("_queryStatementsRequestCfg");

    const params: any = {};
    const returnCfg = {
      url: "statements",
      method: "GET" as const,
      params: params
    };
    const jsonProps = [
      "agent",
      "actor",
      "object",
      "instructor"
    ];

    const idProps = [
      "verb",
      "activity"
    ];

    const valProps = [
      "registration",
      "context",
      "since",
      "until",
      "limit",
      "authoritative",
      "sparse",
      "ascending",
      "related_activities",
      "related_agents",
      "format",
      "attachments"
    ];

    const universal: { [key: string]: boolean } = {
      verb: true,
      registration: true,
      since: true,
      until: true,
      limit: true,
      ascending: true,
    };

    const compatibility: { [version: string]: { supported: { [key: string]: boolean } } } = {
      "0.9": {
        supported: {
          actor: true,
          instructor: true,
          target: true,
          object: true,
          context: true,
          authoritative: true,
          sparse: true
        }
      },
      "1.0.0": {
        supported: {
          agent: true,
          activity: true,
          related_activities: true,
          related_agents: true,
          format: true,
          attachments: true
        }
      },
    };

    compatibility["0.95"] = compatibility["0.9"];
    compatibility["1.0.1"] = compatibility["1.0.0"];
    compatibility["1.0.2"] = compatibility["1.0.0"];
    compatibility["1.0.3"] = compatibility["1.0.0"];

    if (cfg.params?.target) {
      cfg.params.object = cfg.params.target;
    }

    for (const prop in cfg.params) {
      if (cfg.params.hasOwnProperty(prop)) {
        if (!this.version) {
          this.version = Versions[0];
        }
        if (!universal[prop] && !compatibility[this.version].supported[prop]) {
          throw new Error("Unrecognized query parameter configured: " + prop);
        }
      }
    }

    jsonProps.forEach(prop => {
      if (cfg.params?.[prop]) {
        params[prop] = JSON.stringify(cfg.params[prop].asVersion(this.version));
      }
    });

    idProps.forEach(prop => {
      if (cfg.params?.[prop]) {
        params[prop] = typeof cfg.params[prop].id === 'undefined' ? cfg.params[prop] : cfg.params[prop].id;
      }
    });

    valProps.forEach(prop => {
      if (cfg.params?.[prop] !== undefined && cfg.params[prop] !== null) {
        params[prop] = cfg.params[prop];
      }
    });

    return returnCfg;
  }

  async moreStatements(cfg: {
    url: string,
    callback?: (err: Error | null, response?: StatementsResult) => void
  }): Promise<StatementsResult | void> {
    this.log("moreStatements: " + cfg.url);
    if (this.endpoint === null) {
      throw new Error("LRS does not have an endpoint");
    }
  
    const parsedURL = Utils.parseURL(cfg.url, { allowRelative: true });
    const serverRoot = Utils.getServerRoot(this.endpoint);
  
    // Adjust the path of the parsed URL to be relative to the endpoint or server root
    let path = parsedURL.path;
    if (path?.indexOf("/statements") === 0) {
      path = this.endpoint.replace(serverRoot, "") + path;
      this.log("converting non-standard more URL to " + path);
    }
    if (path?.indexOf("/") !== 0) {
      path = "/" + path;
    }
  
    const requestCfg: IRequestCfg = {
      method: "GET",
      url: serverRoot + path,
      params: parsedURL.params,
      headers: {}
    };
  
    try {
      const response = await this.sendRequest(requestCfg);
      let result: StatementsResult | null = null;
  
      if (response instanceof Response && response.ok) {
        const jsonResponse = await response.json();
        result = StatementsResult.fromJSON(jsonResponse);
      }
  
      if (cfg.callback) {
        cfg.callback(null, result as StatementsResult);
      } else {
        return result as StatementsResult;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveState(key: string, cfg: IRetrieveStateCfg): Promise<State | void> {
    this.log("retrieveState");
    const requestHeaders = cfg.requestHeaders ?? {};
    const requestParams: any = {
      stateId: key,
      activityId: cfg.activity.id
    };

    if (this.version === "0.9") {
      requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
      requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    if (cfg.registration !== undefined && cfg.registration !== null) {
      if (this.version === "0.9") {
        requestParams.registrationId = cfg.registration;
      } else {
        requestParams.registration = cfg.registration;
      }
    }

    const requestCfg: IRequestCfg = {
      url: "activities/state",
      method: "GET",
      params: requestParams,
      ignore404: true,
      headers: requestHeaders
    };

    try {
      const response = await this.sendRequest(requestCfg);
      let result: State | null = null;

      if (response instanceof Response) {
        if (response.ok) {
          const content = await response.text();
          result = new State({
            id: key,
            contents: content,
            etag: response.headers.get("ETag") ?? "",
            contentType: response.headers.get("Content-Type") ?? ""
          });

          if (Utils.isApplicationJSON(result.contentType as string)) {
            try {
              result.contents = JSON.parse(result.contents as string);
            } catch (ex) {
              this.log("retrieveState - failed to deserialize JSON: " + ex);
            }
          }
        } else if (response.status === 404) {
          result = new State({
            id: key,
            contents: "",
            etag: "",
            contentType: ""
          });
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as State);
      } else {
        return result as State;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveStateIds(cfg: IRetrieveStateIdsCfg): Promise<string[] | void> {
    this.log("retrieveStateIds");
    const requestHeaders = cfg.requestHeaders ?? {};
    const requestParams: any = {
      activityId: cfg.activity.id
    };

    if (this.version === "0.9") {
      requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
      requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    if (cfg.registration !== undefined && cfg.registration !== null) {
      if (this.version === "0.9") {
        requestParams.registrationId = cfg.registration;
      } else {
        requestParams.registration = cfg.registration;
      }
    }

    if (cfg.since) {
      requestParams.since = cfg.since;
    }

    const requestCfg: IRequestCfg = {
      url: "activities/state",
      method: "GET",
      params: requestParams,
      headers: requestHeaders,
      ignore404: true
    };

    try {
      const response = await this.sendRequest(requestCfg);
      let result: string[] | null = null;

      if (response instanceof Response) {
        if (response.ok) {
          result = await response.json();
        } else if (response?.status === 404) {
          result = [];
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as string[]);
      } else {
        return result as string[];
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }
  async saveState(key: string, val: any, cfg: ISaveStateCfg): Promise<Response | void> {
    this.log("saveState");

    const requestHeaders = cfg.requestHeaders || {};
    cfg.contentType = cfg.contentType || "application/octet-stream";
    requestHeaders["Content-Type"] = cfg.contentType;

    if (typeof val === "object" && cfg.contentType === "application/json") {
      val = JSON.stringify(val);
    }

    cfg.method = cfg.method === "POST" ? "POST" : "PUT";

    const requestParams: any = {
      stateId: key,
      activityId: cfg.activity.id
    };

    if (this.version === "0.9") {
      requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
      requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    if (cfg.registration !== undefined && cfg.registration !== null) {
      requestParams.registration = cfg.registration;
    }

    const requestCfg: IRequestCfg = {
      url: "activities/state",
      method: cfg.method,
      params: requestParams,
      data: val,
      headers: requestHeaders
    };

    if (cfg.lastSHA1) {
      requestCfg.headers["If-Match"] = cfg.lastSHA1;
    }

    try {
      const response = await this.sendRequest(requestCfg);
      
      if (cfg.callback) {
        cfg.callback(null, response as Response);
      } else {
        return response;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async dropState(key: string | null, cfg: IDropStateCfg): Promise<Response | void> {
    this.log("dropState");

    const requestHeaders = cfg.requestHeaders || {};

    const requestParams: any = {
      activityId: cfg.activity.id
    };

    if (this.version === "0.9") {
      requestParams.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
      requestParams.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    if (key !== null) {
      requestParams.stateId = key;
    }

    if (cfg.registration !== undefined && cfg.registration !== null) {
      requestParams.registration = cfg.registration;
    }

    const requestCfg: IRequestCfg = {
      url: "activities/state",
      method: "DELETE",
      params: requestParams,
      headers: requestHeaders
    };

    try {
      const response = await this.sendRequest(requestCfg);

      if (cfg.callback) {
        cfg.callback(null, response as Response);
      } else {
        return response;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveActivity(activityId: string, cfg: IRetrieveActivityCfg): Promise<Activity | void> {
    this.log("retrieveActivity");

    const requestHeaders = cfg.requestHeaders || {};

    const requestCfg: IRequestCfg = {
      url: "activities",
      method: "GET",
      params: {
        activityId: activityId
      },
      ignore404: true,
      headers: requestHeaders
    };

    try {
      const response = await this.sendRequest(requestCfg);

      let result: Activity | null = null;
      if (response instanceof Response && response.ok) {
        if (response.status === 404) {
          result = new Activity({ id: activityId });
        } else {
          const jsonResponse = await response.json();
          result = Activity.fromJSON(jsonResponse);
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as Activity);
      } else {
        return result as Activity;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveActivityProfile(key: string, cfg: IRetrieveActivityProfileCfg): Promise<ActivityProfile | void> {
    this.log("retrieveActivityProfile");

    const requestHeaders = cfg.requestHeaders || {};

    const requestCfg: IRequestCfg = {
      url: "activities/profile",
      method: "GET",
      params: {
        profileId: key,
        activityId: cfg.activity?.id
      },
      ignore404: true,
      headers: requestHeaders
    };

    try {
      const response = await this.sendRequest(requestCfg);

      let result: ActivityProfile | null = null;
      if (response instanceof Response && response.ok) {
        if (response.status === 404) {
          result = null;
        } else {
          const jsonResponse = await response.text();
          result = new ActivityProfile({ // Ensure ActivityProfile type is defined
            id: key,
            activity: cfg.activity,
            contents: jsonResponse
          });

          const etag = response.headers.get("ETag");
          if (etag) {
            result.etag = etag;
          }

          const contentType = response.headers.get("Content-Type");
          if (contentType && Utils.isApplicationJSON(contentType)) {
            try {
              result.contents = JSON.parse(jsonResponse);
            } catch (ex) {
              this.log("retrieveActivityProfile - failed to deserialize JSON: " + ex);
            }
          }
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as ActivityProfile);
      } else {
        return result as ActivityProfile;
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }
  async retrieveActivityProfileIds(cfg: IRetrieveActivityProfileIdsCfg): Promise<string[] | void> {
    this.log("retrieveActivityProfileIds");

    const requestHeaders = cfg.requestHeaders || {};

    const requestCfg: IRequestCfg = {
      url: "activities/profile",
      method: "GET",
      params: {
        activityId: cfg.activity.id,
        ...(cfg.since ? { since: cfg.since } : {})
      },
      headers: requestHeaders,
      ignore404: true
    };

    try {
      const response = await this.sendRequest(requestCfg);

      let result: string[] | null = null;
      if (response instanceof Response) {
        if (response instanceof Response && response.ok) {
          const jsonResponse = await response.text();
          result = JSON.parse(jsonResponse);
        } else if (response?.status === 404) {
          result = [];
        }
      }

      if (cfg.callback) {
        cfg.callback(null, result as string[]);
      } else {
        return result as string[];
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async saveActivityProfile(key: string, val: any, cfg: ISaveActivityProfileCfg): Promise<void> {
    this.log("saveActivityProfile");

    const requestHeaders = cfg.requestHeaders || {};
    cfg.contentType = cfg.contentType || "application/octet-stream";
    requestHeaders["Content-Type"] = cfg.contentType;

    cfg.method = cfg.method === "POST" ? "POST" : "PUT";

    if (typeof val === "object" && cfg.contentType === "application/json") {
      val = JSON.stringify(val);
    }

    const requestCfg: IRequestCfg = {
      url: "activities/profile",
      method: cfg.method,
      params: {
        profileId: key,
        activityId: cfg.activity.id
      },
      data: val,
      headers: requestHeaders
    };

    if (cfg.lastSHA1) {
      requestCfg.headers["If-Match"] = cfg.lastSHA1;
    } else {
      requestCfg.headers["If-None-Match"] = "*";
    }

    try {
      await this.sendRequest(requestCfg);
      if (cfg.callback) {
        cfg.callback(null);
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async dropActivityProfile(key: string, cfg: IDropActivityProfileCfg): Promise<void> {
    this.log("dropActivityProfile");

    const requestHeaders = cfg.requestHeaders || {};

    const requestCfg: IRequestCfg = {
      url: "activities/profile",
      method: "DELETE",
      params: {
        profileId: key,
        activityId: cfg.activity.id
      },
      headers: requestHeaders
    };

    try {
      await this.sendRequest(requestCfg);
      if (cfg.callback) {
        cfg.callback(null);
      }
    } catch (error) {
      if (cfg.callback) {
        cfg.callback(error as Error);
      } else {
        throw error;
      }
    }
  }

  async retrieveAgentProfile(key: string, cfg: IRetrieveAgentProfileCfg): Promise<AgentProfile | void> {
    this.log("retrieveAgentProfile");

    const requestHeaders = cfg.requestHeaders ?? {};
    let url = '';

    const params: any = {
        profileId: key
    };

    if (this.version === "0.9") {
        url = "actors/profile";
        params.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
        url = "agents/profile";
        params.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    const requestCfg: IRequestCfg = {
        method: "GET",
        url: url,
        params: params,
        headers: requestHeaders,
        ignore404: true
    };

    try {
      const response = await this.sendRequest(requestCfg);

      if (response instanceof Response) {
        if (response?.status === 404) {
            cfg.callback?.(null, null);
            return
        }

        const result = new AgentProfile({
            id: key,
            agent: cfg.agent,
            contents: await response?.text(),
            etag: response?.headers.get("ETag") ?? `${Utils.getSHA1String(await response?.text() as string)}`,
            contentType: response?.headers.get("Content-Type") ?? ""
        });

        if (Utils.isApplicationJSON(result.contentType as string)) {
            try {
                result.contents = JSON.parse(result.contents as string);
            } catch (ex) {
                this.log(`retrieveAgentProfile - failed to deserialize JSON: ${ex}`);
            }
        }

        cfg.callback?.(null, result);
        return result;
      }
    } catch (error) {
        cfg.callback?.(error as Error, null);
    }
  }

  async retrieveAgentProfileIds(cfg: RetrieveAgentProfileIdsConfig): Promise<string[] | void> {
    this.log("retrieveAgentProfileIds");

    const requestHeaders = cfg.requestHeaders || {};
    let url = '';

    const params: any = {};

    if (this.version === "0.9") {
        url = "actors/profile";
        params.actor = JSON.stringify(cfg.agent.asVersion(this.version));
    } else {
        url = "agents/profile";
        params.agent = JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]));
    }

    if (cfg.since) {
        params.since = cfg.since;
    }

    const requestCfg: IRequestCfg = {
        method: "GET",
        url: url,
        params: params,
        headers: requestHeaders,
        ignore404: true
    };

    try {
      const response = await this.sendRequest(requestCfg);

      let result: string[] | null = null;

      if (response instanceof Response) {
        if (response?.status === 404) {
            result = [];
        } else {
            try {
                result = await response?.json();
            } catch (ex) {
                throw new Error(`Response JSON parse error: ${ex}`);
            }
        }

        cfg.callback?.(null, result);
        return result as string[];
      }
    } catch (error) {
        cfg.callback?.(error as Error, null);
    }
  }

  async saveAgentProfile(key: string, val: any, cfg: ISaveAgentProfileCfg): Promise<Response | void> {
    this.log("saveAgentProfile");

    const requestHeaders = cfg.requestHeaders || {};

    if (!cfg.contentType) {
        cfg.contentType = "application/octet-stream";
    }
    requestHeaders["Content-Type"] = cfg.contentType;

    if (!cfg.method || cfg.method !== "POST") {
        cfg.method = "PUT";
    }

    if (typeof val === "object" && Utils.isApplicationJSON(cfg.contentType)) {
        val = JSON.stringify(val);
    }

    const requestCfg: IRequestCfg = {
        url: this.version === "0.9" ? "actors/profile" : "agents/profile",
        method: cfg.method,
        params: {
            profileId: key,
            [this.version === "0.9" ? "actor" : "agent"]: JSON.stringify(cfg.agent?.asVersion(this.version ?? Versions[0]))
        },
        data: val,
        headers: requestHeaders
    };

    if (cfg.lastSHA1) {
        requestCfg.headers["If-Match"] = cfg.lastSHA1;
    } else {
        requestCfg.headers["If-None-Match"] = "*";
    }

    if (cfg.callback) {
        requestCfg.callback = cfg.callback;
    }

    return this.sendRequest(requestCfg);
  }

  async dropAgentProfile(key: string | null, cfg: IDropAgentProfileConfig): Promise<Response | void> {
    this.log("dropAgentProfile");

    const requestHeaders = cfg.requestHeaders || {};
    const requestParams: { [key: string]: string } = {
        profileId: key as string // Assuming key can be null, cast to string for type safety
    };

    const requestCfg: IRequestCfg = {
        url: this.version === "0.9" ? "actors/profile" : "agents/profile",
        method: "DELETE",
        params: {
            ...requestParams,
            [this.version === "0.9" ? "actor" : "agent"]: JSON.stringify(cfg.agent.asVersion(this.version ?? Versions[0]))
        },
        headers: requestHeaders
    };

    if (cfg.callback) {
        requestCfg.callback = cfg.callback;
    }

    return this.sendRequest(requestCfg);
}

}


// Additional methods and logic to be implemented as needed
