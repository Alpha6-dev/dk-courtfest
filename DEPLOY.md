# Deploy — Hostinger (GitHub auto-deploy)

On every push to `main`, GitHub Actions builds the app and uploads `dist/` to Hostinger via FTP (`.github/workflows/deploy.yml`). The Supabase URL + anon key are baked in at build time (both public). You do the 3 one-time steps below.

## 1. Get FTP credentials (Hostinger hPanel)
hPanel → **Websites → dkcourtfest.com → Files → FTP Accounts**:
- **FTP host** (e.g. `ftp.dkcourtfest.com` or the server IP / `*.hostinger.com` hostname)
- **FTP username**
- **FTP password** — use the existing one or "Change password" to set a known one

> Note the **web root path**. Primary domain = `/public_html/` (already set in the workflow). If dkcourtfest.com shows a different folder (e.g. `domains/dkcourtfest.com/public_html`), edit `server-dir:` in `.github/workflows/deploy.yml`.

## 2. Add the FTP secrets to GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**. Add three:
| Name | Value |
|------|-------|
| `FTP_HOST` | your FTP host |
| `FTP_USERNAME` | your FTP username |
| `FTP_PASSWORD` | your FTP password |

(The Supabase values are already in the workflow — nothing to add there.)

## 3. Run the deploy
- **Actions** tab → **Build & Deploy to Hostinger** → **Run workflow** (or just push any commit to `main`).
- First run with secrets present uploads the whole site; later runs are incremental.

## 4. Domain + HTTPS (hPanel)
Since dkcourtfest.com is registered at Hostinger and is the site's primary domain, it already points at `public_html`. Then:
- hPanel → **Security → SSL** → ensure an SSL certificate is **active** for dkcourtfest.com (Hostinger auto-issues Let's Encrypt; click Install if needed).
- hPanel → **Performance / Advanced → Force HTTPS** → **On**.

> HTTPS is required for the check-in **PWA to install** on staff phones and for the camera scanner to work.

## 5. Verify
- Visit **https://dkcourtfest.com** → landing page.
- `/register` → submit a test team.
- `/admin` → log in (add yourself first under Supabase → Authentication → Users).
- On a phone: open the site → browser menu → **Add to Home Screen** → the check-in app installs.

## Troubleshooting
- **FTPS connection fails** → in `deploy.yml` change `protocol: ftps` to `protocol: ftp` (or confirm port 21 is open in hPanel).
- **Routes 404 on refresh** → confirm `.htaccess` reached `public_html` (it's in `dist/`, so it deploys automatically).
- **Blank page** → check the Actions build log; usually a wrong `server-dir`.
