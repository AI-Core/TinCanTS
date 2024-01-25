import * as CryptoJS from 'crypto-js';

type URLConfig = {
  allowRelative?: boolean;
};

type ParsedURL = {
  protocol: string | null;
  host: string | null;
  hostname: string | null;
  port: string | null;
  path: string | null;
  pathname: string;
  search: string;
  hash: string;
  params: { [key: string]: string };
};

export class Utils {
  static defaultEncoding: string = "utf8";

  static getUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }
    );
  }

  static getISODateString(date: Date): string {
    const pad = (val: number, n: number = 2): string => {
      let result = val.toString();
      while (val < Math.pow(10, n - 1)) {
        result = "0" + result;
        n--;
      }
      return result;
    };

    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.${pad(date.getUTCMilliseconds(), 3)}Z`;
  }

  static convertISO8601DurationToMilliseconds(ISO8601Duration: string): number {
    const isValueNegative: boolean = ISO8601Duration.indexOf("-") >= 0;
    const indexOfT: number = ISO8601Duration.indexOf("T");
    const indexOfH: number = ISO8601Duration.indexOf("H");
    const indexOfM: number = ISO8601Duration.indexOf("M");
    const indexOfS: number = ISO8601Duration.indexOf("S");
    let hours: number;
    let minutes: number;
    let seconds: number;
    let durationInMilliseconds: number;

    if ((indexOfT === -1) || ((indexOfM !== -1) && (indexOfM < indexOfT)) || (ISO8601Duration.indexOf("D") !== -1) || (ISO8601Duration.indexOf("Y") !== -1)) {
        throw new Error("ISO 8601 timestamps including years, months and/or days are not currently supported");
    }

    if (indexOfH === -1) {
        hours = 0;
    } else {
        hours = parseInt(ISO8601Duration.slice(indexOfT + 1, indexOfH), 10);
    }

    if (indexOfM === -1) {
        minutes = 0;
    } else {
        minutes = parseInt(ISO8601Duration.slice(indexOfH + 1, indexOfM), 10);
    }

    seconds = parseFloat(ISO8601Duration.slice(indexOfM + 1, indexOfS));

    durationInMilliseconds = parseInt((((hours * 60 + minutes) * 60 + seconds) * 1000).toString(), 10);
    if (isNaN(durationInMilliseconds)) {
        durationInMilliseconds = 0;
    }
    if (isValueNegative) {
        durationInMilliseconds *= -1;
    }

    return durationInMilliseconds;
  }

  static convertMillisecondsToISO8601Duration(inputMilliseconds: number): string {
    let hours: number;
    let minutes: number;
    let seconds: number;
    const i_inputMilliseconds: number = parseInt(inputMilliseconds.toString(), 10);
    let i_inputCentiseconds: number;
    let inputIsNegative: string = "";
    let rtnStr: string = "";

    // Round to nearest 0.01 seconds
    i_inputCentiseconds = Math.round(i_inputMilliseconds / 10);

    if (i_inputCentiseconds < 0) {
        inputIsNegative = "-";
        i_inputCentiseconds *= -1;
    }

    hours = parseInt((i_inputCentiseconds / 360000).toString(), 10);
    minutes = parseInt(((i_inputCentiseconds % 360000) / 6000).toString(), 10);
    seconds = ((i_inputCentiseconds % 360000) % 6000) / 100;

    rtnStr = inputIsNegative + "PT";
    if (hours > 0) {
        rtnStr += `${hours}H`;
    }

    if (minutes > 0) {
        rtnStr += `${minutes}M`;
    }

    rtnStr += `${seconds}S`;

    return rtnStr;
  }

  static getSHA1String(str: string): string {
    return CryptoJS.SHA1(str).toString(CryptoJS.enc.Hex);
  }

  static getSHA256String(content: ArrayBuffer | string): string {
    let wordArray: CryptoJS.lib.WordArray;
    if (content instanceof ArrayBuffer) {
      wordArray = CryptoJS.lib.WordArray.create(content);
    } else {
      wordArray = CryptoJS.enc.Utf8.parse(content as string);
    }
    return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
  }

  static getBase64String(str: string): string {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
  }

  static getLangDictionaryValue(langDict: { [key: string]: string }, lang?: string): string {
    if (lang !== undefined && langDict[lang] !== undefined) {
        return langDict[lang];
    }
    if (langDict.und !== undefined) {
        return langDict.und;
    }
    if (langDict["en-US"] !== undefined) {
        return langDict["en-US"];
    }
    for (const key in langDict) {
        if (langDict.hasOwnProperty(key)) {
            return langDict[key];
        }
    }

    return "";
}

  static parseURL(url: string, cfg: URLConfig = {}): ParsedURL {
    const isRelative = url.charAt(0) === "/";
    let _reURLInformation = ["(/[^?#]*)", "(\\?[^#]*|)", "(#.*|)$"];

    if (!isRelative) {
        _reURLInformation.unshift("^(https?:)//", "(([^:/?#]*)(?::([0-9]+))?)" );
        if (url.indexOf("/", 8) === -1) {
            url += "/";
        }
    } else {
        if (cfg.allowRelative !== true) {
            throw new Error("Refusing to parse relative URL without 'allowRelative' option");
        }
    }

    const reURLInformation = new RegExp(_reURLInformation.join(""));
    const match = url.match(reURLInformation);
    if (match === null) {
      throw new Error(`Unable to parse URL regular expression did not match: '${url}'`);
    }

    const result: ParsedURL = {
      protocol: isRelative ? null : match[1],
      host: isRelative ? null : match[2],
      hostname: isRelative ? null : match[3],
      port: isRelative ? null : match[4],
      path: isRelative ? null : (match[1] + "//" + match[2] + match[5]),
      pathname: match[5],
      search: match[6],
      hash: match[7],
      params: {}
    };

    if (result.search !== "") {
      const pl = /\+/g;
      const search = /([^&=]+)=?([^&]*)/g;
      const decode = (s: string) => decodeURIComponent(s.replace(pl, " "));
      let paramMatch;
      while ((paramMatch = search.exec(result.search.substring(1)))) {
          result.params[decode(paramMatch[1])] = decode(paramMatch[2]);
      }
    }

    return result;
  }
  static getServerRoot(absoluteUrl: string): string {
    const urlParts = absoluteUrl.split("/");
    return urlParts[0] + "//" + urlParts[2];
  }

  static getContentTypeFromHeader(header: string): string {
    return (String(header).split(";"))[0];
  }

  static isApplicationJSON(header: string): boolean {
    return Utils.getContentTypeFromHeader(header).toLowerCase().indexOf("application/json") === 0;
  }


  // Comment these methods out, since they are not used in the library. Probably they were used in the original JavaScript version.
  static stringToArrayBuffer(content: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(content).buffer;
}

  static stringFromArrayBuffer(content: ArrayBuffer, encoding?: string): string {
    const decoder = new TextDecoder(encoding || Utils.defaultEncoding);
    return decoder.decode(content);
  }
}