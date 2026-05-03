/**
 * SpectreVideoPlayer — Specter character animation component
 *
 * Uses the 21 AI-generated Specter MP4 clips hosted on CDN.
 * Each clip is mapped to a semantic "state" that matches a UI context.
 * The player crossfades between clips and loops the active clip.
 *
 * Usage:
 *   <SpectreVideoPlayer state="idle" size="md" />
 *   <SpectreVideoPlayer state="processing" size="lg" className="..." />
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Clip registry ────────────────────────────────────────────────────────────
// Each entry maps a semantic state to one or more CDN URLs.
// When multiple clips share a state, one is chosen at random on each transition.

const BASE = "https://static-assets.manus.space/file/manus-storage";

export type SpectreState =
  | "idle"              // calm breathing — default sidebar widget
  | "idle_neutral"      // rigid forward stare — menu/profile standby
  | "idle_hologram"     // holding rotating hologram — menu/inventory
  | "idle_holding"      // presenting holographic card — feature highlight
  | "welcoming"         // open arms / welcoming gesture — onboarding welcome
  | "presenting"        // hands out presenting options — dashboard intro
  | "pointing"          // pointing directly at viewer — CTA / call to action
  | "thinking"          // finger to temple — AI processing / analyzing
  | "typing"            // typing on hologram keyboard — generating response
  | "thoughtful"        // chin touch + open hand — explaining / answering
  | "cast"              // commanding spell cast — triggering major action
  | "hologram"          // presenting hologram — skill/feature selection
  | "hand_on_heart"     // hand on chest — sincere greeting / /audit page
  | "bow"               // formal bow — formal greeting / /audit page
  | "wave"              // hand raise greeting — welcome / acknowledgment
  | "determined"        // fist to chest — confirming critical decision
  | "triumph"           // fist pump + glow — task complete / deal won
  | "power_up";         // blinding flash fist — level up / activation

const CLIPS: Record<SpectreState, string[]> = {
  idle: [
    `${BASE}/hf_20260503_000541_7cfe329e-91e6-41d4-8584-f98f722ef3da_63f9dd25.mp4`,
  ],
  idle_neutral: [
    `${BASE}/hf_20260503_003626_b5c13543-ddb2-40ee-b19d-2c2371d16946_be8d53f8.mp4`,
  ],
  idle_hologram: [
    `${BASE}/hf_20260502_211341_4ac80b83-1c05-4b01-a6ad-3da9c4301f83_23ad3e20.mp4`,
  ],
  idle_holding: [
    `${BASE}/hf_20260502_212916_e47ec533-68de-4ec9-894a-a8ac0b666b55_3c2bde3b.mp4`,
  ],
  welcoming: [
    `${BASE}/hf_20260503_002137_7360eac7-3852-42f4-9c72-9c3fc20abf2d_47867495.mp4`,
    `${BASE}/hf_20260502_203044_dd378993-612b-426a-9361-ba88ac5cd9e2_11ab1d67.mp4`,
  ],
  presenting: [
    `${BASE}/hf_20260502_203849_a8f8de64-ff0e-4ff9-b10a-bd9fa90f8fcf_2e748e87.mp4`,
  ],
  pointing: [
    `${BASE}/hf_20260502_210103_006c0c69-eee5-42c3-a844-f5a0263262c5_89c744f2.mp4`,
    `${BASE}/hf_20260502_210127_8bb3cdfb-c6e5-46f2-b125-708e661ce5b4_50b9b574.mp4`,
  ],
  thinking: [
    `${BASE}/hf_20260502_235500_5e9803e2-9521-491c-963b-0239e50e2721_9e5506ab.mp4`,
  ],
  typing: [
    `${BASE}/hf_20260502_210704_d39721a7-dbc8-47cc-84a1-6c7c64371d80_a8eb24c6.mp4`,
  ],
  thoughtful: [
    `${BASE}/hf_20260503_003219_517286cd-52ec-44c7-b00a-12ec1ee7807a_c268f9ee.mp4`,
  ],
  cast: [
    `${BASE}/hf_20260502_204413_0386e184-d326-433f-8ef6-2c6a23476aa0_2666a4f9.mp4`,
  ],
  hologram: [
    `${BASE}/hf_20260503_004223_02f6a896-5e88-4d9e-9b2d-2a82dc1d39c6_b6b632d3.mp4`,
  ],
  hand_on_heart: [
    `${BASE}/hf_20260502_211821_a0046d06-816a-4584-8da1-ed990b173964_4da1543f.mp4`,
  ],
  bow: [
    `${BASE}/hf_20260502_205345_137b645e-3e27-46d2-b134-769ec6f03a25_5a8ae74e.mp4`,
  ],
  wave: [
    `${BASE}/hf_20260502_214102_5c78de5f-a0aa-42de-a9a5-4605e13569e4_28799442.mp4`,
  ],
  determined: [
    `${BASE}/hf_20260502_234831_90ab3ebb-1d16-4ea3-b6b8-38a0f1c057f9_4ee0ec3f.mp4`,
  ],
  triumph: [
    `${BASE}/mp__f9ac9948.mp4`,
  ],
  power_up: [
    `${BASE}/Restrained_triumph_The_charac_b3601c14.mp4`,
  ],
};

// ─── Size presets ─────────────────────────────────────────────────────────────
const SIZE_CLASSES: Record<string, string> = {
  xs:  "w-16 h-16",
  sm:  "w-24 h-24",
  md:  "w-40 h-40",
  lg:  "w-64 h-64",
  xl:  "w-80 h-80",
  "2xl": "w-96 h-96",
};

// ─── Component ────────────────────────────────────────────────────────────────
interface SpectreVideoPlayerProps {
  state?: SpectreState;
  size?: keyof typeof SIZE_CLASSES | string;
  loop?: boolean;
  /** Called when a non-looping clip finishes playing */
  onEnded?: () => void;
  className?: string;
  /** Show a subtle dark radial glow beneath the character */
  glow?: boolean;
}

export function SpectreVideoPlayer({
  state = "idle",
  size = "md",
  loop = true,
  onEnded,
  className,
  glow = false,
}: SpectreVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    const clips = CLIPS[state] ?? CLIPS.idle;
    return clips[Math.floor(Math.random() * clips.length)];
  });
  const [visible, setVisible] = useState(true);

  // When state changes, crossfade to the new clip
  useEffect(() => {
    const clips = CLIPS[state] ?? CLIPS.idle;
    const newSrc = clips[Math.floor(Math.random() * clips.length)];

    if (newSrc === currentSrc) {
      // Same clip — just restart it
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    // Fade out → swap src → fade in
    setVisible(false);
    const timer = setTimeout(() => {
      setCurrentSrc(newSrc);
      setVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // When src changes, play the video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentSrc]);

  const sizeClass = SIZE_CLASSES[size] ?? size;

  return (
    <div className={cn("relative flex items-end justify-center", sizeClass, className)}>
      {glow && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl opacity-40"
          style={{ background: "radial-gradient(ellipse, #d4a843 0%, transparent 70%)" }}
        />
      )}
      <video
        ref={videoRef}
        src={currentSrc}
        loop={loop}
        muted
        playsInline
        onEnded={onEnded}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

/**
 * Convenience hook: returns a state setter that automatically transitions
 * back to "idle" after a one-shot clip finishes.
 *
 * Usage:
 *   const [spectreState, triggerSpectre] = useSpectreState("idle");
 *   triggerSpectre("triumph"); // plays triumph, then returns to idle
 */
export function useSpectreState(defaultState: SpectreState = "idle") {
  const [state, setState] = useState<SpectreState>(defaultState);

  const trigger = (nextState: SpectreState, returnTo: SpectreState = defaultState) => {
    setState(nextState);
    // For one-shot states, schedule return after a reasonable duration
    const ONE_SHOT_STATES: SpectreState[] = [
      "triumph", "power_up", "determined", "bow", "cast", "wave", "hand_on_heart",
    ];
    if (ONE_SHOT_STATES.includes(nextState)) {
      // The onEnded callback on the video will handle the return,
      // but we also set a fallback timer in case loop=false isn't set
      const timer = setTimeout(() => setState(returnTo), 4000);
      return () => clearTimeout(timer);
    }
  };

  return [state, trigger, setState] as const;
}
