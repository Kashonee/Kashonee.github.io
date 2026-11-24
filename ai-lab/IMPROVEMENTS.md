# TamashaLike — learning flow update

## Changes

- Preserve per-mission prediction, explanation, optional AI reflection and paused execution through navigation and reload. Keep existing storage key and completed records.
- Resume the current attempt from mentor. Report only executed steps to ChatGPT; distinguish a pause from an observed final outcome.
- Require an explicit movement forecast or uncertainty choice, freeze it for the attempt and compare it with actual execution. A partial blocked path is not described as a complete goal route.
- Put run controls beside the board, reduce the empty editor, and provide a bottom execution toolbar on phones.
- Restore the cleared algorithm and its learning context through Undo, including after reload.
- Identify the goal by its energy symbol rather than its old color. Increase rail supporting text and add an explanatory brand subtitle.
- Use separate A/B diagnostic questions for corresponding skills. Store every submission with its version; preserve and label legacy A records.
- Add a four-criterion teacher rubric. Unassessed values remain unset, rather than becoming zero.
- Export saved solutions, drafts, AI reflection, rubric evidence and diagnostic history. Provide a blank observation CSV and a concrete competition demonstration guide.
- Explain browser-local storage and provide an optional work code without implying separate user accounts.

## Verification

- 14 Node tests passed: mission solutions, interpreter limits, A/B structure, legacy migration, draft restoration, paused execution, undo snapshot and rubric totals.
- Browser: forecast validation; lab–mentor return; switching missions; paused-step reload; prediction versus actual; explanation draft; clear–reload–undo; save result; rubric persistence; final B diagnosis; full report and blank template download.
- Downloaded CSV files parsed successfully with rubric columns. Desktop laboratory inspected at approximately 1353 × 929; responsive DOM/overflow checks used 375px and 768px iframe viewports. Mobile toolbar remained within the viewport; tablet board width was confirmed at 280px.
- A separate source review found two status-reporting issues; both were corrected. Deterministic design scan reported 307 signals (7 warnings and 300 advisories), mostly documentation/token and legacy CSS signals; it is not a clean accessibility audit.

## Product boundaries

Progress is local to the current browser. A work code is a report label, not a login or separate profile. AI conversation opens externally in ChatGPT; built-in hints remain explicitly prepared advice. A/B questions support classroom observation but are not calibrated research instruments. Competition evidence must come from actual pupil work.
