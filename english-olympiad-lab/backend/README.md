# Cloud setup

Run `schema.sql`, create two confirmed Auth users in the Supabase Dashboard, then run `accounts.sql`. See [the setup guide](../setup.html). Disable public Auth signups. No profiles are created by user-controlled signup metadata.

Fill the public project URL and `sb_publishable_…` key in `cloud-config.js` only after the schema and role assignments have succeeded. Never commit a secret key, password, session token or student data. This repository contains no account passwords.

The browser calls Supabase Auth and PostgREST over HTTPS. Credentials are verified by Supabase Auth. Short-lived user tokens and refresh tokens are kept in sessionStorage, not in the published source. The profile role and teacher/student link are admin-assigned rows; RLS authorizes every record request independently of the UI.

`lab_save_progress` uses a revision check and a row lock to prevent stale devices from silently overwriting a newer record. Pending progress is retained locally per user until acknowledged. A network failure after a committed write is reconciled by comparing the actual server payload. Conflicts require an explicit choice and offer a local JSON backup.

Teacher feedback is stored separately from student progress and binds to the exact essay text. Student-owned JSON cannot create a teacher grade. Teachers can only read or grade their assigned students. The diagnostic is still formative practice, not a proctored exam.

Until a real project is connected and its hosted RLS tests are run, account functionality is prepared but inactive. Offline/mocked tests cannot establish that a deployed Supabase project has the intended policies.

## Teacher assignments

After schema.sql, run assignments.sql. Teachers can create diagnostics, lesson tasks, writing tasks and custom instructions for linked pupils. Pupils own their response text. Assignment completion is self-reported and does not change automatic diagnostic or retest scores. This migration is prepared but has not been executed against a hosted project here. Include assignment RLS in your hosted role tests before use.
