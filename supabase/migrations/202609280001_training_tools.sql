alter table public.profiles
  add column if not exists training_pauses jsonb not null default '[]'::jsonb,
  add column if not exists custom_workouts jsonb not null default '[]'::jsonb;
alter table public.profiles add constraint profiles_training_pauses_array
  check (jsonb_typeof(training_pauses) = 'array');
alter table public.profiles add constraint profiles_custom_workouts_array
  check (jsonb_typeof(custom_workouts) = 'array');
-- Both fields inherit profiles_own RLS. No policy or permission widening.
