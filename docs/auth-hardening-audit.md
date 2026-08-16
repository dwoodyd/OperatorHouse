# Authentication Hardening Audit

The recovery route must bypass the global splash/onboarding layer. Otherwise an unauthenticated recovery visit is masked by the first-run experience instead of showing the actionable sign-in guidance.

The retained return path must be short-lived, internal-only, and consumed after successful authentication so login never creates a redirect loop or sends a user to an unexpected external location.

Visual verification in the development preview confirmed that `/auth/recovery?reason=callback` renders the intended branded recovery card with both recovery actions. The global install prompt and Specter chat are intentionally suppressed on this route so the recovery guidance remains the only focus.

During first-run verification, an unauthenticated background request attempted to launch external sign-in from the public entry route. The global redirect policy now suppresses unauthorized background responses on intentionally public paths; only an explicit sign-in action or an internal protected route can initiate the OAuth handoff.

Onboarding verification confirmed that the visitor remains inside Operator House after the splash, slide one remains completely usable without media, and a simulated video error on slide two preserves its still image, controls, and visible fallback status. The install prompt and floating chat are suppressed until the onboarding gate is complete, preventing secondary UI from competing with the entry experience.
