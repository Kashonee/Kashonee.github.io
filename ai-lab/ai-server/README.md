# TamashaLike AI server

Prepared Groq integration. It is not connected to a live model until a backend is deployed, a provider key is saved as a server secret and `dist/ai-config.js` is configured.

The existing frontend stays on GitHub Pages. Deploy this module as a Worker-compatible server. Its only upstream is `https://api.groq.com/openai/v1/chat/completions`.

Runtime configuration:

- `GROQ_API_KEY`: secret. Create in the owner's Groq account; retain the Free tier. Never place it in this repository, the browser or a URL.
- `GROQ_MODEL`: optional; defaults to the production model in Groq's current quickstart, `llama-3.3-70b-versatile`.
- `AI_CLASS_CODE`: recommended server secret for the shared lesson code. Pupils enter the code, not the provider key. For an intentionally public endpoint, set `ALLOW_PUBLIC_AI=true` instead.
- `ALLOWED_ORIGINS`: defaults to `https://kashonee.github.io`. Add a localhost origin only to development configuration.

Routes: `GET /api/ai/health`, `POST /api/ai/chat`, and CORS preflight. Browser requests omit cookies. The server validates the known mission, program, execution cursor, forecast and bounded conversation. It builds the system instruction itself and only forwards the current task context and messages. Work labels, scores, teacher notes and other saved pupil records are not included.

Payloads and provider errors are not logged or exposed. Replies are plain text. The server uses a request size limit, response token cap, timeout, shared lesson code and best-effort per-isolate throttling. CORS is an origin policy, not authentication. The memory limiter is not a distributed quota; the provider's Free-tier limits apply to the owner's whole account.

Before activation: verify actual Kazakh replies, model availability for the account, class-code failure, rate-limit handling and the production GitHub origin. Do not mark a mocked API response as a live inference test.
