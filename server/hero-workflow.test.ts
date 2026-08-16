import { describe, expect, it } from "vitest";
import { getOnboardingMedia } from "../client/src/lib/onboardingMedia";

describe("hero workflow resilience", () => {
  it("keeps the entry experience independent from video playback", () => {
    expect(getOnboardingMedia(2).clipUrl).toContain("/manus-storage/specter-welcome_");
    expect(getOnboardingMedia(2).posterUrl).toContain("/manus-storage/specter-fallback_");
  });
});
