# Helios CM V1.1 — Admin Users

Aggiunge:
- pagina Administration
- lista utenti
- creazione/invito utente
- ruoli
- assegnazione progetti
- disattivazione utenti
- Supabase Edge Function admin-invite-user

## Importante

La creazione reale degli utenti Auth non può avvenire dal browser con anon key.
Serve deployare la Edge Function:

supabase/functions/admin-invite-user/index.ts

La funzione usa SUPABASE_SERVICE_ROLE_KEY lato server.

## Commit

Helios CM V1.1 admin users
