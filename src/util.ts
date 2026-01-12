import { SchemaTypeAny } from "./types";

export type Prettify<T> = T extends infer U
  ? U extends object
    ? U extends any[]
      ? U
      : { [K in keyof U]: Prettify<U[K]> }
    : U
  : never;
export type TypeOf<T extends SchemaTypeAny> = T["_output"];

export type Override<T, R> = Omit<T, keyof R> & R;
export type PrettifyShape<T extends { [key: string]: SchemaTypeAny }> =
  T extends infer U
    ? {
        [K in keyof U]: U[K];
      }
    : never;
export type MergeShapes<T extends readonly { [key: string]: SchemaTypeAny }[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends { [key: string]: SchemaTypeAny }
      ? Rest extends readonly { [key: string]: SchemaTypeAny }[]
        ? PrettifyShape<First & MergeShapes<Rest>>
        : PrettifyShape<First>
      : {}
    : {};

export type ObjectInfer<Shape extends { [key: string]: SchemaTypeAny }> =
  Prettify<
    {
      [K in keyof Shape as undefined extends TypeOf<Shape[K]>
        ? K
        : never]?: TypeOf<Shape[K]>;
    } & {
      [K in keyof Shape as undefined extends TypeOf<Shape[K]>
        ? never
        : K]-?: TypeOf<Shape[K]>;
    }
  >;
