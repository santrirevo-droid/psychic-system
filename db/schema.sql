-- Family tree schema
create extension if not exists pgcrypto;

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null check (gender in ('L', 'P')),
  birth_year int,
  birth_month int check (birth_month between 1 and 12),
  city text,
  photo_url text,
  generation int not null check (generation between 1 and 5),
  parent_id uuid references members(id) on delete set null,
  spouse_id uuid references members(id) on delete set null,
  pin_hash text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists members_parent_id_idx on members(parent_id);
create index if not exists members_generation_idx on members(generation);
