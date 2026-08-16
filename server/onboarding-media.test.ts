import { describe, expect, it } from "vitest";
import {
  ONBOARDING_POSTER_URL,
  getOnboardingMedia,
  shouldRenderOnboardingVideo,
} from "../client/src/lib/onboardingMedia";

describe("onboarding media fallback", () => {
  it("always supplies a durable poster, including for text-only slides", () => {
    expect(getOnboardingMedia(1)).toEqual({ clipUrl: null, posterUrl: ONBOARDING_POSTER_URL });
    expect(getOnboardingMedia(4).posterUrl).toBe(ONBOARDING_POSTER_URL);
  });

  it("never renders video after a failure or when motion is reduced", () => {
    expect(shouldRenderOnboardingVideo(2, "ready")).toBe(true);
    expect(shouldRenderOnboardingVideo(2, "failed")).toBe(false);
    expect(shouldRenderOnboardingVideo(2, "reduced-motion")).toBe(false);
    expect(shouldRenderOnboardingVideo(1, "ready")).toBe(false);
  });
});
