import { describe, expect, it } from "vitest";
import {
  buildLikeMutationPlan,
  MemeLikeError,
  parseSetMemeLikeRequest,
  requireAuthenticatedUid,
} from "../../functions/src/memeLikeLogic";

describe("meme like logic", () => {
  it("first like increments count", () => {
    const plan = buildLikeMutationPlan({
      memeExists: true,
      likeExists: false,
      currentLikeCount: 7,
      liked: true,
    });

    expect(plan.createLikeDoc).toBe(true);
    expect(plan.deleteLikeDoc).toBe(false);
    expect(plan.viewerHasLiked).toBe(true);
    expect(plan.nextLikeCount).toBe(8);
  });

  it("repeated like does not double increment", () => {
    const plan = buildLikeMutationPlan({
      memeExists: true,
      likeExists: true,
      currentLikeCount: 8,
      liked: true,
    });

    expect(plan.createLikeDoc).toBe(false);
    expect(plan.deleteLikeDoc).toBe(false);
    expect(plan.viewerHasLiked).toBe(true);
    expect(plan.nextLikeCount).toBe(8);
  });

  it("unlike decrements count", () => {
    const plan = buildLikeMutationPlan({
      memeExists: true,
      likeExists: true,
      currentLikeCount: 3,
      liked: false,
    });

    expect(plan.createLikeDoc).toBe(false);
    expect(plan.deleteLikeDoc).toBe(true);
    expect(plan.viewerHasLiked).toBe(false);
    expect(plan.nextLikeCount).toBe(2);
  });

  it("repeated unlike does not go negative", () => {
    const plan = buildLikeMutationPlan({
      memeExists: true,
      likeExists: false,
      currentLikeCount: 0,
      liked: false,
    });

    expect(plan.createLikeDoc).toBe(false);
    expect(plan.deleteLikeDoc).toBe(false);
    expect(plan.viewerHasLiked).toBe(false);
    expect(plan.nextLikeCount).toBe(0);
  });

  it("unauthenticated access rejected", () => {
    expect(() => requireAuthenticatedUid(undefined)).toThrowError(
      MemeLikeError,
    );
    expect(() => requireAuthenticatedUid(undefined)).toThrow(
      /Authentication is required/,
    );
  });

  it("missing meme rejected", () => {
    expect(() =>
      buildLikeMutationPlan({
        memeExists: false,
        likeExists: false,
        currentLikeCount: 0,
        liked: true,
      }),
    ).toThrowError(MemeLikeError);
    expect(() =>
      buildLikeMutationPlan({
        memeExists: false,
        likeExists: false,
        currentLikeCount: 0,
        liked: true,
      }),
    ).toThrow(/Meme not found/);
  });

  it("validates request payload", () => {
    expect(() => parseSetMemeLikeRequest({ memeId: "", liked: true })).toThrow(
      /memeId/,
    );
    expect(() =>
      parseSetMemeLikeRequest({ memeId: "abc", liked: "yes" }),
    ).toThrow(/liked must be a boolean/);
  });
});
