# Helios CM V1 — Login & Roles

Prima versione prodotto con:
- login Supabase Auth
- ruoli: admin, pm_ipp, director, viewer, epc_pm, site_manager
- portale IPP automatico
- portale EPC automatico
- demo login IPP/EPC per test immediato
- tabelle user_profiles, project_user_access, audit_log

## Supabase

Esegui lo schema aggiornato in `supabase/schema.sql`.

Poi crea utenti da:
Supabase > Authentication > Users

Quando l'utente entra la prima volta, viene creato un profilo admin di fallback.
Dopo potrai cambiare il ruolo in tabella `user_profiles`.

Commit:
Helios CM V1 login roles
