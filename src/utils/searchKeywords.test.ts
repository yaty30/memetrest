import { describe, expect, it } from "vitest";
import { buildSearchKeywordsFromTags } from "./searchKeywords";

describe("buildSearchKeywordsFromTags", () => {
  it("builds prefixes for a single tag", () => {
    const result = buildSearchKeywordsFromTags(["dog"]);
    expect(result).toEqual(["d", "do", "dog"]);
  });

  it("de-duplicates duplicate tags case-insensitively", () => {
    const result = buildSearchKeywordsFromTags(["dog", "Dog"]);
    expect(result).toEqual(["d", "do", "dog"]);
  });

  it("handles multi-word tags with prefixes for each word and full phrase", () => {
    const result = buildSearchKeywordsFromTags(["funny dog"]);
    expect(result).toEqual([
      "d",
      "do",
      "dog",
      "f",
      "fu",
      "fun",
      "funn",
      "funny",
      "funny dog",
    ]);
  });

  it("normalizes extra spaces before generating keywords", () => {
    const result = buildSearchKeywordsFromTags(["  funny   dog  "]);
    expect(result).toEqual([
      "d",
      "do",
      "dog",
      "f",
      "fu",
      "fun",
      "funn",
      "funny",
      "funny dog",
    ]);
  });

  it("merges mixed tags with overlap without duplicate keywords", () => {
    const result = buildSearchKeywordsFromTags(["dog", "doge", "funny dog"]);
    expect(result).toEqual([
      "d",
      "do",
      "dog",
      "doge",
      "f",
      "fu",
      "fun",
      "funn",
      "funny",
      "funny dog",
    ]);
  });

  it("ignores empty values", () => {
    const result = buildSearchKeywordsFromTags([
      "",
      "   ",
      "dog",
      null as unknown as string,
    ]);
    expect(result).toEqual(["d", "do", "dog"]);
  });
});
