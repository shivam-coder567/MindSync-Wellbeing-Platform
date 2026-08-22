# Phase 1 Supabase setup

The app uses Supabase Auth for sessions. It does not assume that an Auth UUID is
the same as an existing `students.id`, so it needs one explicit mapping per student.

## Before running SQL

In the Supabase dashboard, inspect:

1. **Database → Tables → students**: note the data type and value of the student's `id`, plus the existing `name`, `email`, `college`, and `risk_level` columns.
2. **Database → Tables → check_ins**: confirm the `student_id` column stores the same identifier as `students.id`.
3. **Authentication → Users**: copy the existing user's UUID.
4. **Database → Policies**: review existing policies on `students` and `check_ins` for broad `anon` or `authenticated` access. Do not disable RLS.

## Add the mapping

1. Run [supabase/schema.sql](supabase/schema.sql) in the SQL Editor. It adds `student_auth_accounts` and `ensure_student_profile()`; it does not alter or delete `students` or `check_ins`. New signups create their own student row through that function after they have an Auth session. `students.id` must accept the Auth UUID (uuid or text).
2. Existing students that should keep their current `id` can still be mapped manually:

```sql
insert into public.student_auth_accounts (auth_user_id, student_id)
values ('AUTH_USER_UUID', 'EXISTING_STUDENT_ID');
```

3. Add RLS policies equivalent to the commented policy conditions in `schema.sql`. Do not add a policy that permits all authenticated users to select every row.

## Authentication settings

Enable **Email** under **Authentication → Providers**. Keep Confirm Email enabled in production. When it is enabled, a new signup must confirm the email before logging in.

`.env` should include only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never expose a `service_role` key to Vite or browser code.
