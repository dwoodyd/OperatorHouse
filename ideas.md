# GhostDesk — Design Brainstorm

## Context
GhostDesk is an AI-powered consulting command center for the Soul Engineer brand. It's a dark, premium, intelligence-driven tool for a platinum-selling artist turned AI consultant. The aesthetic must feel like a high-end war room — not a generic SaaS dashboard.

---

<response>
<probability>0.07</probability>
<text>
## Idea 1: "Obsidian Intelligence" — Dark Brutalism meets Luxury Command Center

**Design Movement:** Dark Brutalism + Luxury Editorial (think Dazed & Confused meets Bloomberg Terminal)

**Core Principles:**
- Raw power expressed through heavy typography and stark contrast
- Information density that feels intentional, not overwhelming
- Every surface communicates authority and precision
- "Ghost" aesthetic: things appear and disappear with purpose

**Color Philosophy:**
- Background: Near-black obsidian (#0A0A0B) — not pure black, slightly warm
- Primary accent: Electric amber (#F5A623) — the "signal" color, used sparingly for critical data
- Secondary: Deep slate (#1C1C21) for card surfaces
- Text: Off-white (#E8E6E0) primary, medium gray (#6B6B7A) secondary
- Emotional intent: Power, precision, late-night focus, "the work is happening here"

**Layout Paradigm:**
- Asymmetric sidebar (narrow, icon-only collapsed state) + wide content area
- Content area uses a "newspaper grid" — unequal column widths, deliberate tension
- Cards have hard edges (no border-radius) with a single amber left-border accent
- Data tables feel like Bloomberg terminal: dense, monospace, high-contrast

**Signature Elements:**
- Thin amber horizontal rule that "pulses" when AI is processing
- Ghost watermark behind hero sections (large, low-opacity "GD" monogram)
- Monospace font for all data/numbers (Fira Code), editorial serif for headings (Playfair Display), clean sans for body (DM Sans)

**Interaction Philosophy:**
- Hover states reveal hidden data (tooltip-style expansions)
- Transitions are fast (150ms) — this is a work tool, not a showpiece
- AI processing states use a subtle amber glow pulse, not a spinner

**Animation:**
- Page transitions: horizontal slide (left panel stays fixed, content slides)
- Data loading: numbers count up from 0
- New items: fade in from slightly below (8px translate)
- AI generating: typewriter effect for text output

**Typography System:**
- Display: Playfair Display Bold — for section headers and hero text
- Data: Fira Code Regular/Medium — for all numbers, IDs, and technical data
- Body: DM Sans 400/500 — for all readable content
- Hierarchy: 48px display → 24px section → 16px body → 13px data label
</text>
</response>

<response>
<probability>0.06</probability>
<text>
## Idea 2: "Midnight Studio" — Producer's Console Aesthetic

**Design Movement:** Music Production Software meets Premium SaaS (think Ableton Live meets Linear.app)

**Core Principles:**
- Interface feels like a mixing board — everything has a purpose and a position
- Horizontal rhythm dominates (like audio tracks in a DAW)
- Status indicators everywhere — you always know what's "playing"
- The "Ghost" is always working in the background

**Color Philosophy:**
- Background: Charcoal (#111318) — warm dark, not cold
- Primary accent: Neon teal (#00D4AA) — "active/live" signal
- Secondary accent: Muted coral (#FF6B6B) — "alert/attention"
- Surface: Dark navy (#161B27) for cards
- Emotional intent: Creative focus, flow state, professional studio environment

**Layout Paradigm:**
- Horizontal "track" layout for the pipeline (leads flow left to right like audio tracks)
- Top bar is a "transport bar" — shows current active tasks and AI status
- Left sidebar is narrow and icon-based (like a DAW toolbar)
- Bottom panel is a "console" — shows AI output and logs

**Signature Elements:**
- Waveform-style progress indicators
- "BPM counter" style metrics (numbers that pulse)
- Track-lane Kanban for the client pipeline

**Interaction Philosophy:**
- Everything is keyboard-accessible (power user focus)
- Right-click context menus everywhere
- Drag-and-drop pipeline management

**Animation:**
- Waveform animations for AI processing states
- Smooth horizontal scrolling for pipeline view
- Teal glow on active/selected items

**Typography System:**
- Display: Space Grotesk Bold — geometric, modern, studio-feel
- Mono: JetBrains Mono — for all data and code
- Body: Inter 400/500 — clean and functional
</text>
</response>

<response>
<probability>0.05</probability>
<text>
## Idea 3: "Ghost Protocol" — Cinematic Noir Intelligence

**Design Movement:** Cinematic Noir + Tactical Intelligence (think The Dark Knight's Batcave meets Notion's minimalism)

**Core Principles:**
- Everything is revealed gradually — information unfolds like a briefing
- Negative space is weaponized — what's NOT shown is as important as what is
- The interface feels classified — like accessing a private intelligence system
- Monochromatic with a single signal color

**Color Philosophy:**
- Background: True dark (#080C10) — almost black with a blue undertone
- Primary accent: Ice blue (#4FC3F7) — "classified signal" color
- Surface: Very dark blue-gray (#0F1419) for cards
- Text: Pure white (#FFFFFF) primary, blue-gray (#8899AA) secondary
- Emotional intent: Classified, intelligent, cinematic, "you have clearance"

**Layout Paradigm:**
- Full-screen sections that reveal on scroll
- Centered content with extreme horizontal padding
- Data presented in "briefing document" style — structured, numbered, classified

**Signature Elements:**
- Scanline effect on hero sections (subtle CSS overlay)
- "CLASSIFIED" / "GHOST PROTOCOL" watermarks in the background
- Ice blue underlines instead of borders

**Interaction Philosophy:**
- Slow, deliberate transitions (300ms+) — everything feels weighty
- Hover reveals "declassify" animations
- Loading states use "decrypting" text animations

**Animation:**
- Glitch effect on page load (one-time, 500ms)
- Text appears character by character for AI output
- Cards "unlock" with a subtle scale + opacity transition

**Typography System:**
- Display: Bebas Neue — cinematic, bold, classified-document feel
- Body: Roboto Mono — everything feels like a report
- Accent: Rajdhani — for labels and metadata
</text>
</response>

---

## Selected Design: **Idea 1 — "Obsidian Intelligence"**

This approach best matches the Soul Engineer brand: authoritative, premium, and built for serious work. The amber accent color creates a distinctive visual identity that no other consulting tool uses (most use blue). The editorial typography (Playfair Display) nods to the creative/music background while the monospace data font (Fira Code) signals technical precision.

**Chosen palette:** Obsidian (#0A0A0B) + Amber (#F5A623) + Off-white (#E8E6E0)  
**Chosen fonts:** Playfair Display (headings) + DM Sans (body) + Fira Code (data)  
**Chosen layout:** Asymmetric sidebar + newspaper grid content area
