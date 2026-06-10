# Deploy — GitHub Pages + courtfest.com

On every push to `main`, GitHub Actions builds the app and publishes `dist/` to **GitHub Pages**, served at **https://courtfest.com** (`.github/workflows/deploy.yml`). No FTP, no hosting bill.

## Architecture
- **DNS (Hostinger)**: `courtfest.com` apex → 4 × A records to GitHub Pages (185.199.108–111.153) — *done, live*
- **CNAME file**: the workflow writes `dist/CNAME = courtfest.com`
- **SPA routing**: `dist/404.html` is a copy of `index.html` (GitHub Pages fallback)
- **SSL**: GitHub provisions Let's Encrypt automatically once the custom domain verifies

## One-time setup status
| Step | Status |
|------|--------|
| DNS A records → GitHub Pages | ✅ done (via hPanel) |
| Workflow (build → upload-pages-artifact → deploy-pages) | ✅ in repo |
| Repo visibility → **public** (required for free Pages) | ✅ done 10 Jun 2026 |
| Enable Pages (Source: GitHub Actions) | ✅ done |
| Custom domain + HTTPS enforce | ✅ done — cert approved (renews ~2026-09-08, automatic) |

**LIVE: https://courtfest.com** (verified: 200, HTTP→HTTPS 301, SPA fallback OK, PWA manifest OK).

## Verify
- https://courtfest.com → landing page
- `/register`, `/buy`, `/academy`, `/sports` routes survive refresh (404 fallback)
- PWA installs from the live site (HTTPS ✓)

## Notes
- `public/.htaccess` is unused on GitHub Pages (kept in case of a move back to Apache hosting).
- Old FTP/Hostinger-hosting flow was replaced 10 Jun 2026 — this account has no hosting plan; only DNS lives at Hostinger.
- Future cities: `abj.courtfest.com` → CNAME to `alpha6-dev.github.io` (or separate Pages projects).
