# Deploy Construction Intelligence Platform

Questa versione è già configurata con il tuo Supabase.

## 1. Cosa hai già fatto

Hai creato il progetto Supabase e hai eseguito lo schema SQL.

Project URL configurato:

```text
https://bbizqpfhbhijaraomqrx.supabase.co
```

## 2. Test locale

Serve Node.js installato.

Apri Terminale nella cartella del progetto e lancia:

```bash
npm install
npm run dev
```

Apri il link mostrato, di solito:

```text
http://localhost:5173
```

## 3. Deploy online con Vercel

### Metodo consigliato

1. Crea un repository GitHub.
2. Carica questa cartella nel repository.
3. Vai su Vercel.
4. Clicca `Add New Project`.
5. Importa il repository GitHub.
6. In Vercel vai su `Settings > Environment Variables`.
7. Aggiungi:

```text
VITE_SUPABASE_URL=https://bbizqpfhbhijaraomqrx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yDBYKzfnVZUR9g0n3lpO_g_U--LC6iP
```

8. Clicca Deploy.

Alla fine avrai un link tipo:

```text
https://construction-intelligence-platform.vercel.app
```

## 4. Nota importante

Al momento la UI usa dati mock se non trova SAL importati in Supabase.

Il prossimo sviluppo è creare la funzione di upload/import SAL che popola:

- sal_imports
- phase_progress
- s_curve_points

## 5. Sicurezza

La Publishable Key può stare nel frontend.
Non inserire mai nel codice la Secret Key o service_role key.
