import { ArraySchema } from "./array";
import { BooleanSchema } from "./boolean";
import { NumberSchema } from "./number";
import { ObjectSchema } from "./object";
import { EnumSchema } from "./enum";
import {
  DateSchema,
  DatetimeLocalSchema,
  EmailSchema,
  GUIDSchema,
  HexColorSchema,
  HTMLSchema,
  IPAddressSchema,
  ISODateSchema,
  MacAddressSchema,
  PasswordSchema,
  PhoneNumberSchema,
  StreetAddressSchema,
  StringNumberSchema,
  StringSchema,
  UrlSchema,
  UUIDSchema,
  XMLSchema,
  ZipCodeSchema,
} from "./string";
import { ObjectShape, SchemaTypeAny } from "./types";

export * from "./types";

////////////////////////////
////        String      ////
////////////////////////////

/**
 * Creates a new string schema.
 * @returns A new instance of StringSchema.
 */
export function string(): StringSchema {
  return new StringSchema({
    description: "A string field",
  });
}

/**
 * Creates a new email schema.
 * @returns A new instance of EmailSchema.
 */
export function email(): EmailSchema {
  return new EmailSchema({
    description: "An email field",
  });
}

/**
 * Creates a new URL schema.
 * @returns A new instance of UrlSchema.
 */
export function url(): UrlSchema {
  return new UrlSchema({
    description: "A URL field",
  });
}

/**
 * Creates a new date schema.
 * @returns A new instance of DateSchema.
 */
export function date(): DateSchema {
  return new DateSchema({
    description: "A date field",
  });
}

/**
 * Creates a new datetime-local schema.
 * @returns A new instance of DatetimeLocalSchema.
 */
export function datetime(): DatetimeLocalSchema {
  return new DatetimeLocalSchema({
    description: "A datetime-local field",
  });
}

/**
 * Creates a new password schema.
 * @returns A new instance of PasswordSchema.
 */
export function password(): PasswordSchema {
  return new PasswordSchema({
    description: "A password field",
  });
}

/**
 * Creates a new hex color schema.
 * @returns A new instance of HexColorSchema.
 */
export function hexColor(): HexColorSchema {
  return new HexColorSchema({
    description: "A hex color field",
  });
}

/**
 * Creates a new ISO date schema.
 * @returns A new instance of ISODateSchema.
 */
export function isoDate(): ISODateSchema {
  return new ISODateSchema({
    description: "An ISO date field",
  });
}

/**
 * Creates a new zip code schema.
 * @returns A new instance of ZipCodeSchema.
 */
export function zipCode(): ZipCodeSchema {
  return new ZipCodeSchema({
    description: "A zip code field",
  });
}

/**
 * Creates a new XML schema.
 * @returns A new instance of XMLSchema.
 */
export function xml(): XMLSchema {
  return new XMLSchema({
    description: "An XML field",
  });
}

/**
 * Creates a new UUID schema.
 * @returns A new instance of UUIDSchema.
 */
export function uuid(): UUIDSchema {
  return new UUIDSchema({
    description: "A UUID field",
  });
}

/**
 * Creates a new street address schema.
 * @returns A new instance of StreetAddressSchema.
 */
export function streetAddress(): StreetAddressSchema {
  return new StreetAddressSchema({
    description: "A street address field",
  });
}

/**
 * Creates a new phone number schema.
 * @returns A new instance of PhoneNumberSchema.
 */
export function phoneNumber(): PhoneNumberSchema {
  return new PhoneNumberSchema({
    description: "A phone number field",
  });
}

/**
 * Creates a new string number schema.
 * @returns A new instance of StringNumberSchema.
 */
export function stringNumber(): StringNumberSchema {
  return new StringNumberSchema({
    description: "A string number field",
  });
}

/**
 * Creates a new MAC address schema.
 * @returns A new instance of MacAddressSchema.
 */
export function macAddress(): MacAddressSchema {
  return new MacAddressSchema({
    description: "A MAC address field",
  });
}

/**
 * Creates a new IP address schema for the specified version.
 * @param version - The IP version ("IPV4" or "IPV6").
 * @returns A new instance of IPAddressSchema.
 */
export function ip(version: "IPV4" | "IPV6"): IPAddressSchema {
  return new IPAddressSchema(version, {
    description: `An IP address field for version ${version}`,
  });
}

/**
 * Creates a new HTML schema.
 * @returns A new instance of HTMLSchema.
 */
export function html(): HTMLSchema {
  return new HTMLSchema({
    description: "An HTML field",
  });
}

/**
 * Creates a new GUID schema.
 * @returns A new instance of GUIDSchema.
 */
export function guid(): GUIDSchema {
  return new GUIDSchema({
    description: "A GUID field",
  });
}

////////////////////////////
////        Number      ////
////////////////////////////

/**
 * Creates a new number schema.
 * @returns A new instance of NumberSchema.
 */
export function number(): NumberSchema {
  return new NumberSchema({});
}

////////////////////////////
////       Boolean      ////
////////////////////////////

/**
 * Creates a new boolean schema.
 * @returns A new instance of BooleanSchema.
 */
export function boolean(): BooleanSchema {
  return new BooleanSchema({});
}

////////////////////////////
////        Object      ////
////////////////////////////

/**
 * Creates a new object schema with the specified shape.
 * @param shape - The shape of the object schema.
 * @returns A new instance of ObjectSchema.
 */
export function object<Shape extends ObjectShape>(
  shape: Shape
): ObjectSchema<Shape> {
  return new ObjectSchema(shape);
}

////////////////////////////
////        Array       ////
////////////////////////////

/**
 * Creates a new array schema with the specified item schema.
 * @param itemSchema - The schema of the array items.
 * @returns A new instance of ArraySchema.
 */
export function array<T extends SchemaTypeAny>(itemSchema: T): ArraySchema<T> {
  return new ArraySchema(itemSchema);
}

////////////////////////////
////        Enum        ////
////////////////////////////

/**
 * Creates a new enum schema with the specified values.
 * @param values - The allowed enum values.
 * @returns A new instance of EnumSchema.
 */
export function _enum<T extends [string, ...string[]]>(
  values: T
): EnumSchema<T> {
  return new EnumSchema(values);
}

export { _enum as enum };
