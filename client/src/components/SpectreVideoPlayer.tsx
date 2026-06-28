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

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Clip registry ────────────────────────────────────────────────────────────
// Each entry maps a semantic state to one or more CDN URLs.
// When multiple clips share a state, one is chosen at random on each transition.

// CDN base — must match OnboardingFlow
const BASE = "/manus-storage";

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
  | "power_up"         // blinding flash fist — level up / activation
  // ── Pleasant onboarding clips (new) ──
  | "welcome_pleasant"   // smiling, presenting to side — black bg, onboarding slide 1
  | "offering_pleasant"  // both hands open, warm smile — grey bg, onboarding slide 2
  | "inviting_pleasant"  // grinning, hand extended forward — dark bokeh, onboarding slide 3
  | "search_hologram"    // holding search hologram — white bg, onboarding slide 4
  | "gear_hologram"      // holding gear orb — white bg, onboarding slide 5
  | "sincere_pleasant"   // hand to chest, subtle smile — dark bg, onboarding slide 6
  | "bow_pleasant"       // smiling, hand on chest bow — white bg, onboarding slide 7
  | "vault_lock"        // holding glowing padlock — grey bg, vault/security
  // ── New pleasant clips (batch 2) ──
  | "inviting_smiling"   // full body, dark bg, smiling + forward gesture — onboarding slide 1
  | "talking"            // full body, dark bg, pleasant talking — onboarding slide 2
  | "this_way"           // full body, dark bg, directing gesture — onboarding slide 3
  | "heart_to_yours"     // dark bg, sincere hand-to-heart — onboarding slide 6
  | "bowing"             // full body, pleasant bow — onboarding slide 7 / success
  | "celebration"        // arms raised, joyful — task complete / deal won
  | "approval"           // thumbs up / nod, pleasant — confirmation
  | "approval_nod"       // determined approval nod — strong confirmation
  | "happy"              // smiling, upbeat — general positive state
  | "happy_greeting"     // warm greeting wave — chatbot welcome
  | "gesturing"          // open gesture toward user — chatbot / explaining
  | "flipping_magic"     // magic trick with glowing cups — loading / processing
  | "digital_trails"     // dark bg with blue energy trails — ambient / background
  | "idol_breathing"     // full body idle breathing — ambient / empty state
  | "majorly_confused"   // confused head tilt — error state
  | "waiting_confused"   // waiting + confused — error / no results
  | "waiting"            // contemplative waiting pose — empty state
  | "ui_loading"        // holding glowing search icon — loading state
  | "data_video"        // data visualization hologram — pipeline/analytics slide
  | "ethereal_reveal"   // ethereal entity emerging — cinematic intro / screen 4
  | "holographic_typing"; // man typing holographic keyboard — vault/knowledge screen

const CLIPS: Record<SpectreState, string[]> = {
  idle: [
    `${BASE}/hf_20260503_000541_7cfe329e-91e6-41d4-8584-f98f722ef3da_6c095791.mp4`,
  ],
  idle_neutral: [
    `${BASE}/hf_20260503_003626_b5c13543-ddb2-40ee-b19d-2c2371d16946_0308c250.mp4`,
  ],
  idle_hologram: [
    `${BASE}/hf_20260502_211341_4ac80b83-1c05-4b01-a6ad-3da9c4301f83_b88dac25.mp4`,
  ],
  idle_holding: [
    `${BASE}/hf_20260502_212916_e47ec533-68de-4ec9-894a-a8ac0b666b55_d7c6ce08.mp4`,
  ],
  welcoming: [
    `${BASE}/hf_20260502_203044_dd378993-612b-426a-9361-ba88ac5cd9e2_22eb71c6.mp4`,
  ],
  presenting: [
    `${BASE}/hf_20260502_203849_a8f8de64-ff0e-4ff9-b10a-bd9fa90f8fcf_2c81370b.mp4`,
  ],
  pointing: [
    `${BASE}/hf_20260502_210103_006c0c69-eee5-42c3-a844-f5a0263262c5_545601c0.mp4`,
    `${BASE}/hf_20260502_210127_8bb3cdfb-c6e5-46f2-b125-708e661ce5b4_9b2a1832.mp4`,
  ],
  thinking: [
    `${BASE}/hf_20260502_235500_5e9803e2-9521-491c-963b-0239e50e2721_f5031812.mp4`,
  ],
  typing: [
    `${BASE}/hf_20260502_210704_d39721a7-dbc8-47cc-84a1-6c7c64371d80_f84ef751.mp4`,
  ],
  thoughtful: [
    `${BASE}/hf_20260503_003219_517286cd-52ec-44c7-b00a-12ec1ee7807a_4d573ab3.mp4`,
  ],
  cast: [
    `${BASE}/hf_20260502_204413_0386e184-d326-433f-8ef6-2c6a23476aa0_3be547a5.mp4`,
  ],
  hologram: [
    `${BASE}/hf_20260503_004223_02f6a896-5e88-4d9e-9b2d-2a82dc1d39c6_5769b801.mp4`,
  ],
  hand_on_heart: [
    `${BASE}/hf_20260502_211821_a0046d06-816a-4584-8da1-ed990b173964_2729c527.mp4`,
  ],
  bow: [
    `${BASE}/hf_20260502_205345_137b645e-3e27-46d2-b134-769ec6f03a25_6f86149d.mp4`,
  ],
  wave: [
    `${BASE}/hf_20260502_214102_5c78de5f-a0aa-42de-a9a5-4605e13569e4_d6f014e7.mp4`,
  ],
  determined: [
    `${BASE}/hf_20260502_234831_90ab3ebb-1d16-4ea3-b6b8-38a0f1c057f9_745f7c13.mp4`,
  ],
  triumph: [
    `${BASE}/mp__3d1f90ea.mp4`,
    `${BASE}/mp_1_new_bcbd7f39.mp4`,
  ],
  power_up: [
    `${BASE}/Restrained_triumph_The_charac_6a346f6b.mp4`,
  ],
  welcome_pleasant: [
    `${BASE}/specter_welcome_pleasant_51c6fad6.mp4`,
  ],
  offering_pleasant: [
    `${BASE}/specter_offering_pleasant_26f0d8dc.mp4`,
  ],
  inviting_pleasant: [
    `${BASE}/specter_inviting_pleasant_049a7dd1.mp4`,
  ],
  search_hologram: [
    `${BASE}/specter_search_hologram_8e32bcda.mp4`,
  ],
  gear_hologram: [
    `${BASE}/specter_gear_hologram_e6735037.mp4`,
  ],
  sincere_pleasant: [
    `${BASE}/specter_sincere_pleasant_fd64bd09.mp4`,
  ],
  bow_pleasant: [
    `${BASE}/specter_bow_nobg_1ec3bba7.webm`,
  ],
  vault_lock: [
    `${BASE}/specter_vault_lock_16e573ea.mp4`,
  ],
  inviting_smiling: [
    `${BASE}/SpectorInvitingSmiling_92a14245.mp4`,
  ],
  talking: [
    `${BASE}/SpectorTalking_c166a610.mp4`,
  ],
  this_way: [
    `${BASE}/SpectorThisWay_32888b15.mp4`,
  ],
  heart_to_yours: [
    `${BASE}/SpectorHearttoYours_c1a0c2c6.mp4`,
  ],
  bowing: [
    `${BASE}/specter_bowing_cropped_39485b8b.mp4`,
  ],
  celebration: [
    `${BASE}/SpectorCelebration_195be803.mp4`,
  ],
  approval: [
    `${BASE}/SpectorApproval_fdf9628b.mp4`,
  ],
  approval_nod: [
    `${BASE}/SpectorApprovalNod_78496d10.mp4`,
  ],
  happy: [
    `${BASE}/SpectorHappy_b40303f1.mp4`,
  ],
  happy_greeting: [
    `${BASE}/SpectorHappyGreeting_2857a01f.mp4`,
  ],
  gesturing: [
    `${BASE}/SpectorGesturing_e1ab809c.mp4`,
  ],
  flipping_magic: [
    `${BASE}/SpectorFlippingMagic_f55402cd.mp4`,
  ],
  digital_trails: [
    `${BASE}/SpectorDigitalTrails_a375c572.mp4`,
  ],
  idol_breathing: [
    `${BASE}/SpectorIdolBreathing_ef95ba2b.mp4`,
  ],
  majorly_confused: [
    `${BASE}/SpectorMajorlyConfused_27f15ceb.mp4`,
  ],
  waiting_confused: [
    `${BASE}/SpectorWaitingConfused_305f40fa.mp4`,
  ],
  waiting: [
    `${BASE}/SpectorWaiting2_3d7b5780.mp4`,
  ],
  ui_loading: [
    `${BASE}/SpectorUILoading_85cd0594.mp4`,
  ],
  data_video: [
    `${BASE}/specter_datavideo_cropped_e63779d0.mp4`,
  ],
  ethereal_reveal: [
    `${BASE}/specter_ethereal_reveal_ac7f994c.mp4`,
  ],
  holographic_typing: [
    `${BASE}/specter_holographic_typing_7d89d984.mp4`,
  ],
};

// Note: Poster/still image registry removed — assets don't exist in production.
// Using CSS gradient placeholders instead for loading/error states.

// ─── Blend mode registry ────────────────────────────────────────────────────────
// Clips with dark/black backgrounds use 'screen' to blend out the bg.
// Clips with white/grey/light backgrounds use 'multiply' to blend out the bg.
// 'normal' = no blending (use when the clip has a transparent or fully dark bg).
const BLEND_MODES: Partial<Record<SpectreState, string>> = {
  // Light background clips — use multiply to remove white/grey bg
  offering_pleasant:  "multiply",  // grey gradient bg
  search_hologram:    "multiply",  // white bg
  gear_hologram:      "multiply",  // white bg
  // bow_pleasant: transparent webm — use screen (default) to blend out dark letterbox bars
  vault_lock:         "multiply",  // grey bg
  // New batch 2 — light bg clips use multiply
  inviting_smiling:   "multiply",  // light bg
  talking:            "multiply",  // light bg
  // this_way: dark bg — screen (default) works fine
  // heart_to_yours: dark bg — screen (default) works fine
  bowing:             "multiply",  // light bg
  celebration:        "multiply",  // light bg
  approval:           "multiply",  // light bg
  approval_nod:       "multiply",  // light bg
  happy:              "multiply",  // light bg
  happy_greeting:     "multiply",  // light bg
  gesturing:          "multiply",  // light bg
  flipping_magic:     "multiply",  // light bg
  idol_breathing:     "multiply",  // light bg
  majorly_confused:   "multiply",  // light bg
  waiting_confused:   "multiply",  // light bg
  waiting:            "multiply",  // light bg
  ui_loading:         "multiply",  // light bg with ui overlay
  // Dark background clips — use screen (default)
  // welcome_pleasant: pure black bg — screen is perfect
  // inviting_pleasant: dark cinematic bokeh — screen works
  // sincere_pleasant: dark bg — screen works
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
  /** Inline style for the container element */
  style?: React.CSSProperties;
  /** Show a subtle dark radial glow beneath the character */
  glow?: boolean;
}

export function SpectreVideoPlayer({
  state = "idle",
  size = "md",
  loop = true,
  onEnded,
  className,
  style,
  glow = false,
}: SpectreVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    const clips = CLIPS[state] ?? CLIPS.idle;
    return clips[Math.floor(Math.random() * clips.length)];
  });
  const [visible, setVisible] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

    // Reset error state on state change
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);

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

  // Handle video errors with retry logic and graceful fallback
  const handleVideoError = useCallback(() => {
    console.warn(`Video failed to load: ${currentSrc}`);
    
    if (retryCount < 2) {
      // Retry with exponential backoff
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
          videoRef.current.play().catch(() => {});
        }
      }, 400 * (retryCount + 1));
    } else {
      // Max retries reached — show error state with CSS placeholder
      setHasError(true);
      setIsLoading(false);
    }
  }, [currentSrc, retryCount]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  return (
    <div className={cn("relative flex items-end justify-center", sizeClass, className)} style={style}>
      {glow && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-xl opacity-40"
          style={{ background: "radial-gradient(ellipse, #d4a843 0%, transparent 70%)" }}
        />
      )}
      
      {/* Loading placeholder with shimmer */}
      {isLoading && !hasError && (
        <div 
          className="absolute inset-0 rounded-lg"
          style={{ 
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
            backgroundSize: "200% 200%",
            animation: "specter-shimmer 2s ease-in-out infinite",
          }}
        />
      )}
      
      {/* Error state — CSS gradient placeholder */}
      {hasError && (
        <div 
          className="absolute inset-0 rounded-lg flex items-center justify-center"
          style={{ 
            background: "linear-gradient(135deg, #0d0d12 0%, #1a1a24 50%, #0d0d12 100%)",
          }}
        >
          {/* Subtle glow effect */}
          <div 
            className="absolute w-1/2 h-1/2 rounded-full opacity-30"
            style={{ 
              background: "radial-gradient(circle, rgba(201,160,74,0.3) 0%, transparent 70%)",
              animation: "specter-pulse 3s ease-in-out infinite",
            }}
          />
        </div>
      )}
      
      <video
        ref={videoRef}
        src={currentSrc}
        loop={loop}
        muted
        playsInline
        preload="auto"
        onEnded={onEnded}
        onError={handleVideoError}
        onLoadedData={handleLoadedData}
        autoPlay
        onLoadStart={handleLoadStart}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          mixBlendMode: (BLEND_MODES[state] ?? "screen") as React.CSSProperties["mixBlendMode"],
          display: hasError ? "none" : "block"
        }}
      />
      
      {/* Keyframe animations */}
      <style>{`
        @keyframes specter-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes specter-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }
      `}</style>
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
