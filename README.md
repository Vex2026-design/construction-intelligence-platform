# Helios CM — Unified Repository

Repository unico e pulito per Helios CM.

## Contenuto
- React + Vite frontend
- Supabase schema consolidato
- Login / ruoli
- Portale IPP
- Portale EPC
- WBS Engine
- Weekly Input
- Weekly Review
- Admin Governance
- Calculation Engine
- IPP Analytics
- Snapshot e Alert

## Deploy
1. Carica tutto su GitHub sovrascrivendo il repository attuale.
2. Vercel farà il deploy automatico.
3. In Supabase esegui `supabase/schema.sql`.
4. In Vercel imposta:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Test veloce
Puoi usare i pulsanti:
- Demo IPP
- Demo EPC

## Regola prodotto
Le dashboard IPP usano solo dati approvati.
Se non ci sono Weekly approvati, le statistiche restano vuote.
