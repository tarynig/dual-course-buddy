# Live hosting: what to look at when it is time to move

This is the standing note for the conversation we will have when the college's own
server is ready. Nothing has been deleted — the pieces that make the site run on
cPanel are still in the code. This file says where they are and what to do.

## Why the site now reaches the database a different way

The demo address (`dual-course-buddy.lovable.app`) is hosted by Lovable, and that
hosting does not allow the site to open a direct database connection. That is why
the pages used to spin without loading: the site kept trying to open a socket that
the hosting would not let it open.

So the site now asks the database to do the work through the address Lovable's
hosting *does* allow (an HTTPS call). The SQL itself moved out of the site's code
and into the database, as saved operations.

## The one file that decides which route the data takes

`src/lib/data.server.ts`

- If the server has Lovable's database credentials in its environment, the site
  uses the HTTPS route. This is the demo address.
- If it does not, and `DATABASE_URL` is set, the site uses a plain PostgreSQL
  connection instead. This is the college's own server.

No code change is needed to move between the two. The server's environment picks
the route by itself.

## Where the operations live

`database/app-data-functions.sql`

Every thing the site does with data — read the catalogue, save an enquiry, save an
application, sign a staff member in, edit a course, record a booking fee — is one
saved operation in that file. The site calls them by name and never writes query
text. That is what lets the same code run on either host.

It is safe to run more than once, and it is safe to run on the college's database:
it only creates or replaces the operations, it never touches the rows.

## To run the site on the college's server

1. Build for a Node server: `npm run build:node`
2. Set the server's environment: `DATABASE_URL`, plus the mail and PayFast
   settings listed in `DEPLOYING.md`. Do **not** set Lovable's database
   credentials there — that is what would switch the site back to the HTTPS route.
3. Load the database:
   - `database/schema-and-catalogue.sql` (tables, courses, dual courses)
   - `database/app-data-functions.sql` (the operations above)
   - then the first-admin INSERT at the end of the schema file
4. Start with `start.mjs` and check: course pages render, Apply stores an
   application, sign-in works, a booking fee reaches PayFast.

`DEPLOYING.md` has the full step-by-step, including the mail and PayFast settings.

## Keep these in the code even though the college's server never uses them

- `src/integrations/` — the build reads this folder whether or not the server uses
  it. Deleting it makes the build fail. It is inert on the college's server: with
  no Lovable credentials in the environment, nothing in it is ever reached.
- `src/lib/data.server.ts` — the HTTPS branch of it is unused there, but the file
  is the switch, so it stays.

## What is still waiting on the college

- The fee schedule with real amounts (the brochure has category keys, no prices).
- A mailbox on the domain, so enquiry and application emails can actually go out.
- PayFast live credentials, and the site being reachable over HTTPS so PayFast
  can confirm payments.

## If the demo address ever stops loading again

Check in this order:

1. `src/lib/data.server.ts` — is the HTTPS route still being chosen?
2. `database/app-data-functions.sql` — has it been run against this database?
3. The demo address's own logs, for a database error message.
