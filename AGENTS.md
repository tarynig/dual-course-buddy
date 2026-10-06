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
  helpers, storage, edge functions) or on the generated `src/integrations` files — the platform
  regenerates those while the hosted database is enabled and they are not used by the app.
- Data access is standard SQL over `DATABASE_URL` only; accounts, sessions and password hashing
  live in the app's own tables (`app_users`, `app_sessions`, `hash_password`/`verify_password`).
- Outbound mail uses the college's own SMTP account through `src/lib/mail.server.ts`; features call
  `sendMail` and never construct a transport themselves. A mail failure must never fail the feature
  that triggered it.
- New capabilities go behind one small module with a swappable transport so a later host move is a
  single-file change.
- Brochure visuals use shared photo/bar components and one image map; Node builds materialize the asset pointers into own-host public files so production never depends on the editor's CDN.

- Fees live only on reusable payment plans linked to courses/duals; the public "from" price is derived from the cheapest linked plan. Why: one amount change updates every course using that plan.
- Catalogue SQL returns lists as comma-joined text and runs queries one after another. Why: array types and pipelined queries hang or misparse in the edge runtime with fetch_types off.
