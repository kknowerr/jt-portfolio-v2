# Portfolio v2: Docker + GitHub Guide

For Jacob (Mac) and Joaquin (Windows ThinkPad). Same commands work on both machines. Docker guarantees identical environments.

## What each file does

| File | Purpose |
|------|---------|
| `Dockerfile` | Recipe for building the app environment. Three stages: dev (hot reload), build (compiles the site), production (nginx serving static files). |
| `docker-compose.yml` | One command to start the dev container with your code mounted in. |
| `.dockerignore` | Keeps `node_modules` and junk out of the image. |
| `nginx.conf` | Web server config for the production stage. |
| `.github/workflows/ci.yml` | GitHub runs this on every push. Lints, builds, and tests the Docker image. |

## One-time setup

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/ (Joaquin: enable WSL 2 when the installer asks).
2. Install Git: https://git-scm.com/downloads (already on Mac).
3. Clone the repo:

```bash
git clone https://github.com/YOUR_USERNAME/jt-portfolio-v2.git
cd jt-portfolio-v2
```

## Daily workflow

Start coding:

```bash
docker compose up
```

Open http://localhost:5173. Edit files in `src/`. The browser updates on save. No Node install needed on the laptop. The container has Node inside.

Stop: press Ctrl+C, then run `docker compose down`.

Rebuild after changing `package.json` (new dependency):

```bash
docker compose up --build
```

Add a dependency without leaving Docker:

```bash
docker compose exec portfolio npm install some-package
```

## Git workflow (the part to learn cold)

Before you start working each session:

```bash
git pull
```

After finishing a chunk of work:

```bash
git status                 # see what changed
git add .                  # stage everything
git commit -m "Add hero section"
git push
```

Commit messages: imperative mood, under 50 characters. "Add projects grid", not "added some stuff".

### Working together without conflicts

Each person works on a branch, not on main:

```bash
git checkout -b feature/hero-section   # create and switch to a branch
# ...do your work, commit as usual...
git push -u origin feature/hero-section
```

Then open a Pull Request on github.com. The other person reviews, then merges. This is the exact workflow at companies. CI runs on every PR, so a broken build never reaches main.

Get back to main and sync:

```bash
git checkout main
git pull
```

### Fixing common mistakes

| Problem | Fix |
|---------|-----|
| Committed to main by accident | `git checkout -b rescue-branch` then `git checkout main` and `git reset --hard origin/main` |
| Want to undo uncommitted changes to a file | `git checkout -- src/App.jsx` |
| Pull fails with conflict | Open the conflicted file, pick the right lines between `<<<<<<<` and `>>>>>>>`, then `git add .` and `git commit` |

## Testing the production build locally

This is what Azure will serve:

```bash
docker build --target production -t portfolio-prod .
docker run -p 8080:80 portfolio-prod
```

Open http://localhost:8080. Same image, same behavior, anywhere.

## Azure migration path (later)

1. Push the repo to GitHub. Make sure CI is green.
2. Option A, simplest: Azure Static Web Apps. Connect the GitHub repo in the Azure portal. Azure adds a workflow file and deploys on every push to main. Free tier exists.
3. Option B, container route (matches your friend's company workflow): push the production image to Azure Container Registry, then run on Azure App Service for Containers. Add a deploy job to `ci.yml` using `azure/webapps-deploy`.

Start with A. Move to B when you want container deployment on your resume.

## Showing growth from the old portfolio

Keep the old repo public and untouched. In the new repo README, link the old one: "Previous version: built with X, hosted on GitHub Pages. This version: containerized with Docker, CI on GitHub Actions, deployed to Azure." Recruiters notice the progression.

## Live pairing

Use VS Code Live Share for real-time sessions. One person hosts, shares the link, both edit. Combine with the branch workflow above for async work.
