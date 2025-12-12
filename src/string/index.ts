import { e, ValidationError } from "../error";
import { SchemaType } from "../schema";
import { HtmlStringAttributes, SchemaDef } from "../types";

export class StringSchema<D extends SchemaDef = SchemaDef> extends SchemaType<
  string,
  D
> {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    required: true,
  };

  validate(data: unknown): e.ValidationResult<string> {
    const errors: ValidationError[] = [];
    // Basic type check
    if (typeof data !== "string") {
      errors.push(
        new ValidationError(
          [],
          "Invalid string",
          "invalid_type",
          "string",
          typeof data,
          data
        )
      );
      return e.ValidationResult.fail<string>(errors);
    }

    // Pattern check
    if (
      this.htmlAttributes.pattern &&
      !this.htmlAttributes.pattern.test(data)
    ) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("pattern") || "Invalid format",
          "pattern",
          this.htmlAttributes.pattern,
          data,
          data
        )
      );
    }

    // required check
    if (
      this.htmlAttributes.required &&
      (data === null || data === undefined || data === "")
    )
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("required") || "String is required",
          "required",
          true,
          data,
          data
        )
      );

    // Length checks
    if (
      this.htmlAttributes.minLength !== undefined &&
      data.length < this.htmlAttributes.minLength
    )
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("min") || "String is too short",
          "min",
          this.htmlAttributes.minLength,
          data.length,
          data
        )
      );

    // Length checks
    if (
      this.htmlAttributes.maxLength !== undefined &&
      data.length > this.htmlAttributes.maxLength
    )
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("max") || "String is too long",
          "max",
          this.htmlAttributes.maxLength,
          data.length,
          data
        )
      );

    if (this.htmlAttributes.readOnly) {
      errors.push(
        new ValidationError(
          [],
          this.errorMap.get("readOnly") || "String is read-only",
          "readOnly",
          true,
          data,
          data
        )
      );
    }

    if (errors.length > 0) {
      return e.ValidationResult.fail<string>(errors);
    }

    return e.ValidationResult.ok<string>(data);
  }

  placeholder(value: string): this {
    this.htmlAttributes = { ...this.htmlAttributes, placeholder: value };
    return this;
  }

  minLength(value: number, message: string = "String is too short"): this {
    this.errorMap.set("minLength", message);
    this.htmlAttributes = { ...this.htmlAttributes, minLength: value };
    return this;
  }

  maxLength(value: number, message: string = "String is too long"): this {
    this.errorMap.set("maxLength", message);
    this.htmlAttributes = { ...this.htmlAttributes, maxLength: value };
    return this;
  }

  pattern(
    value: RegExp,
    message: string = `String does not match pattern ${value.source}`,
    title: string = `Pattern: ${value.source}`
  ): this {
    this.errorMap.set("pattern", message);
    this.htmlAttributes = { ...this.htmlAttributes, pattern: value, title };
    return this;
  }

  datalist(list: string, dataList: string[]): this {
    this.htmlAttributes = {
      ...this.htmlAttributes,
      list,
      dataList,
    };
    return this;
  }

  required(
    required: boolean = true,
    message: string = "String is required"
  ): this {
    this.errorMap.set("required", message);
    this.htmlAttributes = { ...this.htmlAttributes, required };
    return this;
  }
}

export class PasswordSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "password",
    required: true,
  };
}

export class UrlSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "url",
    defaultValue: "",
    pattern:
      /^(?<Scheme>[a-z][a-z0-9\+\-\.]*):(?<HierPart>\/\/(?<Authority>((?<UserInfo>(\%[0-9a-f][0-9a-f]|[a-z0-9\-\.\_\~]|[\!\$\&\'\(\)\*\+\,\;\=]|\:)*)\@)?(?<Host>\[((?<IPv6>((?<IPv6_1_R_H16>[0-9a-f]{1,4})\:){6,6}(?<IPV6_1_R_LS32>((?<IPV6_1_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_1_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_1_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_1_R_LS32_H16_2>[0-9a-f]{1,4}))|\:\:((?<IPV6_2_R_H16>[0-9a-f]{1,4})\:){5,5}(?<IPV6_2_R_LS32>((?<IPV6_2_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_2_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_2_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_2_R_LS32_H16_2>[0-9a-f]{1,4}))|(?<IPV6_3_L_H16>[0-9a-f]{1,4})?\:\:((?<IPV6_3_R_H16>[0-9a-f]{1,4})\:){4,4}(?<IPV6_3_R_LS32>((?<IPV6_3_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_3_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_3_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_3_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_4_L_H16_REPEAT>[0-9a-f]{1,4})\:)?(?<IPV6_4_L_H16>[0-9a-f]{1,4}))?\:\:((?<IPV6_4_R_H16>[0-9a-f]{1,4})\:){3,3}(?<IPV6_4_R_LS32>((?<IPV6_4_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_4_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_4_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_4_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_5_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,2}(?<IPV6_5_L_H16>[0-9a-f]{1,4}))?\:\:((?<IPV6_5_R_H16>[0-9a-f]{1,4})\:){2,2}(?<IPV6_5_R_LS32>((?<IPV6_5_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_5_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_5_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_5_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_6_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,3}(?<IPV6_6_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_6_R_H16>[0-9a-f]{1,4})\:(?<IPV6_6_R_LS32>((?<IPV6_6_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_6_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_6_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_6_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_7_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,4}(?<IPV6_7_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_7_R_LS32>((?<IPV6_7_R_LS32_IPV4_DEC_OCTET>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}(?<IPV6_7_R_LS32_IPV4_DEC_OCTET_>[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|(?<IPV6_7_R_LS32_H16_1>[0-9a-f]{1,4})\:(?<IPV6_7_R_LS32_H16_2>[0-9a-f]{1,4}))|(((?<IPV6_8_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,5}(?<IPV6_8_L_H16>[0-9a-f]{1,4}))?\:\:(?<IPV6_8_R_H16>[0-9a-f]{1,4})|(((?<IPV6_9_L_H16_REPEAT>[0-9a-f]{1,4})\:){0,6}(?<IPV6_9_L_H16>[0-9a-f]{1,4}))?\:\:)|v[a-f0-9]+\.([a-z0-9\-\.\_\~]|[\!\$\&\'\(\)\*\+\,\;\=]|\:)+)\]|(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3,3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])|([a-z0-9\-\.\_\~]|\%[0-9a-f][0-9a-f]|[\!\$\&\'\(\)\*\+\,\;\=])*)(:(?<Port>[0-9]+))?)(?<Path>(\/([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@]|(%[a-f0-9]{2,2}))*)*))(?<Query>\?([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@\/\?]|(%[a-f0-9]{2,2}))*)?(?<Fragment>#([a-z0-9\-\.\_\~\!\$\&\'\(\)\*\+\,\;\=\:\@\/\?]|(%[a-f0-9]{2,2}))*)?$/,
    title: "URL must be a valid web address e.g., https://example.com",
    placeholder: "https://example.com",
    required: true,
  };
}

export class ZipCodeSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /^[0-9]{5}(?:-[0-9]{4})?$/,
    title: "Zip code must be in the format 12345 or 12345-6789",
    placeholder: "12345 or 12345-6789",
    required: true,
  };
}

export class XMLSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /(?<=<TAG.*?>)(.*?)(?=<\/TAG>)/g,
    title: "XML content must be enclosed within <TAG>value</TAG>",
    placeholder: "<TAG>value</TAG>",
    required: true,
  };
}

export class UUIDSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    title: "UUID must be in the format 550e8400-e29b-41d4-a716-446655440000",
    placeholder: "550e8400-e29b-41d4-a716-446655440000",
    required: true,
  };
}

export class StreetAddressSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(\d{1,}) [a-zA-Z0-9\s]+(\,)? [a-zA-Z]+(\,)? [A-Z]{2} [0-9]{5,6}$/,
    title:
      "Street address must be in the format '1234 Main St, City, ST 12345'",
    placeholder: "1234 Main St, City, ST 12345",
    required: true,
  };
}

export class PhoneNumberSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
    title: "Phone number must be in a valid international format",
    placeholder: "+12345678900",
    required: true,
  };
}

export class StringNumberSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/,
    title: "String number must be a valid numeric format",
    placeholder: "12345",
    required: true,
  };
}

export class HexColorSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/,
    title: "Hex color must be in the format #RRGGBB or #RGB",
    placeholder: "#RRGGBB or #RGB",
    required: true,
  };
}

export class MacAddressSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /^(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})$/,
    title: "MAC address must be in the format 00:1A:2B:3C:4D:5E",
    placeholder: "00:1A:2B:3C:4D:5E",
    required: true,
  };
}

export class IPAddressSchema<
  V extends "IPV4" | "IPV6" = "IPV4" | "IPV6",
  D extends SchemaDef = SchemaDef
> extends StringSchema<D> {
  private patterns: Record<V, RegExp> = {
    IPV4: /^(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    IPV6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  } as Record<V, RegExp>;
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    placeholder: "255.255.255.255",
    required: true,
  };
  constructor(private version: V, def: D) {
    super(def);
    this.htmlAttributes.pattern = this.patterns[version];
    this.htmlAttributes.placeholder =
      version === "IPV4"
        ? "255.255.255.255"
        : "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    this.htmlAttributes.title =
      version === "IPV4"
        ? "IP address must be in the format 255.255.255.255"
        : "IP address must be in the format 2001:0db8:85a3:0000:0000:8a2e:0370:7334";
  }
}

export class HTMLSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern: /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,
    title: "HTML content must be valid HTML tags",
    placeholder: "<tag>content</tag>",
    required: true,
  };
}

export class GUIDSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:\{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$/,
    title: "GUID must be in the format 550e8400-e29b-41d4-a716-446655440000",
    placeholder: "550e8400-e29b-41d4-a716-446655440000",
    required: true,
  };
}

export class DateSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "date",
    pattern: /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d\d$/,
    title: "Date must be in the format MM/DD/YYYY",
    placeholder: "MM/DD/YYYY",
    required: true,
  };
}

export class DatetimeLocalSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "datetime-local",
    pattern:
      /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))T(?:[01][0-9]|2[0-3]):[0-5][0-9]$/,
    title: "Datetime must be in the format MM/DD/YYYYTHH:MM",
    placeholder: "MM/DD/YYYYTHH:MM",
    required: true,
  };
}

export class ISODateSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "text",
    pattern:
      /^(?:\d{4})-(?:\d{2})-(?:\d{2})T(?:\d{2}):(?:\d{2}):(?:\d{2}(?:\.\d*)?)(?:(?:-(?:\d{2}):(?:\d{2})|Z)?)$/,
    title: "ISO date must be in the format YYYY-MM-DDTHH:MM:SSZ",
    placeholder: "YYYY-MM-DDTHH:MM:SSZ",
    required: true,
  };
}

export class EmailSchema extends StringSchema {
  public htmlAttributes: HtmlStringAttributes = {
    type: "email",
    pattern:
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    title: "Email must be a valid email address e.g., example@example.com",
    placeholder: "example@example.com",
    required: true,
  };
}
