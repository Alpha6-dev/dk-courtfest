# Payments — Wave & Orange Money

DK CourtFest collects entry fees (and could collect sponsorship) in **XOF / FCFA**. In Senegal, card penetration is low and **Wave + Orange Money dominate**, so the gateway must support mobile money.

## ✅ STATUS: WORKING — PayDunya sandbox verified end-to-end (11 Jun 2026)
Live test completed: `/buy` → `payment-init` → PayDunya hosted checkout → test client paid 200 XOF → redirect to the ticket QR page on courtfest.com → IPN → `paydunya-webhook` re-verified via confirm API → payment `paid` in DB.
- Provider: **PayDunya** (app "DK CourtFest", account BSN3143573827, **mode test**; channels: Wave, Orange Money, Free Money, Expresso, Card)
- Secrets in Supabase: `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY` (test), `PAYDUNYA_TOKEN` (test), `PAYDUNYA_MODE=test`
- Sandbox test client "Client Test DKCF" lives in PayDunya → Clients fictifs
- **To go LIVE** (no code changes): complete business KYC in PayDunya (RCCM, NINEA, CNI — the "informations de votre entreprise" banner) → switch the app out of Mode test → replace the 3 secrets with live keys and set `PAYDUNYA_MODE=live`.

## What works today
- **Online checkout (sandbox)** — see status above.
- **Cash / manual issuance** — admins issue tickets in `/admin/tickets`; a `payments` row (`provider='cash'`, `status='paid'`) is recorded for each priced ticket. This feeds reporting and the SYSCOHADA ledger now, with **no third-party account required**.

## Provider adapters
`payment-init` auto-selects by configured secrets: **PayDunya** first, **CinetPay** as fallback (kept in code; their onboarding went sales-led and the prospect form 405'd). Adding/swapping a provider only touches `openCheckout()` — the workflow (init → hosted checkout → webhook → verify → paid) never changes.

## Academy cotisations (same checkout)
`payment-init` also accepts `{ membership_id }`: it resolves the cotisation, creates/reuses the pending payment, and opens the same Wave/OM checkout. The webhook flips both the payment **and the membership** to `paid`.
- Admin flow: `/admin/athletes` → "+ 2026-06" creates the cotisation, **copies the pay link** (`/pay/<id>`) and offers a pre-filled **WhatsApp** message to the guardian.
- Public flow: guardian opens `/pay/<id>` → straight to checkout (or "déjà réglée ✓").
- Ledger: cotisations export as crédit **7062** (vs 7061 billetterie, 7068 sponsoring).

## Provider landscape (for future reference)
CinetPay (current, ~10 Francophone countries) · PayDunya (Senegal-native, deepest local rails incl. Free Money) · InTouch (large Senegal network) · Flutterwave (30+ African countries — switch if expanding beyond WAEMU) · Paystack (Senegal newer) · Stripe (❌ no Senegal). Local depth > breadth for a Dakar audience.

## Expansion architecture (workflow never changes)
Every serious African PSP uses the same flow this system already implements:
**init → hosted checkout → webhook → server-side verify → mark paid.**
Providers are adapters behind that socket; the socket is permanent.

- `openCheckout()` in `payment-init` is the adapter seam. Entering Anglophone Africa = add a `flutterwaveCheckout()` adapter and route by edition country/currency. No workflow, schema, or front-end change.
- `payments.currency` exists (default `'XOF'`; migration 0008) — NGN/GHS/KES editions are data, not rework. (`amount_xof` is read as "amount in `currency`"; renaming the column is optional cosmetics later.)
- `editions.city/country/city_code` (migration 0008) — "ABJ CourtFest 2027" is a new row, not a new app.

### Flow
1. Buyer fills the public ticket form → app calls Edge Function **`payment-init`**.
2. `payment-init` creates a `tickets` row (valid) + a pending `payments` row, then asks the aggregator for a hosted checkout URL and redirects the buyer.
3. Buyer pays with Wave/Orange Money.
4. Aggregator calls **`payment-webhook`** → we verify and flip `payments.status = 'paid'`.
5. Buyer already holds the QR (`/ticket/:token`); ready for check-in.

### To go live (1 step — functions are already deployed)
1. Create a **CinetPay** merchant account → get **API key** + **Site ID**.
2. Supabase → Project → **Edge Functions → Secrets** (or `supabase secrets set`), add:
   - `CINETPAY_API_KEY`
   - `CINETPAY_SITE_ID`
   - *(optional)* `SITE_URL=https://dkcourtfest.com`
3. In your CinetPay dashboard set the **notify URL** to:
   `https://rvgzydyrsnwcygfshryi.supabase.co/functions/v1/payment-webhook`

That's it — `/buy` then redirects buyers to Wave/Orange Money checkout, and the webhook flips the payment to `paid`.

### Security
- `payment-webhook` **must verify** the aggregator's signature/HMAC (or re-query the transaction) before trusting a "paid" notification — see the `TODO(account)` note in the function.
- Never expose the `service_role` key in the client; it lives only in the Edge Function environment.

## WhatsApp delivery
Ticket confirmations go out via **WhatsApp** (the channel in Dakar). The admin ticket list generates a `wa.me` link prefilled with the ticket URL — one click sends it, no WhatsApp Business API needed for the MVP. Upgrade to the WhatsApp Business API later for automated sends.
