# Documentation index

Docs are grouped by purpose. Prefer **`current/`** for “what exists in the repo today.”

```text
docs/
├── README.md                 ← you are here
├── current/                  ← living docs (matches implementation)
├── product/                  ← product requirements
├── architecture/             ← system design (full design doc)
├── design/                   ← UI/UX & design system (product intent)
├── engineering/              ← stack detail, phase plans, setup script
├── planning/                 ← future work & production hardening
└── archive/                  ← historical consolidated drafts
```

---

## `current/` — implementation truth (start here)

| File | Contents |
| --- | --- |
| [architecture.md](./current/architecture.md) | System as built (Phase 0) + planned layers |
| [tech-stack.md](./current/tech-stack.md) | Languages, frameworks, pins in use |
| [api.md](./current/api.md) | Implemented HTTP endpoints |
| [deployment.md](./current/deployment.md) | Docker Compose, healthchecks, volumes, env |
| [design-system.md](./current/design-system.md) | UI tokens + Phase 0 status page notes |
| [roadmap.md](./current/roadmap.md) | Phase status (0 complete → 1 next) |
| [product-copy.md](./current/product-copy.md) | UI / product strings |

## `mcp/`

| File | Contents |
| --- | --- |
| [setup_1.md](./mcp/setup_1.md) | Detailed guide on MCP integration, transport, issues faced & fixes |
| [shared-gemma-tunnel.md](./mcp/shared-gemma-tunnel.md) | Phase 1A addendum: shared host Gemma via Cloudflare, env recreate lesson |

## `product/`

| File | Contents |
| --- | --- |
| [requirements.md](./product/requirements.md) | Product requirements (PRD) |

## `architecture/`

| File | Contents |
| --- | --- |
| [system-architecture.md](./architecture/system-architecture.md) | Full system architecture design (layers, APIs, deployment) |

## `design/`

| File | Contents |
| --- | --- |
| [ui-ux-design-system.md](./design/ui-ux-design-system.md) | UI/UX philosophy, palette, components, interactions |

## `engineering/`

| File | Contents |
| --- | --- |
| [technical-specification.md](./engineering/technical-specification.md) | Detailed tech stack, folder tree, coding standards, schema |
| [implementation-roadmap.md](./engineering/implementation-roadmap.md) | Phased implementation plan (0–4) |
| [implementation/](./engineering/implementation/README.md) | As-built phase docs |
| [CURRENT-STATE-AND-NEXT.md](./engineering/implementation/CURRENT-STATE-AND-NEXT.md) | **What we have + limits** |
| [NEXT-AFTER-PHASE-2-3.md](./engineering/implementation/NEXT-AFTER-PHASE-2-3.md) | **What to do next after Phases 2 & 3** |
| [phase-0-setup-script.md](./engineering/phase-0-setup-script.md) | Hardened Phase 0 setup script (bash source) |
| [phase-1b-plan.md](./engineering/phase-1b-plan.md) | Phase 1B LangGraph agent plan (checklist, API, ownership) |
| [phase-2-plan.md](./engineering/phase-2-plan.md) | Phase 2 product chat API (`/api/chat`, SSE) |
| [implementation/phase-3.md](./engineering/implementation/phase-3.md) | Phase 3 Agent Chat UI as-built |
| [phase-1b-work-split.md](./engineering/phase-1b-work-split.md) | Phase 1B parallel tracks: Mayank vs Vinit steps & gates |
| [phase-1b-track-a.md](./engineering/phase-1b-track-a.md) | Mayank Track A: seed, env, verify scripts, host runbook |

## `planning/`

| File | Contents |
| --- | --- |
| [future-enhancements.md](./planning/future-enhancements.md) | Short/long-term enhancements |
| [production-hardening-review.md](./planning/production-hardening-review.md) | Critical design review & Phase 5 hardening |

## `archive/`

| File | Contents |
| --- | --- |
| [full-prd-technical-design-v2.md](./archive/full-prd-technical-design-v2.md) | Historical all-in-one PRD + design document |

---

## Project root (session memory)

| File | Contents |
| --- | --- |
| [../README.md](../README.md) | Onboarding & quick start |
| [../PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) | Current phase, blockers, next steps |
| [../TODO.md](../TODO.md) | Backlog / completed work |
| [../DECISIONS.md](../DECISIONS.md) | Architecture decision records |

---

## Rename map (old → new)

| Old path | New path |
| --- | --- |
| `docs/architecture.md` | `docs/current/architecture.md` |
| `docs/tech-stack.md` | `docs/current/tech-stack.md` |
| `docs/api.md` | `docs/current/api.md` |
| `docs/deployment.md` | `docs/current/deployment.md` |
| `docs/design-system.md` | `docs/current/design-system.md` |
| `docs/roadmap.md` | `docs/current/roadmap.md` |
| `docs/content.md` | `docs/current/product-copy.md` |
| `docs/PRD.md` | `docs/product/requirements.md` |
| `docs/SYSTEM ARCHITECTURE.md` | `docs/architecture/system-architecture.md` |
| `docs/UI UX.md` | `docs/design/ui-ux-design-system.md` |
| `docs/TECH STACK.md` | `docs/engineering/technical-specification.md` |
| `docs/5)IMPLEMENT ROADMAP.md` | `docs/engineering/implementation-roadmap.md` |
| `docs/Implemet_phase0.md` | `docs/engineering/phase-0-setup-script.md` |
| `docs/FURTURE ADDITION.md` | `docs/planning/future-enhancements.md` |
| `docs/Critical Design Review & Production Hardening Roadmap.md` | `docs/planning/production-hardening-review.md` |
| `docs/version 2 Autonomous_Security_Agent_PRD (1).md` | `docs/archive/full-prd-technical-design-v2.md` |
