# Roadmap

- [x] Replace online deposits with the global refundable R500 booking fee; credit toward deposit on acceptance, all other payments handled directly by admins.

- [x] Admin course image field with preview, brochure reset and per-course display; portable image addresses and existing-host update SQL.

- [x] Update catalogue from the 4 November 2026 brochure: 31 active courses and 22 unique duals, revised durations, separate Graphic Design 101/Animation 101, retired old offerings with enquiries preserved. Updated fresh-import SQL and existing-database update script.
- [ ] Update costing from the CAC Fee Schedule — college to supply; the brochure contains category keys but no monetary amounts.

- [x] Align catalogue with the brochure: original photos, circular frames and numbered circular-bar headers; retain all fees and filters. Own-host builds include local photo copies.

- [x] Course catalogue site (courses, dual courses, about, contact) — shipped, fees pending
- [x] Enable Lovable Cloud (PostgreSQL) backend
- [x] Database schema: faculties, courses, dual_courses, enquiries (+ access rules, seeded with the 2027 prospectus)
- [x] Wire catalogue pages to read courses/fees from the database
- [x] Store Apply-form submissions as enquiries in the database
- [ ] Fees data entry once the college supplies numbers
- [x] Staff view for reading enquiries (admin dashboard)
- [x] Admin login (staff sign in at /auth) and admin dashboard at /admin: enquiry inbox with status tracking + fee editing for courses and dual courses.
- [x] Ported to plain PostgreSQL: all data access is standard SQL (postgres.js) via DATABASE_URL; own accounts/sessions tables (app_users, app_sessions) with bcrypt via pgcrypto and cookie sessions; no third-party SDKs. Admin: taryn.wdb@gmail.com (temporary password set — change it in the Account tab).
- [x] Enquiry emails built: admissions alert + applicant confirmation, sent over the college's own SMTP account (nodemailer). Sample-send button in the dashboard's Account tab.
- [ ] Turn enquiry emails on: needs a mailbox on cPanel + SMTP settings (host/port/user/pass) and the admissions address(es). Real sends only work on their hosting, not in the editor's preview.
- [x] Production handover pack: `.env.example` (every setting the site reads) and `DEPLOYING.md` (cPanel + standalone PostgreSQL steps). Settings live in the server's environment, never in code.
- [ ] Confirm the Node build target on the first real deploy (`CAC_TARGET=node npm run build:node` -> `dist/nitro.json` should read `node-server`; the editor's build environment pins it to Cloudflare so this can only be checked on their server).
- [ ] Publish so the live site matches the current version (still running the pre-PostgreSQL build).
- [x] Admin content management: Courses tab (edit/add/delete course info incl. full course info) and Dual courses tab (pick two single courses, name, faculty, duration). Each course has its own page with full info.
- [ ] Full course info text — college to supply, then enter per course in the admin Courses tab.
- [x] Payment plans: admin Fees tab manages plans (deposit, number of payments, amount each); each course/dual picks its plans; site shows "From R…" (cheapest plan total); dual "Save R…" entered per dual.
- [ ] Payment plan display layout — college to send the exact layout.
- [ ] Enter real payment plans and savings in the Fees tab.
- [x] Apply wizard: the applicant's education section is fully optional — every field may be left blank and the application still submits; blanks show as "—" in the admin Applications tab.
