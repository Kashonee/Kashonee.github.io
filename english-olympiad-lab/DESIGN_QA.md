# QAISAR OLYMP — design and QA record

2026-10-23 · Designed & Developed by Kaisar Sayatuly

## Audit and resulting changes

The former application lacked a distinct public introduction, a shared brand system, a unified light/dark preference, direct question navigation and a submission review screen. Analytics were primarily tabular. The redesign introduces a custom vector Q/crown mark, a public landing page, a shared application shell, ten student sections and a restrained teacher workspace with a searchable roster and real diagnostic coverage bars. Learning path, actual attempt history, interactive chart filters and evidence-derived achievements make the next action visible without inventing readiness or CEFR scores.

Diagnostics now use logical question groups, persistent review flags, direct question links and an explicit review screen. Timed and untimed modes are selectable before an attempt starts. Timers remain formative active-time tools, not enforcement for a proctored competition. Existing baseline grades, retest intervals, Reading, vocabulary scheduling, writing, imports, exports and data recovery remain intact.

Teacher assignments, custom instructions and individual recommendations use separate assignment and response tables. Completion is explicitly the student's declaration, not an independently verified score. The existing teacher feedback rubric remains separate from pupil-owned state and bound to the precise essay version.

## Design system

Navy #101D35, royal blue #315BDB, decorative gold #C5A66A, background #F7F9FC, white surfaces and 14–20 px radii. Semantic foregrounds were adjusted for contrast. Representative light and dark text/background token pairs were calculated at 4.5:1 or higher. This is a token check, not a complete WCAG audit.

Dark theme supports system preference and a persistent manual switch. Reduced-motion preferences disable animations and smooth scrolling. Controls expose native labels, pressed/current states and visible keyboard focus. Mobile navigation uses a drawer and five shortcuts; the drawer traps focus and closes with Escape. Tables retain explicit table relationships and show labeled cells on small screens.

Manrope variable is self-hosted, subset to Latin/Cyrillic character ranges, including available extended Cyrillic. One 60,264-byte WOFF file serves weights 200–800. It is preloaded and uses font-display: swap. No Google Fonts stylesheet or external JavaScript is required. Unavailable glyphs use a system fallback. The SIL Open Font License is included. Selected Lucide icons are local with their ISC license.

The existing buildless JavaScript architecture and GitHub Pages deployment are retained to protect existing learning logic and storage compatibility. There is no claim that this implementation uses Next.js, shadcn or Recharts.

## Validation

- 113 Node automated tests pass, including existing grading, import/recovery, persistence, retest scheduling, transport and feedback cases.
- New tests cover theme isolation, all 88 question navigation targets, persistent flags, untimed mode locking, empty-state analytics, evidence-derived achievements, new routes and assignment identity guards.
- All application JavaScript passes syntax checks; local asset references are checked.
- Tests use a modeled DOM and mocked Auth/REST transport. They are not real browser end-to-end tests.

## Deployment prerequisites and limits

The public learning application works locally in the browser. Account integration is prepared but inactive: cloud-config.js is deliberately blank. No passwords or accounts have been created. A real Supabase project, schema.sql, assignments.sql, administrator-created Auth accounts and accounts.sql role links are required before teacher and student server workspaces can be used.

Hosted PostgreSQL RLS has not been executed here. Run verify-access.sql and validate assignment policies with at least two pupils and a teacher before collecting real pupil data. A teacher must see only linked pupils; pupils must not create assignments, read another pupil's tasks, alter teacher feedback or write another pupil's response. Anonymous access must fail.

A browser rendering facility is unavailable in this environment. Real rendering at 320/375/768/1024/1440 px, keyboard and screen-reader behavior, zoom, mobile Safari and Chrome, and real network loading remain manual release checks. CSS breakpoints and automated DOM tests do not establish absence of visual overflow or full WCAG 2.2 AA compliance.

## Kazakh interface update

All public platform navigation, landing copy, account messages, teacher controls, achievements and diagnostic UI are in Kazakh. Original English exercise stems, choices, reading texts, writing assignments and learning examples are retained. Topic and vocabulary category headings are translated only when displayed; their source data and identifiers remain unchanged. Dedicated task blocks declare lang=en while document language stays kk. 113 tests pass, including checks of Kazakh controls and preserved English tasks. The original diagnostic, lesson, vocabulary and six Writing definitions were compared before/after and are identical. Browser visual validation remains unavailable.

## Server configuration — 2026-11-09

The supplied public Supabase project URL and Publishable key are now configured. The existing Auth/REST client activates the account route; no Next.js or SSR migration was needed. No passwords, secret keys or pupil records were added. Anonymous read-only probes from the execution environment were blocked with an envoy 403 response stating that calls to the URL are not allowed; this is a network restriction, not evidence of a Supabase failure or an RLS pass. Real account sign-in and hosted policies remain unverified. The existing SQL scripts and two-account verification guide remain applicable. The former inactive-state notes above describe the earlier release.

## Login error reporting — 2026-11-09

The client now preserves the Supabase Auth error code and distinguishes unconfirmed email, disabled email login, banned accounts and an invalid public API key from invalid account credentials. It does not display raw server messages, passwords, tokens or hashes. Unknown Auth codes use a generic message with the code only. Legacy responses without a code retain the existing fallback. 119 automated tests pass. This fixes error reporting; the reported real account failure still needs hosted account diagnostics.

## Learning and usability audit — 2026-11-09

138 automated tests pass. The current release adds a visible transfer route, a topic mistake notebook, balanced study sessions, eight-strategy Reading evidence, actionable teacher priorities and accurate Writing length feedback. Vocabulary filter values are repaired, submitted diagnostic answers are locked after keys open, assignment failures no longer retry recursively and edited essays immediately show stale teacher feedback. See [QA_AUDIT_2026-11-09.md](QA_AUDIT_2026-11-09.md) for reproduced issues and remaining limits.

The configured public Supabase integration is retained; the user has reported successful login. This is not a hosted multi-user isolation test. Original inactive-configuration notes above describe historical releases. The platform remains a self-study tool, with browser rendering and deployed RLS verification still outstanding.

## AI Writing interface — 2026-11-10

The optional AI panel is integrated into eleven Writing tasks and the linked teacher review view. It shows configuration, loading, failure, ready and stale-version states; proposed scores are visibly separate from teacher assessment. English practice answers are behind explicit disclosure controls. Model content is escaped and uses the existing light/dark tokens and responsive layout. The server code, additive migration and copy-ready activation guide are included. 170 mocked automated tests pass. Supabase activation, a real model call, hosted RLS verification and browser rendering remain outstanding.
