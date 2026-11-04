# NEON THREADS — secret concert T-shirt exchange

A dark, neon rave-themed Secret-Santa-style web app, designed for small concert crews and reusable across future events.

## Version 3 — group navigation and responsive UI polish

**V3 is an app-code-only update for an existing V2 deployment. No Supabase migration, new credentials, or environment-variable changes are required.**

- **Collapsible My Groups menu (desktop):** All groups the signed-in member belongs to appear nested beneath My groups. The selected group is highlighted, and the list expands automatically when viewing a group. My groups itself still opens the full overview; the chevron controls expand/collapse.
- **Group switching on phones:** Tap **Groups** in the bottom navigation to open a compact list of all your exchanges. Tap **View all groups**, a specific group, or **Create new group**. Tap the backdrop/close button, or press Escape, to dismiss the menu.
- **Mobile create-group form:** Date and expected-member inputs stack vertically on phones to prevent native browser controls from overlapping or escaping their cards. Inputs use 16px text on narrow screens to avoid automatic iPhone zoom.
- **Responsive safeguards:** Improved wrapping and min-width constraints for event titles, member names, venue tags, group progress, organizer settings, dialogs, and the dashboard header at small phone sizes.
- **Same-page Create link fix:** The Create shortcut works even when you are already on the My groups overview (without requiring a page refresh).

### Deploy V3 over an already-live V2 website

1. Download `neon-threads-v3-changed-files.zip` and extract it. **Copy the included files into the root of your existing Neon Threads GitHub repository, preserving the folder paths.** Replace the existing versions, then commit to the branch connected to Vercel (usually `main`). Alternatively use the full V3 project ZIP if you prefer to replace the whole codebase.
2. Vercel should automatically build and deploy the new commit. **Do not rerun the Supabase initial-schema or deletion SQL migrations for this UI-only update.** Existing groups, members, sizes and assignments are untouched.
3. On desktop, open a group and verify it appears **under My groups**, not next to Create group. Test collapsing and switching between groups.
4. On a phone, tap **Groups** in the bottom navigation, choose a group, then go back and use **Create**. In the create-group dialog, check that the concert date and expected-member inputs are full width and separated vertically.
5. Test group creation, group settings, secret assignment, profile, and the six Rave Rules at both phone and desktop widths.

**UI audit scope:** Static HTML/CSS previews were checked in headless Chromium at viewport widths from **320px to 1440px**. The dashboard, landing, and create-group previews were checked across 14 widths (42 cases); representative layouts of the group overview, profile, settings, assignment, signup, invitation, and delete-confirmation were checked across 13 widths (91 cases). These checks found no document-level horizontal overflow. The navigation toggle and mobile group menu were also exercised in the static preview. A full Next.js build and real-account Supabase testing were not possible in the offline authoring environment; confirm the Vercel build and smoke-test authenticated workflows on the live site before inviting your crew.

## Version 2 additions

- **The Rave Rules:** Six approved exchange rules appear at the top of the group dashboard, with a collapsible section on narrow phone screens.
- **Delete Group:** Organizer-only permanent deletion under **Group Settings → Danger Zone**; requires typing the exact group name. Removes the group, invitation, members-for-this-group and assignments, while leaving Supabase authentication accounts and other groups untouched.

### How to upgrade an existing live Vercel / Supabase deployment from V1 to V2

1. **Do not delete your Supabase project or rerun the original schema.** In your existing Supabase project, open SQL Editor and execute `supabase/migrations/202611030002_delete_group.sql`. This adds just one protected RPC; it does not delete any existing group.
2. Commit and push the updated project files to the **same GitHub repository/branch** that is connected to your Neon Threads Vercel project (usually `main`). Alternatively use `neon-threads-v2-changed-files.zip` to replace only the changed files.
3. Let Vercel rebuild the deployment. **No new Vercel environment variables are needed.**
4. Log in as an organizer, open a group, check **Group dashboard → The Rave Rules**. On a phone, tap **View all 6 rules** to expand.
5. Open **Group settings**, scroll to **Delete group**, click the delete button, then type the exact displayed group name. Confirm only for your test group. You will return to **My Groups** and the deleted group will disappear.

**Safety:** The migration itself does not delete any data. Actual group deletion cannot be undone; only the organizer can call it. It removes the group for everyone but preserves each person's login and any other groups. If you deploy the UI before the SQL migration, the delete action will fail until you run the migration. Do not run any migration containing `DROP TABLE` to implement V2.

## Version 1 features

- Email/password accounts (Supabase Auth) with email confirmation and password recovery.
- Multiple independent groups per account and a shareable invitation link per group.
- Organizer participates in their own group.
- Flexible expected group size (3–200), editable until the draw.
- Dashboard that refreshes every 30 seconds and on window focus, with registered-member count and *size-submitted* indicator; actual shirt sizes are not public.
- Per-event preferred T-shirt sizes (XS–5XL); members can update sizes even after the draw.
- Days-until-concert countdown based on event date, editable concert details, optional venue.
- Draw enabled only when every expected member has joined **and** submitted their size.
- Atomic server-side draw that gives everyone one giver and one recipient, with no self-matches or reciprocal A↔B pairs.
- Persisted private assignment: each authenticated member can see **only their own recipient and that recipient's size**.
- Organizer may remove a member *before* the draw, or reset the whole draw with an explicit confirmation. Reset keeps accounts, memberships, and sizes.
- Desktop and mobile layouts. `/demo` offers a fictional, no-database preview.

## Stack

- Next.js 15 / React 19 / TypeScript
- Supabase Auth + Postgres RPC functions + row-level security
- Vercel hosting
- Custom CSS for the neon UI, Tailwind available for optional utilities

The application **does not** require a `service_role` key, an API route for the draw, or a scheduled cron job. Every important write is performed by a validated Supabase `SECURITY DEFINER` PostgreSQL function and happens transactionally.

## First-time deployment in 6 steps

### 1. Create a dedicated Supabase project

Recommended: use a **new Supabase project** for Neon Threads to keep it isolated from your other apps. Choose a region near your users and save the database password in your own password manager.

### 2. Create the database schema

In **Supabase → SQL Editor**, open and run:

`supabase/migrations/202611030001_init.sql`

If setting up V2 for the first time, also run `supabase/migrations/202611030002_delete_group.sql` **after** the initial schema.

This creates `profiles`, `groups`, `group_members`, `assignments` and their protected RPC functions. Run the file once on a clean Supabase project. It may be re-runnable for function edits, but don't use it as a substitute for versioned schema migrations once real data exists.

**Important:** Database security controls are implemented in Supabase, not by hiding data in React. All private tables have RLS enabled and default direct table access revoked. A member can retrieve only their own recipient via `get_my_assignment`.

### 3. Set up Supabase email authentication

In **Supabase → Authentication → Providers**, enable the email provider and **Email + Password** sign-in. Leaving email confirmation enabled is recommended. Supabase's built-in email sender may have low limits or restrictions; for a larger audience you may need custom SMTP. A ~10-person pilot might fit the free service if its current limits permit.

In **Authentication → URL Configuration**:

- Set **Site URL** to your final deployed URL (for example `https://your-app.vercel.app`).
- Add redirect allow-list entries for your local and production URLs, e.g. `http://localhost:3000/**` and `https://your-app.vercel.app/**`.
- Confirm redirects to `/auth/callback` (signup confirmation) and `/auth/update-password` (password recovery) are allowed.

Users click the confirmation email to activate their login. If you're testing with multiple friends, use separate real email addresses.

### 4. Configure environment variables

Go to **Supabase → Project Settings → API / API Keys**. Copy the project URL and the **anon/publishable** key. Do **not** use your `service_role` or any `sb_secret_...` key in `NEXT_PUBLIC_` variables.

Create a `.env.local` locally (based on `.env.example`) with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

In Vercel, add the same variables under **Project → Settings → Environment Variables** for Production and Preview as needed. Redeploy after changing values.

### 5. Deploy to Vercel

1. Upload this folder to your **own private GitHub repository**.
2. In **Vercel → Add New → Project**, import that repository.
3. Vercel should auto-detect the Next.js framework. Root directory: project root. Build command: `next build`.
4. Add the environment variables above and deploy.
5. Return to Supabase Auth URL Configuration to add the exact deployed domain to the redirect allow-list.

To run locally:

```sh
npm install
npm run dev
```

Then visit `http://localhost:3000`.

### 6. Do an end-to-end smoke test before inviting the whole group

1. Create a group with an **expected size of 3** (the smallest supported size).
2. Have three different authenticated accounts register (different browsers or browser profiles). Ensure **all three** submit sizes.
3. Verify the draw button is disabled until exactly all three register and save sizes; then verify it becomes enabled only for the organizer.
4. Generate the draw. All three must get exactly one *different* recipient. With three members, a 3-cycle necessarily prevents reciprocal pairs.
5. Confirm that no account can see the other accounts' recipients or the organizer's recipient via a different member's login or direct RPC request.
6. Confirm the recipient's size is shown, and that a recipient updating their size changes what their giver sees after refreshing/revealing again.
7. Sign out and sign back in. The same stored assignment must reappear.
8. Confirm a late member cannot join; use the existing invitation link with a previously joined account to reopen the group.
9. Reset the draw. Confirm recipients disappear while members and sizes stay in place. Adjust expected size as needed and repeat.
10. Confirm the UI works at desktop and phone widths.

After successful testing, create your real concert group (or reset/remove the test group), set an expected size around 10, and share its actual invitation link.

## Security and privacy notes

- No direct group, membership, profile, or assignment-table access is granted to ordinary browser users. All read/write access is via specific authenticated RPC functions, except the invitation preview (by secret token).
- **A Supabase project owner or other administrator with direct database access can see stored assignments.** "Private even from the organizer" is enforced in the application and user-facing API, but absolute privacy from the person who owns the Supabase database is not technically possible with this storage model. For your friend group's secret exchange, the app does not offer an organizer "view everyone" route.
- Invite links are capability tokens: anyone with the link may join until the expected member count is reached and the draw is locked. Use the member roster and organizer removal option if an unexpected person joins.
- SQL validates that organizers may only control their own groups, and membership is checked for every group-private request.
- A single, randomized circular permutation is used to guarantee no self-assignments, no reciprocal pairs, one giver per recipient, and no partially saved draws. This is random among all possible *single-cycle* matches; it does not sample uniformly from every possible valid permutation with multiple cycles. For the group exchange, all participants have the same chance of drawing each other participant.
- Passwords are handled by Supabase Auth, not stored by app tables.

## Inspect the visual design without Supabase

Open `visual-preview.html` from the extracted project folder in a browser. It shows static landing-page and dashboard examples and lets you switch between them. These are design snapshots, not live account data. After deployment, `/demo` is the interactive demonstration.

## Files

```text
app/                   Next.js pages and styles
components/            Shared interface, access guard and group workspace
lib/                   Supabase client, RPC wrappers and types
public/rave-stage.svg  Original festival-themed vector artwork
supabase/migrations/   Initial SQL schema plus V2 group deletion migration
scripts/verify-draw.mjs    Local randomized draw invariant checker
```

## Known limits of the provided source bundle

This source bundle has been checked for TS/TSX *syntax* and the assignment algorithm has been tested independently. The build and live Supabase integration **have not been executed in this environment**, because downloading npm dependencies and connecting to your Supabase account are unavailable here. Run the smoke test above in your deployed project before allowing real assignments.

Free tiers may be enough for a roughly ten-person exchange, depending on your current Vercel/Supabase account limits; this isn't a guaranteed $0 service level.
