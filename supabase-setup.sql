-- Run this SQL in your Supabase Dashboard → SQL Editor

-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  openai_api_key_encrypted text,
  created_at timestamp with time zone default now()
);

-- 2. Create guides table
create table public.guides (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  pdf_storage_path text,
  knowledge_base jsonb,
  starter_questions jsonb,
  is_public boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. Create indexes
create index idx_guides_slug on public.guides(slug);
create index idx_guides_user_id on public.guides(user_id);

-- 4. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.guides enable row level security;

-- 5. Profiles policies
-- Users can read their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Service role can do everything (for API routes)
create policy "Service role full access to profiles" on public.profiles
  for all using (auth.role() = 'service_role');

-- 6. Guides policies
-- Users can CRUD their own guides
create policy "Users can view own guides" on public.guides
  for select using (auth.uid() = user_id);

create policy "Users can insert own guides" on public.guides
  for insert with check (auth.uid() = user_id);

create policy "Users can update own guides" on public.guides
  for update using (auth.uid() = user_id);

create policy "Users can delete own guides" on public.guides
  for delete using (auth.uid() = user_id);

-- Public can view public guides (for /chat/[slug])
create policy "Public can view public guides" on public.guides
  for select using (is_public = true);

-- Service role full access
create policy "Service role full access to guides" on public.guides
  for all using (auth.role() = 'service_role');

-- 7. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Create storage bucket for PDFs
insert into storage.buckets (id, name, public) values ('pdfs', 'pdfs', false);

-- Storage policies
create policy "Users can upload their own PDFs" on storage.objects
  for insert with check (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own PDFs" on storage.objects
  for select using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own PDFs" on storage.objects
  for delete using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Service role can access all storage
create policy "Service role full access to storage" on storage.objects
  for all using (auth.role() = 'service_role');
