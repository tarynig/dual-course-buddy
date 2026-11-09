<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Portability rules

- The production home is cPanel shared hosting plus a standalone PostgreSQL server. App code must
  run on a plain Node host, so never depend on Lovable-only services (managed email, Cloud auth
  helpers, storage, edge functions). The one exception is the Data API transport in
  `src/lib/data.server.ts`, which loads the generated `src/integrations` client only when Lovable's
  database credentials are in the environment; that folder must stay in the source tree because the
  build reads it even on hosts that never run it.
- Data access goes through named saved operations called from `src/lib/data.server.ts` — never
  query text in app code. The operations live in `database/app-data-functions.sql`; the transport
  is picked by the server's environment (Lovable's Data API when its credentials are present, plain
  SQL over `DATABASE_URL` otherwise). Accounts, sessions and password hashing live in the app's own
  tables (`app_users`, `app_sessions`, `hash_password`/`verify_password`).
- Outbound mail uses the college's own SMTP account through `src/lib/mail.server.ts`; features call
  `sendMail` and never construct a transport themselves. A mail failure must never fail the feature
  that triggered it.
- New capabilities go behind one small module with a swappable transport so a later host move is a
  single-file change.
- Brochure visuals use shared photo/bar components and one image map; Node builds materialize the asset pointers into own-host public files so production never depends on the editor's CDN.
- Course-specific photos use optional validated HTTPS URLs or own-host paths, rendered through the shared CoursePhoto with brochure fallback; no managed storage dependency.

- Fees live only on reusable payment plans linked to courses/duals; the public "from" price is derived from the cheapest linked plan. Why: one amount change updates every course using that plan.
- Catalogue reads return one JSON object from the `app_get_catalogue` operation, with lists as JSON
  arrays. Why: the work happens inside the database, so the array and pipelining limits of the app's
  connection layer no longer apply.
- Retire catalogue offerings with is_active rather than deleting rows, and filter inactive offerings from catalogue reads. Why: historical enquiries and payment-plan links must remain intact.
- Online booking payments go through PayFast only via `src/lib/payfast.server.ts`; the shared booking-fee policy fixes the amount server-side, never using a browser or payment-plan amount. Preserve historical deposit records using payment_kind. Why: one swappable transport and no tampering or accidental course-fee charges.
- Apply-form validation lives in `src/lib/applications.schema.ts`, imported by `applications.functions.ts`, so the rules can be unit-tested without loading the server-function module. Why: `createServerFn` modules can't be imported by the test runner.
- The own-hosting build target cannot be confirmed inside the editor: the editor's build environment forces its own server target and ignores preset settings. Check it on the college's server (or with the editor's sandbox markers unset) and expect `.output/nitro.json` to read `node-server`.
