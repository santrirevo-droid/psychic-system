-- Run this once against an existing database created before is_guest existed.
-- A guest account (e.g. a shared "Keluarga" login) can view the whole tree but
-- is hidden from real members' views and can't edit anything, including its
-- own photo.
alter table members add column if not exists is_guest boolean not null default false;
