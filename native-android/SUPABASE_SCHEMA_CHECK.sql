-- Run in the Supabase SQL editor before enabling destructive baby deletion.
-- This file is intentionally read-only verification guidance for the native app migration.

-- 1. Confirm required tables exist in the project currently used by native-android/local.properties.
select table_schema, table_name
from information_schema.tables
where table_type = 'BASE TABLE'
  and table_schema not in ('pg_catalog', 'information_schema')
  and table_name in ('babies', 'baby_members', 'baby_logs', 'invite_codes')
order by table_schema, table_name;

-- 2. Confirm foreign keys to babies(id) use ON DELETE CASCADE.
select
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.delete_rule,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
 and rc.constraint_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and ccu.table_name = 'babies'
  and ccu.column_name = 'id'
order by tc.table_name, kcu.column_name;

-- 3. Confirm RLS is enabled on app tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('babies', 'baby_members', 'baby_logs', 'invite_codes')
order by tablename;

-- 4. Inspect policies manually. Deletion should only be allowed for authorized members/owners.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('babies', 'baby_members', 'baby_logs', 'invite_codes')
order by tablename, policyname;
