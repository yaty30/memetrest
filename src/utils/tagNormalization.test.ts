import { describe, expect, it } from "vitest";
import {
  canonicalizeTag,
  expandTagAliases,
  normalizeTagList,
} from "./tagNormalization";

describe("tagNormalization", () => {
  it("canonicalizes known tag aliases", () => {
    expect(canonicalizeTag("Dancing")).toBe("dance");
    expect(canonicalizeTag("#dance")).toBe("dance");
  });

  it("expands aliases for query-time matching", () => {
    expect(expandTagAliases(["dancing"])).toEqual(["dance", "dancing"]);
  });

  it("normalizes and de-duplicates stored tags", () => {
    expect(normalizeTagList(["Dancing", "dance", "#DANCING"])).toEqual([
      "dance",
    ]);
  });
});
