import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
const root = new URL('../',import.meta.url).pathname;
const sql=readFileSync(join(root,'supabase/migrations/202611030001_init.sql'),'utf8').toLowerCase();
for(const table of ['profiles','groups','group_members','assignments']){
 assert(sql.includes(`alter table public.${table} enable row level security;`),`RLS missing on ${table}`);
}
for(const fn of ['create_group','join_group','get_my_groups','get_group_dashboard','set_my_size','update_group','remove_member','generate_draw','reset_draw','get_my_assignment','preview_invite']){
 assert(sql.includes(`function public.${fn}(`),`RPC missing: ${fn}`);
}
for(const phrase of ['security definer','for update','where a.group_id = p_group_id and a.giver_id = v_user','v_count <> v_group.expected_members','v_ready <> v_count','delete from public.assignments','unique (group_id, recipient_id)']){
 assert(sql.includes(phrase),`Required safeguard absent: ${phrase}`);
}
const code=readFileSync(join(root,'components/GroupWorkspace.tsx'),'utf8');
for(const phrase of ['No self-assignments','Reset the entire draw','Expected group size','onReveal','size_submitted']){
 assert(code.includes(phrase),`Expected UI behavior missing: ${phrase}`);
}
const packageJson=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
assert(packageJson.scripts.build==='next build');
console.log('PASS: source contract audit (RLS flags, RPCs, draw safeguards, UI and package scripts).');
console.log('Note: this is static source inspection, not an execution of SQL against Supabase.');
