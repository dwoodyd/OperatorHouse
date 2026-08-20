# Conversion Audit Notes

The supplied Claude artifact URL returned a public “Page not found” response when reviewed on 2026-08-17, so no additional artifact-only material could be verified. The operator-provided audit observations remain sufficiently specific to act on directly.

Immediate verified work items are: permit data-URI fonts in the production CSP; permit the configured analytics script host in `script-src`; prevent protected profile fetches for anonymous users; add explicit focus visibility to the public application form; and standardize the product identity as **Operator House** with **Specter** as the AI intelligence operator.

The recommended next capability is a client-shareable, branded source trail for Vault-grounded strategy recommendations. Its design must preserve workspace ownership, avoid exposing raw Vault content by default, support revocation and expiration, and clearly distinguish source references from AI-generated conclusions.

## Onboarding Media Recovery

The development preview opened on the public landing page because the current browser session already has `oh_visitor_splash_shown=true` in session storage. The onboarding completion state is session-scoped for this anonymous preview; no persistent visitor completion key was present in local storage. The replay validation should therefore clear `oh_visitor_splash_shown`, reload the preview, advance to the first cinematic slide, and test the retry control after a forced media error.

After clearing the session marker, the preview correctly opened on the video-free first screen. The brand/pain-hook slide remains legible and actionable before any video is attempted, with a visible named CTA and skip control. This confirms that a video failure cannot block entry.

The first cinematic slide then rendered the portrait poster cleanly, with the character fully visible and the slide CTA active. The poster remains a credible visual state while the video loads; the browser playback state is checked separately rather than inferred from a static screenshot.

The primary preview video was confirmed healthy after the expanded preload: `readyState=4`, `paused=false`, a nonzero playback time, and no media error. A preview-only invalid source was then assigned to exercise the fallback controls; this does not alter any saved media configuration.

The forced failure retained the character poster, preserved the onboarding CTA and skip affordance, and displayed the visible **Retry motion** control. The retry action was invoked; the playback state is checked after the remounted video has time to load.

After adding stale-event protection to the retry path, a fresh session replay again opened cleanly on the video-free first slide. This resets the test state before rechecking the cinematic retry against a current component instance.

The refreshed preview also advanced successfully to the first cinematic slide after hot reload, with the poster visible while the clip initializes. The remaining check is limited to the forced-error retry path.

The controlled error path on the refreshed component again presented the poster, active next-step CTA, skip control, and **Retry motion** action. This confirms the fallback remains non-blocking while the final retry remount is tested.

Following the timeout-reset update, a new anonymous preview session again rendered the text-first opening screen correctly. The final browser check will exercise the error/retry state against this fresh mount.

That clean final replay reached the first cinematic slide before a preview-only invalid source was assigned. The next observation will verify that the timeout-reset retry restores the valid video element.

The fresh-session retry implementation was loaded in the preview and advanced successfully to the first cinematic slide. The final check now forces a preview-only failure and confirms that retry reloads the same slide into a new media context.

The final forced error again presented the non-blocking poster fallback and Retry motion control on the expected cinematic slide. The next action invokes the retry, which should reload the same slide from its clean source.

The manual browser test changed a native video element’s `src` directly before dispatching the failure. That source mutation can persist across the development-preview media lifecycle and is not representative of a normal `onError` event. The final validation therefore resets the page to the valid media source, simulates only the error event, and verifies the retry against the original source.

The preserved-slide reload restored the original `specter-welcome` clip. A synthetic `error` event then entered the fallback state without mutating that clip URL, giving the retry control a valid media source to reload.

The session-preserving retry correctly restarted the onboarding state, but the cinematic element again entered the fallback path. The remaining investigation moves below the UI retry layer to the `/manus-storage/` proxy response and browser media compatibility.

The fallback and retry control remain visible after the latest retry attempt, indicating that a complete component-level reset is more reliable than relying on a nested video remount after a browser-level source mutation. The non-blocking fallback remains correct while the retry mechanism is simplified.

The clean replay advanced to the first cinematic slide successfully before a second preview-only invalid source was assigned. This isolated test is used to ensure the new retry nonce prevents the old failed element from overriding a fresh video mount.

The second forced failure again showed the poster, preserved the next-step CTA, and exposed the retry control. The immediate post-click view still showed the fallback notice, so the remounted video element is being inspected directly before treating the retry path as complete.
