import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface OnboardingFlowProps {
  onComplete: () => void;
  isReplay?: boolean;
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
  .oh-v2-root{--bg:#0b0a08;--ink:#efe9dc;--muted:#908775;--quiet:#5a5346;--gold:#d8a85a;--gold-bright:#f4c87a;--amber:#e58c2c;--term:#5fbf6f;--signal:#6b9bd6;--card:rgba(255,255,255,0.025);--card-border:rgba(216,168,90,0.14);}
  .oh-v2-slide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1.5rem;opacity:0;transform:translateY(14px);transition:opacity 700ms ease,transform 700ms ease;pointer-events:none;overflow-y:auto;}
  .oh-v2-slide.active{opacity:1;transform:translateY(0);pointer-events:auto;}
  .oh-dot-p{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.13);transition:width 400ms ease,background 400ms ease;border:none;cursor:pointer;padding:0;}
  .oh-dot-p.active{background:var(--gold);width:22px;border-radius:4px;}
  .oh-door-panel{transform:perspective(900px) rotateY(-22deg);transition:transform 1300ms cubic-bezier(0.22,0.95,0.4,1);}
  .oh-door-wrap:hover .oh-door-panel{transform:perspective(900px) rotateY(-30deg);}
  .oh-door-wrap.opening .oh-door-panel{transform:perspective(900px) rotateY(-100deg);}
  .oh-door-wrap.walking{transform:scale(14) translateY(-8%);transition:transform 1800ms cubic-bezier(0.55,0,0.65,0);}
  .oh-door-light{transition:opacity 1200ms ease,transform 1200ms ease;}
  .oh-door-wrap.opening .oh-door-light{opacity:1!important;transform:translateX(-50%) scaleY(1.15)!important;}
  .oh-door-wrap:hover .oh-door-light{opacity:0.75!important;}
  .oh-door-interior{transition:opacity 800ms ease;}
  .oh-door-wrap.opening .oh-door-interior{opacity:1!important;}
  .oh-door-wrap:hover .oh-door-interior{opacity:0.6!important;}
  .oh-door-frame{transition:box-shadow 1200ms ease;}
  .oh-door-wrap.opening .oh-door-frame{box-shadow:0 0 160px rgba(244,200,122,0.45),inset 0 0 60px rgba(244,200,122,0.15)!important;}
  .oh-goldout{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at center,#f4c87a 0%,#d8a85a 30%,transparent 70%);opacity:0;pointer-events:none;transition:opacity 600ms ease;}
  .oh-goldout.show{opacity:1;}
  .oh-goldout.fading{opacity:0;transition:opacity 800ms ease;}
  .oh-col-card{height:14px;border-radius:3px;margin-bottom:0.35rem;opacity:0;transform:translateY(4px);animation:ohCardSlide 600ms ease-out forwards;}
  .oh-col-card.flow{background:linear-gradient(90deg,rgba(216,168,90,0.4),rgba(216,168,90,0.06));animation:ohCardFlow 3.6s linear infinite;}
  @keyframes ohCardSlide{to{opacity:1;transform:translateY(0);}}
  @keyframes ohCardFlow{0%{opacity:0.4;}50%{opacity:1;}100%{opacity:0.4;}}
  @keyframes ohPulseLive{0%,100%{opacity:0.6;}50%{opacity:1;}}
  .oh-live-dot{animation:ohPulseLive 2s ease-in-out infinite;}
  .oh-cta{background:var(--gold);color:#14110c;border:none;padding:0.9rem 2.2rem;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;letter-spacing:0.01em;transition:transform 200ms ease,box-shadow 250ms ease,background 200ms ease;}
  .oh-cta:hover{transform:translateY(-1px);background:var(--gold-bright);box-shadow:0 16px 50px rgba(216,168,90,0.32);}
  .oh-ghost-btn{background:transparent;color:var(--quiet);border:none;cursor:pointer;font-size:0.85rem;font-family:inherit;transition:color 200ms ease;}
  .oh-ghost-btn:hover{color:var(--ink);}
  .oh-skip{position:absolute;top:1.1rem;right:1.1rem;background:transparent;border:1px solid rgba(255,255,255,0.10);color:var(--quiet);font-family:'JetBrains Mono','Menlo',monospace;font-size:0.65rem;letter-spacing:0.14em;padding:0.35rem 0.85rem;border-radius:6px;cursor:pointer;transition:color 200ms,border-color 200ms;z-index:10;}
  .oh-skip:hover{color:var(--ink);border-color:var(--gold);}
  @media(max-width:600px){.oh-pipeline-cols{grid-template-columns:repeat(2,1fr)!important;}.oh-vault-grid{grid-template-columns:repeat(2,1fr)!important;}.oh-ledger{grid-template-columns:repeat(1,1fr)!important;}}
`;

function GhostSlide({ onNext, active }: { onNext: () => void; active: boolean }) {
  const lines = [
    { text: "> analyze lead acme-corp", type: "user" },
    { text: "  Running Operator Audit...", type: "muted" },
    { text: "  Intent score: 87  ·  Stage: Proposal", type: "gold" },
    { text: "> generate strategy Q3-retainer", type: "user" },
    { text: "  Drafting engagement playbook...", type: "muted" },
    { text: "  Strategy ready  ·  4 sections", type: "gold" },
    { text: "> briefing today", type: "user" },
    { text: "  3 clients  ·  2 proposals  ·  1 stale deal", type: "gold" },
  ];
  const [displayed, setDisplayed] = useState<string[]>(lines.map(() => ""));
  const animated = useRef(false);
  useEffect(() => {
    if (!active || animated.current) return;
    animated.current = true;
    lines.forEach((line, i) => {
      setTimeout(() => {
        if (line.type === "user") {
          let idx = 0;
          const type = () => {
            setDisplayed(prev => { const n = [...prev]; n[i] = line.text.slice(0, idx); return n; });
            idx++;
            if (idx <= line.text.length) setTimeout(type, 22 + Math.random() * 28);
          };
          type();
        } else {
          setDisplayed(prev => { const n = [...prev]; n[i] = line.text; return n; });
        }
      }, i * 580);
    });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const colorMap: Record<string, string> = { user: "var(--term)", muted: "var(--quiet)", gold: "var(--gold)" };
  const mono = "'JetBrains Mono','Menlo',monospace";
  const serif = "'Iowan Old Style','Apple Garamond','Georgia',serif";
  return (
    <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.24em", textTransform: "uppercase" as const, color: "var(--term)", marginBottom: "1.2rem" }}>Persona · The Ghost</div>
      <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: "clamp(1.9rem,4.6vw,2.8rem)", lineHeight: 1.13, color: "white", marginBottom: "1.2rem" }}>
        While you sleep,<br /><span style={{ color: "var(--gold-bright)", fontStyle: "italic" }}>someone is preparing your day.</span>
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>
        The Ghost is your autonomous worker — running lead audits, drafting follow-ups, surfacing stale deals. By the time you sit down at the desk, 90% is already done.
      </p>
      <div style={{ margin: "1.4rem auto 0", maxWidth: 600, background: "#050505", border: "1px solid var(--card-border)", borderRadius: 10, padding: "1rem 1.2rem", textAlign: "left" as const, fontFamily: mono, fontSize: "0.82rem", lineHeight: 1.7, boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.8rem", paddingBottom: "0.55rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--term)" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gold)" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
          <div style={{ color: "var(--quiet)", fontSize: "0.63rem", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginLeft: "auto" }}>ghost · activity log · 04:12 am</div>
        </div>
        {lines.map((line, i) => (
          <div key={i} style={{ color: colorMap[line.type], whiteSpace: "nowrap" as const, overflow: "hidden", minHeight: "1.4em" }}>{displayed[i]}</div>
        ))}
      </div>
      <div style={{ marginTop: "1.8rem" }}><button className="oh-cta" onClick={onNext}>And during the day? →</button></div>
    </div>
  );
}

function HoursSlide({ onNext, active }: { onNext: () => void; active: boolean }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const animated = useRef(false);
  useEffect(() => {
    if (!active || animated.current) return;
    animated.current = true;
    let n = 0;
    const tick = () => { if (n <= 47) { setCount(n); n++; setTimeout(tick, 38); } else { setDone(true); } };
    tick();
  }, [active]);
  const mono = "'JetBrains Mono','Menlo',monospace";
  const serif = "'Iowan Old Style','Apple Garamond','Georgia',serif";
  const ledger = [{ what: "Lead audits", amt: "14h" }, { what: "Strategy drafts", amt: "19h" }, { what: "Follow-ups", amt: "14h" }];
  return (
    <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
      <div style={{ fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.24em", textTransform: "uppercase" as const, color: "var(--amber)", marginBottom: "1.2rem" }}>The metric that matters</div>
      <div style={{ width: 260, margin: "0 auto 1.4rem", padding: "1.6rem 1.8rem", background: "linear-gradient(180deg,rgba(216,168,90,0.08),rgba(255,255,255,0.01))", border: "1px solid rgba(216,168,90,0.25)", borderRadius: 14, textAlign: "center" as const }}>
        <div style={{ color: "var(--gold)", fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase" as const, marginBottom: "0.55rem" }}>Hours saved this month</div>
        <div style={{ fontFamily: serif, fontSize: "3.8rem", color: "var(--gold-bright)", lineHeight: 1 }}>
          {count}{done && <span style={{ fontSize: "1.5rem", color: "var(--muted)", marginLeft: 4 }}>h</span>}
        </div>
        <div style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.35rem" }}>prep, follow-ups, drafting, briefing</div>
      </div>
      <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: "clamp(1.9rem,4.6vw,2.8rem)", lineHeight: 1.13, color: "white", marginBottom: "1.2rem" }}>
        Time, returned.<br /><span style={{ color: "var(--gold-bright)", fontStyle: "italic" }}>Back where it belongs.</span>
      </h1>
      <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>Ghost Efficiency target: 90%. Average user reclaims a workday and a half every week — for the strategy, the relationships, the craft you went solo to do.</p>
      <div className="oh-ledger" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.55rem", maxWidth: 520, margin: "1.2rem auto 0" }}>
        {ledger.map(l => (
          <div key={l.what} style={{ padding: "0.7rem 0.55rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8, textAlign: "left" as const }}>
            <div style={{ color: "var(--muted)", fontFamily: mono, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" as const }}>{l.what}</div>
            <div style={{ color: "var(--gold)", fontFamily: serif, fontSize: "1.25rem", marginTop: "0.12rem" }}>{l.amt}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1.8rem" }}><button className="oh-cta" onClick={onNext}>Take me inside →</button></div>
    </div>
  );
}

export default function OnboardingFlow({ onComplete, isReplay = false }: OnboardingFlowProps) {
  const completeOnboarding = trpc.onboarding.complete.useMutation();
  const [slide, setSlide] = useState(1);
  const [entering, setEntering] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const goldoutRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLElement>(null);
  const doorWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.getElementById("oh-v2-styles")) return;
    const style = document.createElement("style");
    style.id = "oh-v2-styles";
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById("oh-v2-styles")?.remove(); };
  }, []);

  const goTo = (n: number) => { setSlide(n); window.scrollTo({ top: 0, behavior: "instant" }); };

  const enterTheHouse = () => {
    if (entering || slide !== 1) { goTo(2); return; }
    setEntering(true);
    const door = doorWrapRef.current;
    const s1 = slide1Ref.current;
    const goldout = goldoutRef.current;
    if (!door || !s1 || !goldout) { goTo(2); setEntering(false); return; }
    door.classList.add("opening");
    setTimeout(() => { s1.classList.add("exiting"); door.classList.add("walking"); }, 450);
    setTimeout(() => { goldout.classList.add("show"); }, 1500);
    setTimeout(() => { goTo(2); door.classList.remove("opening", "walking"); s1.classList.remove("exiting"); }, 2050);
    setTimeout(() => { goldout.classList.add("fading"); }, 2200);
    setTimeout(() => { goldout.classList.remove("show", "fading"); setEntering(false); }, 3000);
  };

  const finish = () => {
    setWelcomed(true);
    if (!isReplay) completeOnboarding.mutate();
    setTimeout(() => { sessionStorage.setItem("oh_onboarding_shown", "true"); onComplete(); }, 1200);
  };

  const mono = "'JetBrains Mono','Menlo',monospace";
  const serif = "'Iowan Old Style','Apple Garamond','Georgia',serif";
  const stages = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];
  const flowDelays = [0, 0.7, 1.3, 1.7, 2.3];
  const extraDelays: (number | null)[] = [0.4, 1.0, null, 2.0, 2.5];
  const vaultItems = [
    { tag: "Framework", title: "Vibe Check + Engineering Map" },
    { tag: "Case Study", title: "Acme Q3 retainer · $47k" },
    { tag: "Template", title: "First-touch email · founder" },
    { tag: "Pricing", title: "Fractional COO scope ladder" },
    { tag: "Script", title: "Stalled-proposal recovery" },
    { tag: "Voice Note", title: "How I close on value" },
  ];
  const chips = ["Today's focus", "Pipeline health", "Stale deals", "Draft outreach"];
  const TOTAL = 7;

  const eyebrow = (label: string, color = "var(--gold)") => (
    <div style={{ fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.24em", textTransform: "uppercase" as const, color, marginBottom: "1.2rem" }}>{label}</div>
  );
  const hl = (main: string, accent: string) => (
    <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: "clamp(1.9rem,4.6vw,2.8rem)", lineHeight: 1.13, letterSpacing: "-0.012em", color: "white", marginBottom: "1.2rem" }}>
      {main}<br /><span style={{ color: "var(--gold-bright)", fontStyle: "italic" }}>{accent}</span>
    </h1>
  );
  const body = (text: string) => (
    <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.65, maxWidth: 520, margin: "0 auto" }}>{text}</p>
  );
  const cta = (label: string, onClick: () => void) => (
    <div style={{ marginTop: "1.8rem" }}><button className="oh-cta" onClick={onClick}>{label}</button></div>
  );

  return (
    <>
      <div ref={goldoutRef} className="oh-goldout" />
      <div className="oh-v2-root" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--bg)", overflow: "hidden" }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(circle,rgba(216,168,90,0.07),transparent 65%)", filter: "blur(40px)" }} />
        <button className="oh-skip" onClick={onComplete}>Skip</button>

        <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>

          <section ref={slide1Ref} className={`oh-v2-slide${slide === 1 ? " active" : ""}`}>
            <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
              <div ref={doorWrapRef} className="oh-door-wrap" onClick={enterTheHouse}
                style={{ position: "relative", width: 200, height: 270, margin: "0 auto 1.8rem", transformOrigin: "50% 65%", cursor: "pointer" }}>
                <div className="oh-door-frame" style={{ position: "absolute", inset: 0, border: "1px solid rgba(216,168,90,0.35)", borderRadius: "100px 100px 0 0", boxShadow: "0 0 80px rgba(216,168,90,0.15),inset 0 0 30px rgba(216,168,90,0.05)" }} />
                <div className="oh-door-light" style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%) scaleY(0.55)", width: "90%", height: "90%", background: "radial-gradient(ellipse at bottom,rgba(216,168,90,0.45),transparent 70%)", borderRadius: "50%", transformOrigin: "bottom center", opacity: 0.55 }} />
                <div className="oh-door-panel" style={{ position: "absolute", inset: 6, background: "linear-gradient(180deg,#1a1610 0%,#0b0a08 100%)", borderRadius: "95px 95px 0 0", transformOrigin: "left center", boxShadow: "-2px 0 20px rgba(0,0,0,0.6)" }} />
                <div className="oh-door-interior" style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%,-50%)", fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase" as const, opacity: 0 }}>HQ</div>
              </div>
              {eyebrow("Operator House · HQ")}
              {hl("You run the practice.", "We run the prep.")}
              <p style={{ color: "var(--ink)", opacity: 0.85, fontSize: "clamp(0.95rem,1.7vw,1.08rem)", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
                A single intelligent workspace that thinks like your best associate — so the work you actually love is the work you actually do.
              </p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", marginTop: "2rem" }}>
                <button className="oh-cta" onClick={enterTheHouse}>Open the door →</button>
                <button className="oh-ghost-btn" onClick={enterTheHouse}>Show me what's inside</button>
              </div>
            </div>
          </section>

          <section className={`oh-v2-slide${slide === 2 ? " active" : ""}`}>
            <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
              {eyebrow("Who lives here", "var(--signal)")}
              {hl("For independent consultants", "and fractional operators.")}
              {body("The brilliant solo professional drowning in CRMs, follow-ups, and proposal prep. The fractional CXO running three engagements at once. The strategist whose pipeline lives in seven tabs. Operator House replaces the stack with a room.")}
              <div className="oh-pipeline-cols" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.4rem", maxWidth: 580, margin: "1.4rem auto 0" }}>
                {stages.map((s, i) => (
                  <div key={s} style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 8, padding: "0.65rem 0.5rem", minHeight: 110, display: "flex", flexDirection: "column" }}>
                    <div style={{ color: "var(--gold)", fontFamily: mono, fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: "0.6rem", textAlign: "left" as const }}>{s}</div>
                    <div className="oh-col-card flow" style={{ animationDelay: `${flowDelays[i]}s` }} />
                    {extraDelays[i] !== null && <div className="oh-col-card" style={{ animationDelay: `${extraDelays[i]}s`, background: "rgba(216,168,90,0.06)", border: "1px solid rgba(216,168,90,0.18)" }} />}
                  </div>
                ))}
              </div>
              <p style={{ color: "var(--quiet)", fontSize: "0.8rem", letterSpacing: "0.04em", marginTop: "0.9rem", fontStyle: "italic" }}>Every client. Every stage. One room.</p>
              {cta("Who's working in here? →", () => goTo(3))}
            </div>
          </section>

          <section className={`oh-v2-slide${slide === 3 ? " active" : ""}`}>
            <GhostSlide onNext={() => goTo(4)} active={slide === 3} />
          </section>

          <section className={`oh-v2-slide${slide === 4 ? " active" : ""}`}>
            <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
              {eyebrow("Persona · The Operator")}
              {hl("When you need a thinking partner,", "just ask.")}
              {body("The Operator is your AI strategist on demand — with full context on your pipeline, your leads, and your vault. Not a chatbot. Your associate.")}
              <div style={{ margin: "1.4rem auto 0", maxWidth: 560, background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, padding: "1.2rem 1.4rem", textAlign: "left" as const, boxShadow: "0 30px 80px rgba(0,0,0,0.45)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gold)", fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase" as const, marginBottom: "0.8rem" }}>
                  <div className="oh-live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--term)", boxShadow: "0 0 8px var(--term)" }} />
                  The Operator · Active
                </div>
                <div style={{ color: "var(--muted)", fontFamily: mono, fontSize: "0.76rem", padding: "0.45rem 0.65rem", background: "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: "0.8rem" }}>
                  <span style={{ color: "var(--gold)" }}>&gt; </span>What's blocking my top deals?
                </div>
                <div style={{ color: "var(--ink)", fontFamily: serif, fontSize: "0.97rem", lineHeight: 1.55, padding: "0.8rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  Two of your three highest-value deals are stalled because the proposal step has been open more than nine days. The Ghost has drafted next-touch emails for both — both are{" "}
                  <strong style={{ color: "var(--gold)", fontStyle: "italic", fontWeight: 500 }}>in your queue, ready to send.</strong>{" "}
                  One has signal: their CFO viewed your last deck twice.
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginTop: "1.1rem" }}>
                {chips.map(c => <div key={c} style={{ padding: "0.38rem 0.8rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 999, color: "var(--muted)", fontFamily: mono, fontSize: "0.7rem" }}>{c}</div>)}
              </div>
              {cta("How does it know my voice? →", () => goTo(5))}
            </div>
          </section>

          <section className={`oh-v2-slide${slide === 5 ? " active" : ""}`}>
            <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
              {eyebrow("The Vault")}
              {hl("Your methodology, in.", "Your voice, out.")}
              {body("Generic AI gives generic advice. The Vault holds your frameworks, your case studies, your pricing logic, your objection scripts — and the AI reads it before every analysis. The output is your work, faster.")}
              <div style={{ margin: "1.4rem auto 0", maxWidth: 560, background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 12, padding: "1.4rem" }}>
                <div className="oh-vault-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
                  {vaultItems.map(item => (
                    <div key={item.title} style={{ padding: "0.8rem 0.55rem", background: "rgba(216,168,90,0.04)", border: "1px solid rgba(216,168,90,0.14)", borderRadius: 8, textAlign: "left" as const }}>
                      <div style={{ color: "var(--gold)", fontFamily: mono, fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase" as const, marginBottom: "0.28rem" }}>{item.tag}</div>
                      <div style={{ color: "var(--ink)", fontSize: "0.75rem", lineHeight: 1.35 }}>{item.title}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center" as const, margin: "0.8rem auto", color: "var(--gold)", fontFamily: mono, fontSize: "0.68rem", letterSpacing: "0.14em" }}>Auto-injected into every AI call ↓</div>
                <div style={{ padding: "0.8rem 0.95rem", background: "rgba(255,255,255,0.02)", borderLeft: "2px solid var(--gold)", borderRadius: "0 6px 6px 0", color: "var(--ink)", fontFamily: serif, fontStyle: "italic", fontSize: "0.9rem", lineHeight: 1.5, textAlign: "left" as const }}>
                  "Drafted using your Vibe Check + Engineering Map framework. Pricing pulled from your fractional ladder. Tone matches your last close."
                </div>
              </div>
              {cta("What's it actually saving me? →", () => goTo(6))}
            </div>
          </section>

          <section className={`oh-v2-slide${slide === 6 ? " active" : ""}`}>
            <HoursSlide onNext={() => goTo(7)} active={slide === 6} />
          </section>

          <section className={`oh-v2-slide${slide === 7 ? " active" : ""}`}>
            <div className="oh-inner" style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
              {welcomed ? (
                <>
                  {eyebrow("Door · open")}
                  {hl("Welcome to", "your HQ.")}
                  <p style={{ color: "var(--ink)", opacity: 0.85, fontSize: "clamp(0.95rem,1.7vw,1.08rem)", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
                    The Ghost is on the clock. The Operator is online. The Vault is yours to load. We'll see you at the desk.
                  </p>
                </>
              ) : (
                <>
                  {eyebrow("One last thing")}
                  {hl("You went solo for the work.", "We'll handle everything else.")}
                  <p style={{ color: "var(--ink)", opacity: 0.85, fontSize: "clamp(0.95rem,1.7vw,1.08rem)", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
                    Operator House isn't a CRM. It's the room you walk into already prepared — with the Ghost's overnight work briefed, the Operator standing by, and your Vault remembering exactly how you do things.
                  </p>
                  <p style={{ fontFamily: serif, fontStyle: "italic", color: "var(--gold)", fontSize: "1rem", marginTop: "1.4rem" }}>— enter the house.</p>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem", marginTop: "1.8rem" }}>
                    <button className="oh-cta" onClick={finish}>Enter the House</button>
                    <button className="oh-ghost-btn" onClick={() => goTo(1)}>Walk it again</button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <div style={{ position: "fixed", bottom: "1.8rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.4rem", zIndex: 20 }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <button key={i} className={`oh-dot-p${slide === i + 1 ? " active" : ""}`} onClick={() => goTo(i + 1)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      </div>
    </>
  );
}
