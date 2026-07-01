# Come implementare WBS nell'app

## 1. Supabase

Vai su Supabase > SQL Editor > New query.

Esegui prima:

```sql
supabase/schema.sql
```

Poi esegui:

```sql
supabase/wbs_seed_template.sql
```

Questo crea:
- wbs_activities
- weekly_quantity_updates
- WBS template

## 2. GitHub

Carica tutto questo pacchetto sul repository GitHub sovrascrivendo i file esistenti.

Commit message:

```text
V1.2 WBS setup and EPC weekly input
```

## 3. Vercel

Aspetta il deploy automatico.

## 4. App

Apri il link Vercel.

Nuove pagine:
- WBS Setup
- EPC Weekly Input

## 5. Test

Vai su EPC Weekly Input, seleziona TEMPLATE, inserisci Qty settimana su alcune attività e premi Submit EPC Update.
