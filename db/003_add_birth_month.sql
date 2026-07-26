-- Run this once against an existing database created before birth_month existed.
alter table members add column if not exists birth_month int check (birth_month between 1 and 12);
