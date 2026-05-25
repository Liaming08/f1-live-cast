# 🏎️ F1 Live Cast - Setup Guide

Applicazione full-stack per il monitoraggio in diretta dei Gran Premi Formula 1 con integrazione OpenF1.

## 📋 Quick Start

### 1. Setup Locale (Sviluppo)

```bash
# Clona il repo
git clone <repo-url>
cd F1-Live-Cast

# Installa dipendenze
pnpm install

# Copia env.example
cp .env.example .env
# Configura il tuo DATABASE_URL (vedi DEPLOYMENT.md)

# Build e avvia in dev
pnpm run build
pnpm run dev
```

### 2. Prima di Commitare

**⚠️ IMPORTANTE: Non commitare `.env` o secrets!**

```bash
# Verifica cosa stai per committare
git status

# Usa git stash per cambiamenti temporanei
git stash

# Oppure crea un branch per test locali
git checkout -b feature/test-locale
```

## 🏗️ Struttura Progetto

```
F1-Live-Cast/
├── artifacts/
│   ├── api-server/        ← Express API con autenticazione Bearer
│   ├── f1-live/           ← React frontend + admin UI
│   └── mockup-sandbox/    ← Dev environment
├── lib/
│   ├── db/                ← Drizzle ORM schema + migrations
│   ├── api-client-react/  ← Auto-generated client
│   ├── api-spec/          ← OpenAPI specs
│   └── api-zod/           ← Validation schemas
├── scripts/
├── DEPLOYMENT.md          ← Setup Neon & Vercel
├── .env.example           ← Template variabili
└── package.json           ← Workspace root
```

## 🔐 Autenticazione

### Admin Dashboard
- **Login**: Password-protected (file: `artifacts/f1-live/src/pages/admin/layout.tsx`)
- **Produzione**: Implementare JWT (roadmap)
- **Sviluppo**: Password hardcoded per MVP

### API Endpoints
- **GET** `/api/*` - Pubblico (no auth)
- **POST/PATCH/DELETE** `/api/*` - Richiede Bearer token

```bash
# Esempio autenticazione
TOKEN=$(echo -n "your-admin-password" | base64)
curl -X POST http://localhost:8080/api/races \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## 🗄️ Database (Neon PostgreSQL)

### Schema
- **races**: Gare F1
- **drivers**: Piloti
- **teams**: Team
- **lap_times**: Tempi giro con settori
- **commentary**: Commenti live
- **race_control**: Messaggi ufficiali
- **tire_strategies**: Strategie gomme
- **race_results**: Risultati finali

### Migrations
```bash
cd lib/db
pnpm run push          # Sincronizza con DB remoto
pnpm run push-force    # Forza sincronizzazione
```

Vedi **DEPLOYMENT.md** per setup Neon.

## 🚀 Deployment su Vercel

### Prerequisiti
1. Neon database provisioned
2. Environment variables configurate

### Deployment
```bash
git push origin main  # Auto-deploy via Vercel
```

### Environment Variables su Vercel
Vercel Dashboard → Settings → Environment Variables:
- `DATABASE_URL` (da Neon)
- `ADMIN_PASSWORD` (scegli)
- `NODE_ENV=production`
- `VITE_API_URL` (URL API produzione)
- `FRONTEND_URL` (URL frontend)

Vedi **DEPLOYMENT.md** per guida completa.

## 📦 Scripts Principali

```bash
# Development
pnpm run build          # Build tutto il progetto
pnpm run typecheck      # Type check TypeScript

# Database
cd lib/db && pnpm run push

# API server
cd artifacts/api-server && pnpm run dev

# Frontend
cd artifacts/f1-live && pnpm run dev
```

## 🛠️ Stack Tecnologico

### Backend
- **Express.js** - API REST
- **Drizzle ORM** - Database layer
- **PostgreSQL** - Database (Neon)
- **Pino** - Logging

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Wouter** - Router
- **React Query** - Data fetching
- **Zod** - Validation

### Monorepo
- **pnpm workspaces** - Package management
- **TypeScript** - Type safety
- **OpenAPI/Orval** - API code generation

## 📝 Note di Sviluppo

### No Auto-Commits
Usa `git stash` per salvare cambiamenti locali senza committare:
```bash
git stash                 # Salva cambiamenti
git stash pop             # Ripristina cambiamenti
```

### Hot Reload
- Frontend: Abilitato di default (Vite)
- API: Richiede reload manuale o uso di `nodemon`

### Testing
- API: Test manuale con curl/Postman
- Frontend: React DevTools extension
- Database: Neon SQL Editor

## 🐛 Troubleshooting

### "DATABASE_URL not set"
```bash
# Verifica .env locale
echo $DATABASE_URL

# Su Vercel: Vai a Settings → Environment Variables
```

### Porta già in uso
```bash
# Cambia porta in .env
PORT=8081
VITE_PORT=5174
```

### CORS errors
- Verifica `FRONTEND_URL` in `app.ts`
- Controlla `VITE_API_URL` nel frontend

## 📚 Resources

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Express.js Guide](https://expressjs.com)
- [React Docs](https://react.dev)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Deployment](https://vercel.com/docs)

## 📄 License

MIT - Vedi LICENSE file

---

**Status**: MVP ✅ | Admin UI ✅ | Database ⏳ Neon Setup | Deployment ⏳ Vercel Config

Contatti: [Repo Issues](https://github.com/Liaming08/f1-live-cast/issues)
