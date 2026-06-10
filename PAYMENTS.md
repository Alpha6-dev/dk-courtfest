# Payments — Wave & Orange Money

DK CourtFest collects entry fees (and could collect sponsorship) in **XOF / FCFA**. In Senegal, card penetration is low and **Wave + Orange Money dominate**, so the gateway must support mobile money.

## What works today
- **Cash / manual issuance** — admins issue tickets in `/admin/tickets`; a `payments` row (`provider='cash'`, `status='paid'`) is recorded for each priced ticket. This feeds reporting and the SYSCOHADA ledger now, with **no third-party account required**.

## What's DEPLOYED (just add your key)
Online **Wave + Orange Money + card** checkout via **CinetPay** is fully built and the Edge Functions are **deployed and ACTIVE** on the project (`payment-init`, `payment-webhook`). The public buy page (`/buy`) calls them. It returns `configured:false` until the CinetPay merchant key is set — then it returns a live checkout URL. Verified end-to-end (ticket + pending payment created on call).

Prefer **PayDunya** or **direct Wave/Orange Money** instead? The provider lives in one adapter (`openCheckout()` in `payment-init/index.ts`) — say so and it's a small swap.

## Academy cotisations (same checkout)
`payment-init` also accepts `{ membership_id }`: it resolves the cotisation, creates/reuses the pending payment, and opens the same Wave/OM checkout. The webhook flips both the payment **and the membership** to `paid`.
- Admin flow: `/admin/athletes` → "+ 2026-06" creates the cotisation, **copies the pay link** (`/pay/<id>`) and offers a pre-filled **WhatsApp** message to the guardian.
- Public flow: guardian opens `/pay/<id>` → straight to checkout (or "déjà réglée ✓").
- Ledger: cotisations export as crédit **7062** (vs 7061 billetterie, 7068 sponsoring).

## Provider landscape (for future reference)
CinetPay (current, ~10 Francophone countries) · PayDunya (Senegal-native, deepest local rails incl. Free Money) · InTouch (large Senegal network) · Flutterwave (30+ African countries — switch if expanding beyond WAEMU) · Paystack (Senegal newer) · Stripe (❌ no Senegal). Local depth > breadth for a Dakar audience.

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
