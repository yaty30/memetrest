import { describe, expect, it, vi } from "vitest";
import {
  buildOptimisticMemeLikeSnapshot,
  runOptimisticMemeLikeMutation,
} from "./memeLikeMutation";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("meme like optimistic mutation", () => {
  it("builds optimistic state immediately from previous state", () => {
    expect(
      buildOptimisticMemeLikeSnapshot({
        viewerHasLiked: false,
        likeCount: 7,
      }),
    ).toEqual({
      viewerHasLiked: true,
      likeCount: 8,
    });

    expect(
      buildOptimisticMemeLikeSnapshot({
        viewerHasLiked: true,
        likeCount: 0,
      }),
    ).toEqual({
      viewerHasLiked: false,
      likeCount: 0,
    });
  });

  it("reconciles with backend authoritative response on success", async () => {
    const applyOptimistic = vi.fn();
    const reconcileAuthoritative = vi.fn();
    const rollback = vi.fn();
    const pending = deferred<{
      memeId: string;
      viewerHasLiked: boolean;
      likeCount: number;
    }>();

    const runPromise = runOptimisticMemeLikeMutation({
      memeId: "meme-1",
      previous: { viewerHasLiked: false, likeCount: 2 },
      inFlight: false,
      applyOptimistic,
      reconcileAuthoritative,
      rollback,
      request: () => pending.promise,
    });

    expect(applyOptimistic).toHaveBeenCalledTimes(1);
    expect(applyOptimistic).toHaveBeenCalledWith({
      viewerHasLiked: true,
      likeCount: 3,
    });
    expect(reconcileAuthoritative).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();

    pending.resolve({
      memeId: "meme-1",
      viewerHasLiked: true,
      likeCount: 11,
    });
    await runPromise;

    expect(reconcileAuthoritative).toHaveBeenCalledWith({
      memeId: "meme-1",
      viewerHasLiked: true,
      likeCount: 11,
    });
    expect(rollback).not.toHaveBeenCalled();
  });

  it("rolls back to previous state on backend failure", async () => {
    const applyOptimistic = vi.fn();
    const reconcileAuthoritative = vi.fn();
    const rollback = vi.fn();

    await runOptimisticMemeLikeMutation({
      memeId: "meme-1",
      previous: { viewerHasLiked: true, likeCount: 4 },
      inFlight: false,
      applyOptimistic,
      reconcileAuthoritative,
      rollback,
      request: async () => {
        throw new Error("network");
      },
    });

    expect(applyOptimistic).toHaveBeenCalledWith({
      viewerHasLiked: false,
      likeCount: 3,
    });
    expect(reconcileAuthoritative).not.toHaveBeenCalled();
    expect(rollback).toHaveBeenCalledWith({
      viewerHasLiked: true,
      likeCount: 4,
    });
  });

  it("blocks repeated taps while request is in-flight", async () => {
    const applyOptimistic = vi.fn();
    const reconcileAuthoritative = vi.fn();
    const rollback = vi.fn();
    const request = vi.fn();

    const accepted = await runOptimisticMemeLikeMutation({
      memeId: "meme-1",
      previous: { viewerHasLiked: false, likeCount: 1 },
      inFlight: true,
      applyOptimistic,
      reconcileAuthoritative,
      rollback,
      request,
    });

    expect(accepted).toBe(false);
    expect(applyOptimistic).not.toHaveBeenCalled();
    expect(reconcileAuthoritative).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
});
