# Moving the site to the college's own hosting

Target: **cPanel shared hosting** for the files plus a **standalone PostgreSQL** database. Nothing
here is specific to Lovable's hosting — the site is an ordinary Node application talking to an
ordinary PostgreSQL server over standard SMTP for mail.

## What the server needs

- Node.js 20 or newer (cPanel: **Setup Node.js App**, which also selects the Node version)
- A PostgreSQL database and user (created in cPanel or by your host)
- A mailbox on the domain for outgoing mail (e.g. `enquiries@creativearts.co.za`)

## Where the settings live

In the **server's environment**, never in the code. Two equivalent places:

1. cPanel -> Setup Node.js App -> **Environment Variables** (recommended; nothing on disk), or
2. a `.env` file stored **outside** `public_html` (copy `.env.example`, rename to `.env`, fill in).

| Setting | What it is | Where to find it |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | cPanel PostgreSQL / your host |
| `HOST` | `0.0.0.0` — required by cPanel's app checker | — |
| `PORT` | `3000` — required by cPanel's app checker | — |
| `SMTP_HOST` | Outgoing mail server | Email Accounts -> Connect Devices |
| `SMTP_PORT` | `465` for SSL, `587` for STARTTLS | same page |
| `SMTP_SECURE` | leave empty for 465, `false` for 587 | — |
| `SMTP_USER` | mailbox address that sends | Email Accounts |
| `SMTP_PASS` | that mailbox's password | Email Accounts |
| `SMTP_FROM` | how the sender appears (optional) | your choice |
| `ADMISSIONS_EMAIL` | who gets enquiry alerts (comma separated) | your choice |

Missing settings never break the site: an enquiry is always saved to the database, and the mail
step is skipped with a note in the server log.

## Setting it up

1. Put the code somewhere **outside** `public_html`, for example `~/sites/creativearts`.
2. Install build dependencies: `npm install --include=dev` (or `bun install`).
3. Build for a Node server: `npm run build:node`
4. Set the start command to `npm start`. In **Setup Node.js App**, use `start.mjs` as the startup
  file. It binds to `0.0.0.0`, uses the provider's `PORT`, and defaults to `3000`.
  Add the environment variables above, set the health-check path to `/health` where supported,
  then start the app.
5. Create the database tables and load the data: run the plain PostgreSQL file
   `database/schema-and-catalogue.sql` against the empty database
   (`psql "your connection string" -f database/schema-and-catalogue.sql`), then create the first
   admin with the INSERT shown at the end of that file.
6. Check: the course pages render, the Apply form stores an enquiry, and the sign-in works.

## First deploy: one thing to confirm

The build target is selected by `CAC_TARGET=node`. Confirm `.output/nitro.json` says
`"preset": "node-server"` and `.output/server/index.mjs` exists. If the preset is different, ensure
the host runs `npm run build:node` rather than the default `npm run build`.

## Notes

- Editor-only leftovers, not used by the site and safe to delete on your server: the
  `src/integrations` folder, the `supabase` folder, the editor's `.env`, and the `@supabase/supabase-js`
  package entry. The editor regenerates these, so they are only removed from your copy.
- Accounts, logins and password hashing are the site's own tables (`app_users`, `app_sessions`) and
  plain PostgreSQL functions — no external login service is involved.
- Outbound mail goes through `src/lib/mail.server.ts` only. Swapping to a different mail provider
  later means editing that one file.
