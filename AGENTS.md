# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

SwimFlow is a swimming school management system (Portuguese-language UI). Monorepo with three independent `package.json` files: root, `backend/`, `frontend/`. See `Makefile` and `README.md` for standard commands.

### Services

| Service | Port | Command |
|---------|------|---------|
| PostgreSQL 15 | 5432 | `POSTGRES_DB=swimflow_db docker-compose -f docker-compose.dev.yml up -d postgres` |
| Backend API (Express/TypeScript) | 3001 | `cd backend && npm run dev` |
| Frontend (React/Vite) | 3000 | `cd frontend && npm run dev` |

### Non-obvious Gotchas

- **Database name mismatch**: `docker-compose.dev.yml` defaults to `POSTGRES_DB=swimflow_dev`, but `backend/.env.example` and `prisma/init.sql` reference `swimflow_db`. Always start Docker Compose with `POSTGRES_DB=swimflow_db` or the init.sql grants will fail and the container will crash.
- **Seed requires confirmation flags**: `npx prisma db seed` requires `SEED_WIPE=1 SEED_CONFIRM=WIPE_swimflow_db SEED_ALLOW_NON_DEV=1` to actually populate data.
- **ESLint config pre-existing issue**: Both `.eslintrc.js` (backend) and `.eslintrc.cjs` (frontend) use `@typescript-eslint/recommended` in `extends`, but the correct format is `plugin:@typescript-eslint/recommended`. Lint commands will fail until this is fixed.
- **TypeScript build errors**: `tsc` (backend/frontend) has pre-existing type errors. Dev mode (`tsx watch`, `vite`) works fine without strict TS checking.
- **Backend ESLint not in package.json**: The backend `package.json` is missing `eslint`, `@typescript-eslint/parser`, and `@typescript-eslint/eslint-plugin` as devDependencies. Install them at version `^8.55.0` / `^6.14.0` respectively for compatibility with the `.eslintrc.js` format.
- **Docker socket permissions**: After starting `dockerd`, you may need `sudo chmod 666 /var/run/docker.sock`.
- **docker-compose standalone**: Only the Docker Compose plugin (`docker compose`) is available. A wrapper script at `/usr/local/bin/docker-compose` bridges the gap.
- **Frontend proxies `/api`** to `http://localhost:3001` via Vite config — no separate proxy setup needed.

### Test Credentials (from seed)

- Admin: `admin@swimflow.com` / `admin123`
- Prof1: `carlos.silva@swimflow.com` / `prof123`
- Prof2: `ana.santos@swimflow.com` / `prof123`

### Running Tests

- Backend: `cd backend && npm test` (Jest, 6 suites, 45 tests)
- Frontend: `cd frontend && npm test` (Vitest, 8 suites, 45 tests)

### Starting the Full Dev Environment

1. Ensure Docker is running (`sudo dockerd` if not started)
2. `POSTGRES_DB=swimflow_db docker-compose -f docker-compose.dev.yml up -d postgres`
3. Wait for Postgres: `docker exec swimflow-postgres pg_isready -U swimflow_user -d swimflow_db`
4. Copy `.env.example` to `.env` in both `backend/` and `frontend/` (if not already done)
5. `cd backend && npx prisma migrate deploy && npx prisma db seed` (with seed flags above for first run)
6. `npm run dev` from root (starts both backend and frontend concurrently)
