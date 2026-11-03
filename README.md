# NEON THREADS — secret concert T-shirt exchange

A dark, neon rave-themed Secret-Santa-style web app, designed for small concert crews and reusable across future events.

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

## Deployment in 6 steps

### 1. Create a dedicated Supabase project

Recommended: use a **new Supabase project** for Neon Threads to keep it isolated from your other apps. Choose a region near your users and save the database password in your own password manager.

### 2. Create the database schema

In **Supabase → SQL Editor**, open and run:

`supabase/migrations/202611030001_init.sql`

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
supabase/migrations/   SQL schema, privileges and assignment generator
scripts/verify-draw.mjs    Local randomized draw invariant checker
```

## Known limits of the provided source bundle

This source bundle has been checked for TS/TSX *syntax* and the assignment algorithm has been tested independently. The build and live Supabase integration **have not been executed in this environment**, because downloading npm dependencies and connecting to your Supabase account are unavailable here. Run the smoke test above in your deployed project before allowing real assignments.

Free tiers may be enough for a roughly ten-person exchange, depending on your current Vercel/Supabase account limits; this isn't a guaranteed $0 service level.
