# Client-Shareable Source Trail

## Product Decision

Operator House should turn the existing Vault-grounded strategy citations into a **client-ready evidence trail**. The operator shares a branded strategy deliverable with a client; the client sees the recommendation, the operator’s selected evidence references, and a clear explanation of how the evidence supports the recommendation. The client does **not** receive blanket access to the operator’s Vault or to private instructions, pricing notes, or unrelated client records.

> **Product language:** Operator House is the consultant’s workspace. Specter is the AI intelligence operator that helps prepare the deliverable. The client-facing document should lead with the consultant’s brand—not Operator House or Specter.

## Phase One: Shareable Source Trail

| Element | Operator experience | Client experience | Guardrail |
| --- | --- | --- | --- |
| Deliverable selection | Choose one saved strategy and its intended client | Receives a single read-only document | No workspace navigation is exposed |
| Source selection | Opt in to individual Vault citations and add a plain-language rationale | Sees only selected source titles, excerpts, and rationale | Source visibility defaults to off |
| Branding | Upload logo, name the client, select accent color, add a closing CTA | Sees consultant identity and optional booking CTA | No Operator House branding is required in the presentation |
| Share link | Generate an unguessable link, set expiry, revoke at any time | Opens without an account until expiry or revocation | No indexability; no client write access in v1 |
| Engagement signal | See opened timestamp and optional source expansion events | No tracking surprise; link footer explains document access | Event data belongs to the operator’s workspace |

### Minimal Data Model

`shared_deliverables` should store the owner ID, strategy ID, client ID where present, display metadata, hashed public token, status, expiration timestamp, revocation timestamp, and access timestamps. `shared_deliverable_sources` should store only the explicitly selected Vault item IDs, a frozen display title, a bounded excerpt, ordering, and the operator’s rationale. The frozen fields ensure a historical client document remains coherent if a Vault item is later edited or archived.

Public delivery must look up only an active, unexpired, non-revoked token. It must load through a narrow public procedure that returns no account, pipeline, or raw Vault fields beyond the frozen source fields selected for that deliverable. Every mutation remains owner-authenticated and workspace-scoped.

### Release Criteria

The feature is ready for customer use when an operator can create, preview, share, expire, and revoke a branded document; a recipient can open it without authentication; the recipient cannot enumerate or access other content; and the operator can see a straightforward access record. The first version should intentionally exclude commenting, downloads, client login, and automatic source selection.

## Sequenced Roadmap

| Priority | Capability | Why it follows the source trail | First measurable outcome |
| --- | --- | --- | --- |
| 1 | Client-branded strategy deliverables with source trails | Makes the existing trust feature visible to the operator’s client | Shared strategies opened by clients |
| 2 | Client-ready deliverable kit | Extends the same branded document system to audits, proposals, and pre-call briefs | Operator-created deliverables per active client |
| 3 | Assisted Vault ingestion | Reduces the effort required to make strategy quality compound | Approved Vault items created from operator-owned documents or notes |
| 4 | Close-reason capture | Adds a ten-second loss-learning loop once the pipeline has meaningful deal volume | Closed-lost deals with a structured reason |

The source trail is the correct first build because it converts existing Vault grounding into a client-visible differentiator without pretending that a generic strategy is proprietary expertise. The subsequent deliverable kit reuses the same access, branding, and revocation foundation. Assisted Vault ingestion should only ingest material the operator explicitly selects and approves. Close-reason capture should remain a short, optional structured input rather than a required CRM chore.
