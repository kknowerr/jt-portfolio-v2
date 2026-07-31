# jt-portfolio-v2

Personal portfolio of **Jacob A. Trevino** — Technician. Developer. Automator.

Dark, terminal-inspired single-page site built with React and Vite, containerized with Docker, and verified by GitHub Actions CI on every push.

> Previous version: [jt-portfolio](https://github.com/l0sttt/jt-portfolio) — React 18 + Tailwind, hosted on GitHub Pages. This version: React 19 + Vite 8, containerized with Docker, CI on GitHub Actions, Azure deploy planned.

## Stack

- **React 19** + **Vite 8** (requires Node 20.19+ — see `.nvmrc`)
- **Docker** — dev, build, and nginx production stages
- **GitHub Actions** — lint, build, and production-image check on every push/PR
- **ESLint** — flat config with React hooks rules

## Quick start

With Node installed (uses `.nvmrc`):

```bash
nvm use
npm install
npm run dev
```

Or with Docker (no local Node needed):

```bash
docker compose up
```

Either way, open http://localhost:5173. Edits under `src/` hot-reload.

## Production build

```bash
docker build --target production -t portfolio-prod .
docker run -p 8080:80 portfolio-prod
```

Open http://localhost:8080 — this is exactly what production will serve.

## Workflow

Branch-based development with PRs into `main`; CI must pass before merge. See [GUIDE.md](GUIDE.md) for the full Docker + git workflow and the Azure deployment plan.

## Versions

- **v1.0** — baseline: ported v1 content into the new React/Vite/Docker structure.
