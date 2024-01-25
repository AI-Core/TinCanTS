import { Utils } from "./Utils";
import { Versions } from "./Versions";
import { Logger } from "./Logger";

export interface VerbCfg {
    id?: string;
    display?: { [key: string]: string };
}

// this represents the full set of verb values that were
// allowed by the .9 spec version, if an object is created with one of
// the short forms it will be upconverted to the matching long form,
// for local storage and use and if an object is needed in .9 version
// consequently down converted
//
// hopefully this list will never grow (or change) and only the exact
// ADL compatible URLs should be matched
const _downConvertMap: { [key: string]: string } = {
  "http://adlnet.gov/expapi/verbs/experienced": "experienced",
  "http://adlnet.gov/expapi/verbs/attended": "attended",
  "http://adlnet.gov/expapi/verbs/attempted": "attempted",
  "http://adlnet.gov/expapi/verbs/completed": "completed",
  "http://adlnet.gov/expapi/verbs/passed": "passed",
  "http://adlnet.gov/expapi/verbs/failed": "failed",
  "http://adlnet.gov/expapi/verbs/answered": "answered",
  "http://adlnet.gov/expapi/verbs/interacted": "interacted",
  "http://adlnet.gov/expapi/verbs/imported": "imported",
  "http://adlnet.gov/expapi/verbs/created": "created",
  "http://adlnet.gov/expapi/verbs/shared": "shared",
  "http://adlnet.gov/expapi/verbs/voided": "voided"
};

export class Verb {
  id: string | null = null;
  display: { [key: string]: string } | null = null;
  private LOG_SRC: string = "Verb";

  constructor(cfg: string | VerbCfg) {
    this.log("constructor");
    if (typeof cfg === "string") {
      this.id = cfg;
      this.display = { und: this.id };

      // Upconvert the ID to the 0.95 ADL version if a simple string like "attempted" was passed
      for (const prop in _downConvertMap) {
        if (_downConvertMap.hasOwnProperty(prop) && _downConvertMap[prop] === cfg) {
          this.id = prop;
          break;
        }
      }
    } else if (typeof cfg === "object" && cfg !== null) {
      const { id, display } = cfg;
      this.id = id ?? null;
      this.display = display ?? null;

      if (this.display === null && _downConvertMap[this.id as string] !== undefined) {
        this.display = { "und": _downConvertMap[this.id as string] };
      }
    }
  }

  log(message: string): void {
    Logger.log(message, this.LOG_SRC);
  }

  toString(lang?: string): string {
    this.log("toString");
    if (this.display !== null) {
      return Utils.getLangDictionaryValue(this.display, lang);
    }
    return this.id as string;
  }

  asVersion(version: string = Versions[0]): VerbCfg {
    this.log("asVersion");
    let result: VerbCfg;

    if (version === "0.9") {
      result = { id: _downConvertMap[this.id as string] };
    } else {
      result = { id: this.id! };
      if (this.display !== null) {
        result.display = this.display;
      }
    }
  
    return result;
  }

  static fromJSON(verbJSON: string): Verb {
    Verb.prototype.log("fromJSON");
    const _verb: VerbCfg = JSON.parse(verbJSON);
    return new Verb(_verb);
  }
}
