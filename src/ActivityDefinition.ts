import { Logger } from './Logger';
import { InteractionComponent } from './InteractionComponent';
import { Utils } from './Utils';
import { Versions } from './Versions';

interface DirectProps {
  name?: { [key: string]: string };
  description?: { [key: string]: string };
  moreInfo?: string;
  extensions?: { [key: string]: any };
  correctResponsesPattern?: string[];
  interactionType?: string;
}

interface InteractionComponentCfg {
  id?: string;
  description?: { [key: string]: string };
}

interface InteractionComponentProps {
  choices?: InteractionComponentCfg[];
  scale?: InteractionComponentCfg[];
  source?: InteractionComponentCfg[];
  target?: InteractionComponentCfg[];
  steps?: InteractionComponentCfg[];
}

interface ActivityDefinitionCfg extends DirectProps, InteractionComponentProps {
  type?: string;
}

const downConvertMap: { [key: string]: string } = {
  "http://adlnet.gov/expapi/activities/course": "course",
  "http://adlnet.gov/expapi/activities/module": "module",
  "http://adlnet.gov/expapi/activities/meeting": "meeting",
  "http://adlnet.gov/expapi/activities/media": "media",
  "http://adlnet.gov/expapi/activities/performance": "performance",
  "http://adlnet.gov/expapi/activities/simulation": "simulation",
  "http://adlnet.gov/expapi/activities/assessment": "assessment",
  "http://adlnet.gov/expapi/activities/interaction": "interaction",
  "http://adlnet.gov/expapi/activities/cmi.interaction": "cmi.interaction",
  "http://adlnet.gov/expapi/activities/question": "question",
  "http://adlnet.gov/expapi/activities/objective": "objective",
  "http://adlnet.gov/expapi/activities/link": "link"
};

export class ActivityDefinition {
  name: { [key: string]: string } | null = null;
  description: { [key: string]: string } | null = null;
  moreInfo: string | null = null;
  extensions: { [key: string]: any } | null = null;
  correctResponsesPattern: string[] | null = null;
  choices: InteractionComponent[] | null = null;
  scale: InteractionComponent[] | null = null;
  source: InteractionComponent[] | null = null;
  target: InteractionComponent[] | null = null;
  steps: InteractionComponent[] | null = null;
  type: string | null = null;
  interactionType: string | null = null;

  private LOG_SRC = "ActivityDefinition";

  constructor(cfg?: ActivityDefinitionCfg) {
    this.log("constructor");
    this.init(cfg);
  }

  private log(msg: string): void {
    Logger.log(msg, this.LOG_SRC);
  }

  private init(cfg?: ActivityDefinitionCfg): void {
    this.log(`init: ${JSON.stringify(cfg)}`);

    cfg = cfg || {};

    if (cfg.type) {
      for (const prop in downConvertMap) {
        if (downConvertMap.hasOwnProperty(prop) && downConvertMap[prop] === cfg!.type) {
          this.type = prop;
          break;
        }
      }
    }

    // This seems a bit redundant, but it's the only way to ensure that
    // the types are correct when we're done
    if (cfg.interactionType) {
      this.interactionType = cfg.interactionType;

      if (cfg.interactionType === "choice" || cfg.interactionType === "sequencing") {
        if ("choices" in cfg && cfg.choices) {
          const choices: InteractionComponent[] = [];
          cfg.choices.forEach((choice) => {
            if (choice instanceof InteractionComponent) {
              choices.push(choice);
            } else {
              choices.push(new InteractionComponent(choice));
            }
          });
          this.choices = choices;
        }
      } else if (cfg.interactionType === "likert") {
        if ("scale" in cfg && cfg.scale) {
          const scale: InteractionComponent[] = [];
          cfg.scale.forEach((choice) => {
            if (choice instanceof InteractionComponent) {
              scale.push(choice);
            } else {
              scale.push(new InteractionComponent(choice));
            }
          });
          this.scale = scale;
        }
      } else if (cfg.interactionType === "matching") {
        if ("source" in cfg && cfg.source) {
          const source: InteractionComponent[] = [];
          cfg.source.forEach((choice) => {
            if (choice instanceof InteractionComponent) {
              source.push(choice);
            } else {
              source.push(new InteractionComponent(choice));
            }
          });
          this.source = source;
        }
        if ("target" in cfg && cfg.target) {
          const target: InteractionComponent[] = [];
          cfg.target.forEach((choice) => {
            if (choice instanceof InteractionComponent) {
              target.push(choice);
            } else {
              target.push(new InteractionComponent(choice));
            }
          });
          this.target = target;
        }
      } else if (cfg.interactionType === "performance") {
        if ("steps" in cfg && cfg.steps) {
          const steps: InteractionComponent[] = [];
          cfg.steps.forEach((choice) => {
            if (choice instanceof InteractionComponent) {
              steps.push(choice);
            } else {
              steps.push(new InteractionComponent(choice));
            }
          });
          this.steps = steps;
        }
      }
    }

    // Assign direct properties
    if ("name" in cfg && cfg.name) this.name = cfg.name;
    if ("description" in cfg && cfg.description) this.description = cfg.description;
    if ("moreInfo" in cfg && cfg.moreInfo) this.moreInfo = cfg.moreInfo;
    if ("extensions" in cfg && cfg.extensions) this.extensions = cfg.extensions;
    if ("correctResponsesPattern" in cfg && cfg.correctResponsesPattern) this.correctResponsesPattern = cfg.correctResponsesPattern;

  }
  toString(lang?: string): string {
    this.log("toString");

    if (this.name) {
        return Utils.getLangDictionaryValue(this.name, lang);
    }

    if (this.description) {
        return Utils.getLangDictionaryValue(this.description, lang);
    }

    return "";
  }

  asVersion(version?: string): ActivityDefinitionCfg {
    this.log("asVersion");
    const result: Partial<ActivityDefinitionCfg> = {};

    version = version || Versions[0];

    if (this.type) {
        result.type = version === "0.9" ? downConvertMap[this.type] : this.type;
    }

    // Handle direct props
    if (this.name) result.name = this.name;
    if (this.description) result.description = this.description;
    if (this.interactionType) result.interactionType = this.interactionType;
    if (this.correctResponsesPattern) result.correctResponsesPattern = this.correctResponsesPattern;
    if (this.extensions) result.extensions = this.extensions;

    // Handle interaction component props
    if (this.choices) result.choices = this.choices.map(c => c.asVersion());
    if (this.scale) result.scale = this.scale.map(s => s.asVersion());
    if (this.source) result.source = this.source.map(s => s.asVersion());
    if (this.target) result.target = this.target.map(t => t.asVersion());
    if (this.steps) result.steps = this.steps.map(s => s.asVersion());

    if (version.indexOf("0.9") !== 0 && this.moreInfo) {
        result.moreInfo = this.moreInfo;
    }

    return result as ActivityDefinitionCfg;
  }
  static fromJSON(definitionJSON: string): ActivityDefinition {
    Logger.log("fromJSON", "ActivityDefinition");
    const _definition: ActivityDefinitionCfg = JSON.parse(definitionJSON);

    return new ActivityDefinition(_definition);
  }
}
