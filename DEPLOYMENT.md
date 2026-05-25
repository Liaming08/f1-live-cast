# Setup Guida - Database Neon & Vercel Deployment

## 1. Creare Database su Neon

### Step 1.1: Accedi a Neon
1. Vai su https://console.neon.tech
2. Login o crea account (gratuito)
3. Crea nuovo progetto PostgreSQL

### Step 1.2: Configura il Database
- **Project Name**: f1-live-cast-db
- **Region**: Europe (EU-CENTRAL-1 consigliato)
- **Postgres Version**: Latest (16+)

### Step 1.3: Ottieni Connection String
1. Dashboard → Databases → (tuo db) → Connection string
2. Copia la stringa nel formato:
   ```
   postgresql://username:password@endpoint.neon.tech:5432/dbname?sslmode=require
   ```

## 2. Push Schema Drizzle

### Step 2.1: Locale (Testing)
```bash
cd lib/db
export DATABASE_URL="postgresql://..."
pnpm run push
```

Se vedi errore, usa:
```bash
pnpm run push-force
```

### Step 2.2: Verifica Schema
Vai su Neon Console → SQL Editor → Esegui:
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

Dovresti vedere: races, drivers, teams, lap_times, commentary, race_control, tire_strategies, race_results

## 3. Configurare Vercel

### Step 3.1: Environment Variables
Vercel Dashboard → F1 Live Cast Project → Settings → Environment Variables

Aggiungi:
```
DATABASE_URL = postgresql://... (da Neon)
ADMIN_PASSWORD = (scegli una password sicura)
NODE_ENV = production
PORT = 8080
VITE_API_URL = https://tuo-api-domain.vercel.app
FRONTEND_URL = https://tuo-frontend-domain.vercel.app
```

### Step 3.2: Deploy Triggers
- Vercel dovrebbe auto-rideploy on git push
- Se necessario, force redeploy da Vercel dashboard

## 4. Deploy Locale per Testing

### Step 4.1: Build Locale
```bash
pnpm run build
pnpm run dev
```

### Step 4.2: Test API Autenticazione
```bash
# Senza auth (GET ok, POST fallisce)
curl http://localhost:8080/api/races

# Con auth (POST ok)
TOKEN=$(echo -n "your-admin-password" | base64)
curl -X POST http://localhost:8080/api/races \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","circuit":"Test","country":"Test","round":1,"season":2024,"raceDate":"2024-01-01"}'
```

## 5. Frontend Setup Auth

### Step 5.1: Update Admin Login
Il frontend admin usa localStorage (non sicuro per produzione, ma OK per MVP).

Password è definita in `app.ts` server-side via `ADMIN_PASSWORD` env variable.

Per accedere, il token deve essere:
```
base64(ADMIN_PASSWORD) inviato come Bearer token
```

### Step 5.2: Update Admin Login Dialog (Optional)
File: `artifacts/f1-live/src/pages/admin/layout.tsx`

Attualmente: Hardcoded password "f1admin"

Per produzione: Implementare real token exchange (JWT consigliato)

## 6. Problemi Comuni

### "DATABASE_URL not set"
- Verifica env variables su Vercel
- Riapplica DATABASE_URL da Neon (copia esatta)

### Schema non sincronizzato
```bash
cd lib/db
pnpm run push-force  # Forza sync
```

### CORS Errors su Frontend
- Verifica `FRONTEND_URL` env variable
- Aggiungi dominio a CORS allowedOrigins in `app.ts`

### 401/403 su API POST
- Controlla header: `Authorization: Bearer <base64-encoded-password>`
- ADMIN_PASSWORD deve essere impostato su Vercel

## 7. Roadmap Post-MVP

- [ ] Implementare JWT authentication
- [ ] Rate limiting su OpenF1 proxy
- [ ] Auto-sync dati da OpenF1 (cron job)
- [ ] Database migrations on deploy
- [ ] Health check endpoint con DB test
