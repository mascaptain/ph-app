-- Échanges de séances dans la file du programme : { "<position>": <indice moteur> }.
alter table public.profiles
  add column if not exists session_swaps jsonb not null default '{}'::jsonb;
alter table public.profiles add constraint profiles_session_swaps_object
  check (jsonb_typeof(session_swaps) = 'object');
