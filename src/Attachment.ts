import { Logger } from './Logger';
import { Versions } from './Versions';
import { Utils } from './Utils';

export interface AttachmentCfg {
  usageType?: string | null;
  display?: { [key: string]: string } | null;
  contentType?: string | null;
  length?: number | null;
  sha2?: string | null;
  description?: { [key: string]: string };
  fileUrl?: string;
  content?: ArrayBuffer;
  [key: string]: string | number | { [key: string]: string } | ArrayBuffer | undefined | null;
}

export class Attachment {
  private LOG_SRC = "Attachment";
  usageType: string | null = null;
  display: { [key: string]: string } | null = null;
  contentType: string | null = null;
  length: number | null = null;
  sha2: string | null = null;
  description: { [key: string]: string } | null = null;
  fileUrl: string | null = null;
  content: ArrayBuffer | null = null;

  constructor(cfg?: AttachmentCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: AttachmentCfg): void {
    this.log("init");
    cfg = cfg || {};
    // redundant, but necessary for the type checker to be happy and not using "any"
    if (cfg.contentType !== undefined) this.contentType = cfg.contentType;
    if (cfg.length !== undefined) this.length = cfg.length;
    if (cfg.sha2 !== undefined) this.sha2 = cfg.sha2;
    if (cfg.usageType !== undefined) this.usageType = cfg.usageType;
    if (cfg.display !== undefined) this.display = cfg.display;
    if (cfg.description !== undefined) this.description = cfg.description;
    if (cfg.fileUrl !== undefined) this.fileUrl = cfg.fileUrl;

    if (cfg.content) {
      this.setContent(cfg.content);
    }
  }

  asVersion(): AttachmentCfg {
    this.log("asVersion");
    const result: AttachmentCfg = {
      contentType: this.contentType,
      display: this.display,
      length: this.length,
      sha2: this.sha2,
      usageType: this.usageType
    };

    if (this.fileUrl !== null) {
      result.fileUrl = this.fileUrl;
    }
    if (this.description !== null) {
      result.description = this.description;
    }

    return result;
  }

  setContent(content: ArrayBuffer): void {
    this.content = content;
    this.length = content.byteLength;
    this.sha2 = Utils.getSHA256String(content);
  }
  
  static fromJSON(attachmentJSON: string): Attachment {
    const _attachment: AttachmentCfg = JSON.parse(attachmentJSON);
    return new Attachment(_attachment);
  }

  // Comment these methods out, since they are not used in the library. Probably they were used in the original JavaScript version.

    //   setContentFromString(content: string): void {
    //     const _content = Utils.stringToArrayBuffer(content);
    //     this.setContent(_content);
    //   }

    //   getContentAsString(): string {
    //     return Utils.stringFromArrayBuffer(this.content);
    //   }

}