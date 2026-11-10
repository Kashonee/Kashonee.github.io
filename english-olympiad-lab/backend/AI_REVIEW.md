# AI Writing review

The browser UI and deployable function are implemented. Activation requires the project owner to apply `ai-review.sql`, set the `GROQ_API_KEY` and `AI_PROVIDER=groq` Edge Function secrets, and deploy `supabase/functions/check-writing/index.ts` under the name **check-writing**. Publishing the GitHub Pages frontend does not deploy the Supabase function or create its secrets.

Use the Kazakh, copy-ready guide at [ai-setup.html](../ai-setup.html). The dashboard route is intended for this project's existing non-technical owner. Reuse the same function after activation; do not create one per essay. No API key is entered in the frontend, chat or repository.

## Scope

- Supports W1–W2, P1–P6 and M1–M3. The server task catalog is checked against the browser's eleven actual prompts in automated tests.
- Diagnostics require all four blocks to be submitted. Mock writing requires that mock to be submitted. Studio drafts can be reviewed while learning.
- Requests contain the task ID, target pupil and expected essay version. The function independently reads the authenticated identity, linked profiles and saved essay using the caller's JWT and RLS. It rejects a text/version mismatch before a model request.
- The model receives the authoritative task, facts, measured word count and essay. Login, account IDs, passwords and other pupils' records are not included in the model input. Personal details written by a pupil inside their own essay remain part of that essay.
- Explains in Kazakh and supplies English corrections and practice. Gives a provisional 0–2 learning score in content, organization and language. It never writes `lab_feedback`, updates baseline scores, rewrites the pupil essay, or asserts an official CEFR/rank.
- Results are associated with the exact text. A changed essay displays the earlier analysis as stale. Identical saved text, provider, model and prompt version use the cached result. Earlier reviews remain readable; the interface labels the recorded provider.

## Server setup

1. Run `backend/ai-review.sql` after `backend/schema.sql`. This is additive and does not modify existing results. `lab_ai_reviews` has read-only access for the pupil and linked teacher. Clients have no write grants to AI records or reservation jobs.
2. Store `GROQ_API_KEY` and `AI_PROVIDER=groq` in Supabase **Edge Functions → Secrets**. The default is Groq with `openai/gpt-oss-120b`; the supported `GROQ_MODEL` alternative is `openai/gpt-oss-20b`. The model runs on Groq, not the OpenAI API. Free Plan usage remains subject to the account's actual limits. An existing `OPENAI_API_KEY` does not trigger automatic fallback. To use OpenAI deliberately, set `AI_PROVIDER=openai` plus `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to `gpt-4.1-mini`. OpenAI usage has its own billing. Provider and model are part of the cache version; change `PROMPT_VERSION` when changing the prompt or rubric.
3. Deploy the self-contained `index.ts` as **check-writing**, with JWT verification enabled. The tracked `supabase/config.toml` specifies `verify_jwt = true`. The handler additionally verifies the user through Auth's `/user` endpoint; a public API key alone never authorizes a review. No npm dependencies are required.

Standard Supabase-injected `SUPABASE_URL` and key dictionaries `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` are supported. Legacy `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` are also supported. Secret/service keys are used only inside the function, after authenticating and authorizing the request, for the reservation and finalization RPCs.

`ALLOWED_ORIGIN` defaults to `https://kashonee.github.io`. Change it only when moving the frontend. CORS is an additional browser boundary, not the authorization mechanism.

## Cost and failure behavior

`lab_ai_claim` serializes reservations using a transaction advisory lock. It checks access and the current saved text again, then enforces at most one active request per pupil, a one-minute cooldown, six new attempts per pupil in a rolling 24 hours, and fifty across the project. Teacher-triggered reviews count toward the target pupil's quota. Failed attempts also count, limiting repeated upstream failures. The active reservation expires after two minutes; history is retained. Cache hits do not reserve another paid attempt.

The input is capped at 12,000 text characters and 65,000 request bytes; at least 30 words are required. The Groq completion cap is 4,096 tokens with low reasoning effort and no returned reasoning. The optional OpenAI output cap is 6,000 tokens. The provider call is bounded to 55 seconds. These are safeguards, not a monetary spending guarantee; set the API project's own spending controls as appropriate.

Groq Chat Completions uses strict JSON Schema and no tools. Its unsupported `store` parameter is omitted; data retention is controlled in the Groq account, including its Zero Data Retention settings. Optional OpenAI Responses is called with `store:false`. This disables storage of the response as an API response object; it is not a promise of zero retention across all provider systems. The application stores its own result in Supabase. The model has no tools, browsing or access to credentials. Prompt instructions treat the pupil text as untrusted content. Structured output is checked before persistence: score range, bounded arrays, recognized topic codes and exact quoted fragments. Unsupported or invented quotes cause a safe failure rather than a saved analysis. These controls cannot guarantee that every grammatical judgment is correct; teacher review remains necessary.

The client waits for pending pupil changes to synchronize before requesting review. It does not replace a conflict or silently review an older essay. A lost connection does not create a substitute grade. Use “Сақталған тексерулерді жаңарту” to retrieve a result that finished after the browser stopped waiting.

## Verification performed

182 automated tests pass, including 44 added cases for the AI server, UI and transport. The function's actual request handler is executed with mocked Auth, PostgREST, Groq and OpenAI responses. Tests cover identity and link rejection, server text/version authority, submission gates, caching, reservation denials, malformed/refused/incomplete provider output, quoted-fragment validation, failure cleanup, scoped CORS, body limits, exact task catalog parity, pending-write ordering, stale UI, output escaping, account isolation and preservation of teacher grading.

No real Groq or OpenAI request was made by this development environment, and the Groq function update was not installed into the hosted Supabase project from here. The owner must update the existing function and secrets. The SQL migration is unchanged; rerunning it is not required when already installed. The Supabase management plugin is disabled by the workspace administrator. Node tests do not execute PostgreSQL policies or establish real Deno deployment, model quality, billing or rendered browser behavior. A supported browser facility is unavailable here.

Groq-specific tests also verify that an old OpenAI key cannot trigger fallback, the browser cannot choose another provider, truncated or refused Chat Completions are rejected, provider/model cache versions differ, and provider errors do not expose upstream details. The UI now distinguishes missing secrets, rejected keys, temporary rate limits, billing/quota limits and unavailable models.

## Acceptance checks after activation

1. Using synthetic text, confirm a successful review, persisted result and linked teacher visibility.
2. Confirm a second pupil and an unrelated teacher cannot read the review or trigger review for the first pupil. Direct REST/API attempts must fail independently of the UI.
3. Confirm anonymous users cannot read AI reviews or call reservation/finalization RPCs; authenticated pupils cannot insert or update AI reviews/jobs directly.
4. Open the same essay in two tabs and request simultaneous reviews. Expect one reservation; verify one provider call, then a reusable stored result. Exercise the limits in a separate test project without changing production quotas.
5. Change the essay; the old result should be stale and teacher feedback must remain unchanged. Verify the next review uses the newly saved text.
6. Review synthetic off-topic and inaccurate-facts reports with a teacher, alongside correct and error-containing essays. Calibrate the prompt against the actual official rubric before treating numerical suggestions as useful evaluation evidence.

Official references: [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs), [Groq API reference](https://console.groq.com/docs/api-reference), [Groq data controls](https://console.groq.com/docs/your-data), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [model reference](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [Supabase secrets](https://supabase.com/docs/guides/functions/secrets), [function authorization](https://supabase.com/docs/guides/functions/auth-headers).
