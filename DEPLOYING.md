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
2. `npm install` (or `bun install`).
3. Build for a Node server: `CAC_TARGET=node npm run build:node`
4. In **Setup Node.js App**: point it at that folder, set the startup file to
   `dist/server/index.mjs`, add the environment variables above, then **Start App**.
5. Create the database tables and load the data: restore the SQL export of the current database
   with `psql "your connection string" < backup.sql`, or run the migrations in `supabase/migrations`
   in order against the empty database.
6. Check: the course pages render, the Apply form stores an enquiry, and the sign-in works.

## First deploy: one thing to confirm

The build target is selected by `CAC_TARGET=node`. On the college's server nothing pins it, so the
output should be a plain Node server. Confirm `dist/nitro.json` says `"preset": "node-server"`. If a
build there still reports a Cloudflare preset, the editor's build wrapper has been dropped from the
config and `NITRO_PRESET=node-server npm run build` is the equivalent command.

## Notes

- The `.env` in this project containing `SUPABASE_*` entries is generated for the editor and is not
  read by the site; it is not needed on your hosting.
- Accounts, logins and password hashing are the site's own tables (`app_users`, `app_sessions`) and
  plain PostgreSQL functions — no external login service is involved.
- Outbound mail goes through `src/lib/mail.server.ts` only. Swapping to a different mail provider
  later means editing that one file.
