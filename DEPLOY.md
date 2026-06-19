# Deploying to Vercel

Marcos Power Eye is a Vite + React SPA backed by Supabase. There is no server
runtime to host — Vercel just needs to build the static bundle and serve it
with SPA rewrites so `/tasks`, `/timeline`, etc. don't 404 on direct loads.

The repository already contains:

- `vercel.json` — framework preset, build/output config, SPA rewrite, cache and
  security headers
- `.vercelignore` — keeps `.env`, local artifacts and docs out of the upload

## 1. Push to GitHub

If the repo isn't on GitHub yet:

```bash
# create an empty repo on github.com first (no README, no .gitignore, no licence)
git remote add origin git@github.com:<your-user-or-org>/<repo-name>.git
git branch -M main
git push -u origin main
```

If a remote already exists, just push the latest commits:

```bash
git push origin main
```

## 2. Import the project on Vercel

1. Go to <https://vercel.com/new>.
2. Pick your GitHub account, then **Import** the repo.
3. On the configuration screen Vercel should auto-detect the Vite preset. The
   values in `vercel.json` win over the UI, so you don't need to change
   anything there:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm ci`
4. Expand **Environment Variables** and add the values below.
5. Click **Deploy**.

## 3. Environment variables

Set these for **Production**, **Preview**, and **Development** unless noted.

| Name                    | Required | Notes                                                                                  |
| ----------------------- | -------- | -------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`     | Yes      | Project URL from Supabase → Settings → API                                              |
| `VITE_SUPABASE_ANON_KEY`| Yes      | `anon` public key. Safe to expose; it's gated by Supabase RLS policies                  |
| `VITE_APP_PASSWORD`     | Optional | Set to enable the shared-password gate. Leave unset to skip the login screen           |

> Vite inlines every `VITE_*` variable into the client bundle at build time.
> Treat `VITE_APP_PASSWORD` as a soft gate, not a real auth boundary. If you
> need real auth, migrate to Supabase Auth and remove the gate.

After the first deploy, Vercel rebuilds automatically on every push to `main`
(production) and on every PR (preview).

## 4. Supabase configuration

In the Supabase dashboard:

1. **Settings → API → URL Configuration** — add your Vercel domain
   (`https://<project>.vercel.app` and any custom domain) to the allowed list.
2. **Authentication → URL Configuration** — only matters if/when you migrate to
   Supabase Auth; the current shared-password gate doesn't touch Supabase Auth.
3. **Database → RLS Policies** — confirm the four tables (`outcomes`, `tasks`,
   `outputs`, `milestones`, `risks`) have policies that allow the `anon` role
   to read/write what the app needs. The seeder runs on first load and bails
   when `outcomes` is non-empty.

## 5. Verifying the deploy

Once Vercel reports **Ready**:

- Visit the production URL. The dashboard should load with seeded data on
  first visit.
- Hard-refresh `https://<project>.vercel.app/tasks` directly. It must render
  the Task Tracker (not a 404). If you get a 404, the SPA rewrite isn't
  active — re-check `vercel.json` is at the repo root and committed.
- Open DevTools → Network. Each route navigation should pull a small per-route
  chunk (14–25 KB) on top of the shared core (~457 KB).
- If `VITE_APP_PASSWORD` is set, the login screen should appear before the
  dashboard.

## 6. Custom domain (optional)

In the Vercel project: **Settings → Domains → Add**. Vercel will give you the
DNS records to add at your registrar. SSL is automatic.

## 7. Common issues

- **404 on direct route loads** — `vercel.json` missing or rewrite removed.
- **Blank page, console says `Missing Supabase environment variables`** — the
  two `VITE_SUPABASE_*` vars aren't set, or were added after the latest
  deploy. Trigger a redeploy after editing env vars.
- **Login screen appears even though you didn't want it** — `VITE_APP_PASSWORD`
  is set on Vercel. Remove it and redeploy.
- **CRUD requests fail with 401/403** — Supabase RLS isn't permitting the
  `anon` role for the relevant table.
