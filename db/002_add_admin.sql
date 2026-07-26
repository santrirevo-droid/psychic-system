-- Run this once against an existing database created before is_admin existed.
alter table members add column if not exists is_admin boolean not null default false;
