# Helios CM Enterprise

Repository pulito, modulare e compilabile per Helios CM.

## Moduli inclusi
- Login demo / Supabase Auth-ready
- Portale IPP
- Portale EPC
- Portfolio Executive
- IPP Analytics
- Project Room
- WBS Setup
- EPC Weekly Input
- IPP Weekly Review
- Calculation Engine
- Admin Users
- Admin Override
- Supabase schema

## Deploy
1. Carica tutti i file su GitHub, alla radice del repository.
2. Vercel rileva Vite e compila automaticamente.
3. Esegui `supabase/schema.sql` in Supabase SQL Editor.
4. Imposta su Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Test
Usa i pulsanti:
- Demo IPP
- Demo EPC

## Regola fondamentale
Le statistiche non mostrano dati finché non esistono Weekly approvati.
