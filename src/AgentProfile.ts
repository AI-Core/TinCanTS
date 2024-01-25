import { Agent } from "./Agent";

export class AgentProfile {
  id: string | null;
  agent: Agent | null;
  updated: boolean | string | null;
  contents: string | null;
  etag: string | null;
  contentType: string | null;

  private readonly LOG_SRC = "AgentProfile";

  constructor(cfg: {
      id?: string,
      agent?: Agent, // Assuming Agent is another class you've defined
      contents?: string,
      etag?: string,
      contentType?: string
  }) {
      this.log("constructor");

      this.id = cfg.id || null;
      this.agent = cfg.agent || null;
      this.updated = null;
      this.contents = cfg.contents || null;
      this.etag = cfg.etag || null;
      this.contentType = cfg.contentType || null;

      this.init(cfg);
  }

  private log(message: string): void {
      console.log(`[${this.LOG_SRC}] ${message}`);
  }

  private init(cfg: {
      id?: string,
      contents?: string,
      etag?: string,
      contentType?: string,
      agent?: Agent
  }): void {
      this.log("init");

      const directProps = ["id", "contents", "etag", "contentType"];

      if (cfg.agent && !(cfg.agent instanceof Agent)) {
          this.agent = new Agent(cfg.agent); // Assuming Agent constructor accepts a config object
      }
      if (cfg?.id) {
          this.id = cfg.id;
      }
      if (cfg?.contents) {
          this.contents = cfg.contents;
      }
      if (cfg?.etag) {
          this.etag = cfg.etag;
      }
      if (cfg?.contentType) {
          this.contentType = cfg.contentType;
      }
      this.updated = false;
  }

  static fromJSON(stateJSON: string): AgentProfile {
      console.log("[AgentProfile] fromJSON");
      const state = JSON.parse(stateJSON);

      return new AgentProfile(state);
  }
}