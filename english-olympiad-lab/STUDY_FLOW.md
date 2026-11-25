# Unified learner flow — 25 November 2026

The learner starts at `#/start` (13 questions; estimated 10–15 minutes). The former four-block diagnostic remains optional at `#/diagnostic`. The home page presents one next action. Class and target stage are stored in the same learner snapshot.

`study.js` derives one route from the short start, submitted Grade 8 papers and the existing full diagnostic. Blank and disputed answers never become inferred weaknesses. Authored `exam-notes.js` links source questions to individual grammar steps where possible. Reading, question formation and spelling retain their own targeted exercises. Grade 8 spelling `V05` is explicitly distinct from the general confusing-words `V05`.

`study-practice.js` contains 100 short lesson steps and 300 new contextual exercises. Original 126 exercises remain available via `#/learn/CODE/guide`; original retest forms remain separate. The detailed guides, examples and Russian videos are retained. First short-practice results survive retries and are reported separately from corrected answers; neither viewing a lesson nor watching a video claims mastery.

All 240 original answer slots have authored question explanations. The 180 non-district slots also have transcribed task prompts, displayed alongside the relevant source context. Original source files and answer keys are unchanged. Author explanations describe disputed keys rather than silently rewriting them. Free writing and unmatched flexible transformations still require teacher review.

Exam pages show five questions per page. Free practice is the default. Timed mode uses a persisted start and deadline; the deadline continues off-page and across reloads. On expiry the application submits the saved attempt exactly once when it is running or next opened. District practice uses an explicitly labelled 40-minute training limit because the source gives no total time. The original-key shortcut is hidden during an active timed attempt. This is a static self-study interface, not a secure proctored examination system.

The combined vocabulary has 89 unique words/phrases (40 general + 50 source words, minus one duplicate). Existing card IDs and both old schedules remain in the learner snapshot. New productive practice stores recall, a context gap, and an own sentence separately. Correct checked recall schedules 1/3/7/14/30 days; an error schedules ten minutes. Freeform sentences are saved for teacher review and receive no automatic grammar score.

Video chapters are shown only where chapter times were verified from the public descriptions. Each grammar video has a new comprehension check. The G08 video is labelled as an introduction to am/is/are rather than a complete agreement lesson. Existing view counts remain cached observations, not live rankings.

State changes are additive under `study` in the version-1 snapshot, plus optional timing fields in Grade 8 attempts. Old answers, writing, cards, retests and histories retain their existing keys. JSON import/export, browser storage, cloud snapshots and teacher text exports carry the new work. Teacher views include short-study counts and the learner's saved sentences.

Run all checks from the repository root:

```sh
node --test english-olympiad-lab/tests/*.test.cjs
```

240 tests cover migration, shared routes, independent practice evidence, all source-slot explanations, source prompt coverage, original score logic, deadline reload/expiry, late-input rejection, productive word recall, intervals, exports, escaping and unique HTML IDs. UI assertions for the old navigation were updated for the unified route; uniqueness assertions now check actual `id` attributes rather than accidentally counting `data-id` values.
