# V1.1 — Import Weekly Report EPC reale

Questa versione aggiunge:

- upload file Excel
- parsing browser con libreria XLSX
- riconoscimento progetto da nome file
- estrazione Overall: Planned, Forecast, Actual, Delta
- estrazione fasi da foglio Report/Foglio1
- estrazione Curve S da foglio Curve S
- salvataggio su Supabase:
  - sal_imports
  - phase_progress
  - s_curve_points

## Prima di usare

In Supabase assicurati che esistano le tabelle:
- phase_progress
- s_curve_points

Se non esistono, esegui `supabase/schema.sql`.

## Commit suggerito

V1.1 real weekly report import
