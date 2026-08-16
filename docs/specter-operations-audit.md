# Specter Operations: Current Command-Center Behavior

The Command Center already exposes the latest generated Specter Briefing, stale-deal alerts, and a data-driven Next Best Action list. The operational pass adds a real **next conversation** cue based on confirmed upcoming bookings. It does not fabricate appointments or activity.

When an upcoming booking exists, **Prepare pre-call audit** carries the prospect’s booking name, email, meeting type, and scheduled time into Lead Intelligence. Specter presents that information for review before the operator explicitly runs the audit. This preserves human control while making the pre-call workflow one click from the command center.

The daily scheduling infrastructure has been bootstrapped but is deliberately not activated until the new callback is built, checkpointed, published, and configured against the production URL. This avoids relying on in-process timers that are not durable in autoscaled hosting.
