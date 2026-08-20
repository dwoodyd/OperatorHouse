import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("uses full preload, ambient poster motion, and a retry control without blocking text progression", () => {
    const flow = readFileSync(resolve(process.cwd(), "client/src/components/OnboardingFlow.tsx"), "utf8");
    expect(flow).toContain('preload="auto"');
    expect(flow).toContain("poster-ambient");
    expect(flow).toContain("Retry motion");
    expect(flow).toContain("retryCinematicLayer");
    expect(flow).toContain('sessionStorage.setItem("oh_onboarding_retry_slide"');
    expect(flow).toContain("window.location.reload()");
    expect(flow).toContain("slideIdx, videoRetryNonce");
    expect(flow).toContain("}, 15000);");
  });
});
