# Setup checklist

- [ ] New Supabase project created.
- [ ] `supabase/migrations/202611030001_init.sql` executed in SQL Editor without errors.
- [ ] Supabase email/password auth enabled and email verification settings reviewed.
- [ ] Supabase URL and anon/publishable key copied (NOT the secret/service_role key).
- [ ] Repository imported into Vercel and NEXT_PUBLIC variables set.
- [ ] Vercel URL added to Supabase Auth Site URL and Redirect URLs.
- [ ] Preview opens at `/demo` and live pages use actual accounts.
- [ ] 3-account test completed: join, size, draw, private view, persistence, reset.
- [ ] Real concert group created, date set, expected member count entered, invite link shared.


## V2 update for an already deployed Neon Threads site

- [ ] In the existing Supabase project SQL Editor, run ONLY `supabase/migrations/202611030002_delete_group.sql` (not the initial schema again).
- [ ] Commit/push the updated app code to your connected GitHub repository.
- [ ] Confirm the Vercel production deployment finishes successfully.
- [ ] Open a group and check all six "The Rave Rules" above registration progress.
- [ ] Confirm Delete Group appears only for the group organizer under Group Settings.
- [ ] Delete an unwanted **test** group by typing its exact name; verify its card disappears from My Groups.
- [ ] Verify your login and any other groups still work.
