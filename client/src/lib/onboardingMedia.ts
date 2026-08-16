/**
 * Project-owned onboarding media. The still is always available; video only
 * enhances the experience and must never gate completion of a slide.
 */
export const ONBOARDING_POSTER_URL = "/manus-storage/specter-fallback_e105fec6.png";

export const ONBOARDING_CLIP_URLS: Record<number, string> = {
  2: "/manus-storage/specter-welcome_662ee125.mp4",
  3: "/manus-storage/specter-intelligence_9d8075e8.mp4",
  4: "/manus-storage/specter-pipeline_be268e1f.mp4",
  5: "/manus-storage/specter-vault_ede2ce49.mp4",
  6: "/manus-storage/specter-strategy_ce639d36.mp4",
};

export type OnboardingMediaState = "loading" | "ready" | "failed" | "reduced-motion";

export function getOnboardingMedia(slideId: number) {
  return {
    clipUrl: ONBOARDING_CLIP_URLS[slideId] ?? null,
    posterUrl: ONBOARDING_POSTER_URL,
  };
}

export function shouldRenderOnboardingVideo(
  slideId: number,
  state: OnboardingMediaState,
) {
  return Boolean(ONBOARDING_CLIP_URLS[slideId]) && state !== "failed" && state !== "reduced-motion";
}
