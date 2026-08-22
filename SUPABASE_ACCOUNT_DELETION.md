# Secure account deletion

The profile page has a deletion confirmation UI, but the browser cannot delete
an Auth user safely. `src/services/accountDeletionService.ts` therefore calls
only a configured trusted endpoint. It deliberately has no service-role key.

## Current ownership audit

The currently implemented Supabase-backed student data is:

- `public.student_auth_accounts`: maps one Auth UUID (`auth_user_id`) to the
  existing text student identifier (`student_id`).
- `public.students`: the linked profile, including the selected avatar/photo
  path.
- `public.check_ins`: owned through its text `student_id`.
- `public.trusted_contacts`: queried and written with the current student's
  `student_id`.
- `storage.objects` in `profile-photos`: uploaded profile photos are stored
  under `<auth-user-id>/<random-file-name>`.

Recovery is calculated from check-ins in the current app. Chat, SOS,
professionals, and AI companion screens do not currently persist student data
to Supabase. No recovery-goal, message, conversation, SOS-event, appointment,
or notification table is referenced by the current codebase. If any of those
tables are added later, their student-owned rows must be included in the
trusted deletion handler before the account deletion feature is enabled.

## Required secure endpoint

Deploy a Supabase Edge Function or your own authenticated server endpoint and
set this browser-safe environment variable in the web app:

```env
VITE_ACCOUNT_DELETION_ENDPOINT=https://<project-ref>.supabase.co/functions/v1/delete-account
```

The endpoint must keep `SUPABASE_SERVICE_ROLE_KEY` in its server or Edge
Function secrets only. Never add it to `.env` as a `VITE_` variable, React, or
any client-side bundle.

For every deletion request, the trusted handler must:

1. Read and verify the Bearer JWT, then derive the caller's Auth UUID from the
   verified token. It must not accept an Auth UUID or student ID from the
   request body.
2. Look up that UUID in `public.student_auth_accounts` to obtain the linked
   text `student_id`. Return an error if no mapping exists.
3. Delete only child records belonging to that exact `student_id`: currently
   `trusted_contacts` and `check_ins`. Include future student-owned tables
   explicitly after verifying their ownership columns and foreign keys.
4. List and remove only `profile-photos` objects whose path begins with that
   verified Auth UUID plus `/`.
5. Delete the caller's mapping row, then the linked `students` row, and finally
   delete the same Auth user with the Supabase Admin API.
6. Return JSON exactly like `{ "deleted": true }` only after every required
   step has succeeded. On any failure, return a non-2xx status with
   `{ "error": "..." }`; do not report success.

Use a transaction for database deletes where the chosen server environment
supports it. Storage deletion and Auth deletion are separate APIs, so log and
handle partial failures conservatively. Do not enable this endpoint until all
tables that reference a student have been audited in the live database.

The React UI intentionally reports that deletion is unavailable until
`VITE_ACCOUNT_DELETION_ENDPOINT` is configured. It never shows a success state
without the trusted endpoint's explicit `{ "deleted": true }` response.
