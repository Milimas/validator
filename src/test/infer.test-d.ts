// tests/infer.test.ts
import { describe, it, assertType, expectTypeOf } from "vitest";

import { v } from "..";

import { Infer } from "../types";
describe("Infer", () => {
  it("should infer string schema", () => {
    const schema = v.string();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<string>();
    assertType<Inferred>("hello");
  });

  it("should infer number schema", () => {
    const schema = v.number();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<number>();
    assertType<Inferred>(42);
    assertType<Inferred>(3.14);
  });

  it("should infer boolean schema", () => {
    const schema = v.boolean();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<boolean>();
    assertType<Inferred>(true);
    assertType<Inferred>(false);
  });

  describe("should infer array schema", () => {
    it("of strings", () => {
      const schema = v.array(v.string());
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<string[]>();
      assertType<Inferred>(["a", "b", "c"]);
      assertType<Inferred>([]);
    });

    it("of numbers", () => {
      const schema = v.array(v.number());
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<number[]>();
      assertType<Inferred>([1, 2, 3]);
      assertType<Inferred>([]);
    });

    it("of booleans", () => {
      const schema = v.array(v.boolean());
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<boolean[]>();
      assertType<Inferred>([true, false, true]);
      assertType<Inferred>([]);
    });

    it("of objects", () => {
      const schema = v.array(
        v.object({
          id: v.string(),
          value: v.number(),
        })
      );
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<{ id: string; value: number }[]>();
      assertType<Inferred>([
        { id: "item1", value: 10 },
        { id: "item2", value: 20 },
      ]);
      assertType<Inferred>([]);
    });

    it("of arrays", () => {
      const schema = v.array(v.array(v.string()));
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<string[][]>();
      assertType<Inferred>([
        ["a", "b"],
        ["c", "d"],
      ]);
      assertType<Inferred>([]);
    });

    it("of enums", () => {
      const schema = v.array(v.enum(["option1", "option2"] as const));
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<("option1" | "option2")[]>();
      assertType<Inferred>(["option1", "option2"]);
      assertType<Inferred>([]);
    });

    it("of unions", () => {
      const schema = v.array(v.union([v.string(), v.number()] as const));
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<(string | number)[]>();
      assertType<Inferred>(["a", 1, "b", 2]);
      assertType<Inferred>([]);
    });

    it("of nested arrays", () => {
      const schema = v.array(v.array(v.array(v.number())));
      type Inferred = Infer<typeof schema>;

      expectTypeOf<Inferred>().toEqualTypeOf<number[][][]>();
      assertType<Inferred>([
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]);
      assertType<Inferred>([]);
    });
  });

  it("should infer any schema", () => {
    const schema = v.any();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<any>();
    assertType<Inferred>(42);
    assertType<Inferred>("hello");
    assertType<Inferred>({ key: "value" });
  });

  it("should infer never schema", () => {
    const schema = v.never();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<never>();
  });

  it("should infer unknown schema", () => {
    const schema = v.unknown();
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<unknown>();
    assertType<Inferred>(42);
    assertType<Inferred>("hello");
    assertType<Inferred>({ key: "value" });
  });

  it("should infer record schema", () => {
    const schema = v.record(v.string(), v.number());
    type Inferred = Infer<typeof schema>;

    expectTypeOf<Inferred>().toEqualTypeOf<Record<string, number>>();
    assertType<Inferred>({ a: 1, b: 2, c: 3 });
    assertType<Inferred>({});
  });

  it("should infer simple object", () => {
    const schema = v.object({
      name: v.string(),
      age: v.number(),
      isActive: v.boolean(),
    });

    type Inferred = Infer<typeof schema>;
    const value: Inferred = {
      name: "John",
      age: 30,
      isActive: true,
    };

    assertType<Inferred>(value);
  });
  describe("should infer nested object", () => {
    const schema = v.object({
      a: v.object({
        b: v.object({
          c: v.object({
            d: v.object({
              e: v.object({
                f: v.object({
                  g: v.object({
                    h: v.object({
                      i: v.object({
                        j: v.object({
                          k: v.object({
                            l: v.object({
                              m: v.object({
                                n: v.object({
                                  o: v.object({
                                    p: v.string(),
                                    q: v.number(),
                                    r: v.boolean(),
                                    s: v.array(v.string()),
                                    t: v.enum(["option1", "option2"] as const),
                                    u: v.union([
                                      v.string(),
                                      v.number(),
                                    ] as const),
                                    v: v.object({
                                      w: v.string(),
                                      x: v.number(),
                                      y: v.boolean(),
                                      z: v.array(v.number()),
                                    }),
                                  }),
                                }),
                              }),
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    type Inferred = Infer<typeof schema>;
    const value = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: {
                        j: {
                          k: {
                            l: {
                              m: {
                                n: {
                                  o: {
                                    p: "string",
                                    q: 42,
                                    r: true,
                                    s: ["str1", "str2"],
                                    t: "option1" as const,
                                    u: "unionValue",
                                    v: {
                                      w: "string",
                                      x: 100,
                                      y: false,
                                      z: [1, 2, 3],
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    assertType<Inferred>(value);
  });
});
