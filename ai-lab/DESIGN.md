---
name: TamashaLike
description: Kazakh-language pupil digital workbook for algorithmic thinking in grades 5–8.
colors:
  rail: "#142a46"
  rail-ink: "#c9d7e9"
  bg: "#f4f6fa"
  surface: "#fff"
  ink: "#172d49"
  muted: "#5b6c82"
  green: "#b74711"
  green-dark: "#9e3d10"
  mint: "#e7edf6"
  lime: "#ffb46b"
  line: "#dde4ef"
  blue: "#e9eff9"
  peach: "#faeee2"
  focus: "#7b91b7"
  field-border: "#ccd0d7"
typography:
  display:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.6
  secondary:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  metadata:
    fontFamily: "Lab Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "10px"
  navigation: "8px"
  list: "12px"
  panel: "14px"
  hero: "16px"
  dialog: "18px"
  command: "7px"
spacing:
  compact: "8px"
  control: "12px"
  small: "16px"
  medium: "20px"
  mobile-gutter: "22px"
  large: "24px"
  panel: "29px"
  section: "32px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-primary-hover:
    backgroundColor: "{colors.green-dark}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 19px"
  button-text:
    textColor: "{colors.green}"
    padding: "10px 0"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation:
    rounded: "{rounded.navigation}"
    padding: "11px 14px"
  filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.navigation}"
    padding: "9px 14px"
  filter-selected:
    backgroundColor: "{colors.green}"
    textColor: "{colors.surface}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  diagnostic-dialog:
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
    padding: "30px"
---

# Design System: TamashaLike

## Overview

**Navy & Orange Learning Workspace.** A bright classroom application with a dark-navy navigation rail and warm-orange selection cues. The user requested an overall visual redesign; the application name, Kazakh language, grade range and learning behavior stay authoritative.

The hero shows the real five-by-five robot board beside four ordered movement commands. Its “Орындау” button executes the real preview without saving mission results. No decorative AI illustrations, invented learner activity or fabricated results are used.

`dist/style.css` provides established component behavior; `dist/design.css`, loaded afterward, is the current visual authority. Keep the interpreter, storage keys and assessment data format stable during styling work.

## Colors

The frontmatter records the shared palette. Navy rail `#142a46` uses pale text `#c9d7e9`; selected navigation uses warm orange `#ffb46b` with dark ink. The main ground `#f4f6fa` carries white work surfaces. Primary actions use `#b74711` and hover `#9e3d10`.

Prepared hints use cool blue, repeat blocks pale blue and conditions pale peach. Success and failure also have text, icons or outlined blocks. Classroom readability takes priority over decorative color. Measured representative home text and navigation combinations ranged from 4.53:1 to 10.54:1; this is a bounded contrast check, not an accessibility certification.

## Typography

Noto Sans is locally hosted as WOFF and exposed through `Lab Sans`, with Kazakh glyph coverage. Body base 16px; regular controls and task prose 14px; supporting metadata 11–13px. The small hero preview uses a compact demonstration scale. Phone form fields use 16px to avoid browser input zoom.

The home title uses a fluid 32–46px desktop range, 48px on wide screens, and a fluid 26–35px phone range. Route headings are 34px desktop and 28px on phones. Letter spacing stops at −0.04em. Long instructional prose uses generous leading and measured line lengths.

## Layout

The navy rail is 232px wide on desktop, 212px below 1190px and 196px below 960px. It scrolls independently on short screens. Main gutters are 40px desktop, 28px compact desktop, 24px tablet and 22px phone. Maximum main width is 1450px.

The home hero places introductory text beside the robot-board preview, stacking below 1020px. The learning path and mentor panel are adjacent on larger screens. Navigation becomes an off-canvas 244px drawer below 720px; when closed, the sidebar is inert. Existing named selector labels and keyboard focus restoration are preserved.

Laboratory board and editor sit side by side on desktop, stacking at 960px. The square board has five equal rows and columns. The editor has a forest header, clearly grouped movement controls, visible execution states and a separate run area. Phone block controls have 44×44px targets and wrap below the command label. Native controls retain keyboard operation.

## Elevation & Depth

White panels on the cool light ground establish hierarchy without extra shadows. Panel corners are 13–18px, controls 10px. Boundaries within grouped lists use fine rules. Wall cells retain inset depth to distinguish obstacles from open cells. The diagnostic dialog keeps its functional backdrop and existing soft elevation.

## Components

- Navigation: navy surface, orange selected state, pale labels, visible focus.
- Primary action: burnt-orange fill, white text; the teacher banner uses warm orange with dark text.
- Robot preview: actual board markup, explicit ordered commands and a working mission action.
- Learning path: three horizontal entries with topic, description and direction cue.
- Laboratory: square board, tinted goal, source-block execution highlight, error text and step count.
- Guidance: prepared advice remains labeled; real ChatGPT discussion opens separately.
- Progress and diagnostics: real local records; native radio controls and dialog.
- Teacher and method pages: navy introductory panels with the same typography and spacing system.

## Motion

Keep the existing single hero entrance and 160ms button feedback. Hover transforms apply only to fine pointers. Robot motion reflects actual execution at 390ms per step, or 80ms with reduced motion. Respect reduced-motion preferences throughout; no auto-advancing content or scroll effects are introduced.

## Do / Don't

Do use native links, forms, dialog and keyboard-accessible block controls. Preserve the original progress schema and prepared-hint labeling. Keep the current access policy and explicit presentation exit.

Do not use color alone, introduce fake statistics, replace Kazakh typography with a font lacking the required glyphs, or treat the ChatGPT handoff as an embedded model API.

Validation: browser execution of mission one and diagnostic opening; drawer open/navigation; overflow checks at 375, 768, 1024 and 1440px, followed by phone checks across all seven routes. Recorded checks describe those scenarios only.

## Taste refinement

The current home hero now fills the first desktop viewport on an open ground; its title uses a fluid 38–54px range (58px on wide screens). The local Noto Sans and navy/orange palette stay in place. Mobile main actions fill the available width. The preview executes four real interpreter commands on click, marks the active command, supports replay and cancels on navigation without saving progress. Its motion assets are copied unchanged under `assets/taste-motion/`, with their MIT license. Static course rows are now semantic links. See TASTE_REVIEW.md for exact verification scope and the automated-gate limitation.

## Palette update

User-selected dark navy with orange accents. Navigation and laboratory panels use navy #142a46; primary controls use orange #b74711, with white labels; active navigation and goals use warm orange #ffb46b with navy text. The working ground remains cool and light. Supporting green tints, SVG robot colors, encoded form icons and the favicon were recolored. Existing red error states and instructional blue/peach categories retain their semantic roles.

## Learning flow refinement

The three meaningful stages are prediction, construction/testing, and explanation. Prediction sits above the board; the learner enters a movement count or explicitly chooses uncertainty. The forecast locks for an attempt, and feedback compares it to actual executed movements. A complete goal route is distinguished from a blocked partial route. Mission drafts and paused execution survive navigation and reload. Clear-all exposes a persistent undo action until the next edit.

The laboratory board is at most 280px on desktop, 240px on short desktop viewports and 260px on phones. Empty editor height is 82px. Phone execution controls stay above the safe area; complex blocks and hints use disclosure controls. Brand and rail supporting labels are 12px. The teacher rubric uses rows rather than decorative cards; unassessed criteria remain unassessed rather than zero.
