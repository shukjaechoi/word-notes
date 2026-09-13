create table if not exists public.words (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  word text not null,
  phonetic text not null default '',
  part_of_speech text not null default 'word',
  definition text not null,
  korean text not null default '',
  examples jsonb not null default '[]'::jsonb,
  mastered boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

alter table public.words enable row level security;

create policy "Users can read their own words" on public.words for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add their own words" on public.words for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own words" on public.words for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own words" on public.words for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists words_user_created_idx on public.words (user_id, created_at desc);
