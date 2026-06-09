# Payments — Wave & Orange Money

DK CourtFest collects entry fees (and could collect sponsorship) in **XOF / FCFA**. In Senegal, card penetration is low and **Wave + Orange Money dominate**, so the gateway must support mobile money.

## What works today
- **Cash / manual issuance** — admins issue tickets in `/admin/tickets`; a `payments` row (`provider='cash'`, `status='paid'`) is recorded for each priced ticket. This feeds reporting and the SYSCOHADA ledger now, with **no third-party account required**.

## What's scaffolded (needs your account)
Online mobile-money checkout is wired but inactive until credentials are added. Use an aggregator that bundles Wave + Orange Money + card:

| Option | Notes |
|--------|-------|
| **CinetPay** | Wide West-Africa coverage, Wave + OM + card, hosted checkout |
| **PayDunya** | Senegal-native, Wave + OM, simple API |
| **Intouch / Paydunya** | Alternative aggregators |

### Flow
1. Buyer fills the public ticket form → app calls Edge Function **`payment-init`**.
2. `payment-init` creates a `tickets` row (valid) + a pending `payments` row, then asks the aggregator for a hosted checkout URL and redirects the buyer.
3. Buyer pays with Wave/Orange Money.
4. Aggregator calls **`payment-webhook`** → we verify and flip `payments.status = 'paid'`.
5. Buyer already holds the QR (`/ticket/:token`); ready for check-in.

### To go live
```bash
# 1. Create a CinetPay (or PayDunya) merchant account → get API key + site id
# 2. Set secrets
supabase secrets set CINETPAY_API_KEY=xxx CINETPAY_SITE_ID=xxx
# 3. Deploy the functions
supabase functions deploy payment-init
supabase functions deploy payment-webhook --no-verify-jwt
# 4. Fill the TODO(account) blocks in supabase/functions/payment-*/index.ts
```

### Security
- `payment-webhook` **must verify** the aggregator's signature/HMAC (or re-query the transaction) before trusting a "paid" notification — see the `TODO(account)` note in the function.
- Never expose the `service_role` key in the client; it lives only in the Edge Function environment.

## WhatsApp delivery
Ticket confirmations go out via **WhatsApp** (the channel in Dakar). The admin ticket list generates a `wa.me` link prefilled with the ticket URL — one click sends it, no WhatsApp Business API needed for the MVP. Upgrade to the WhatsApp Business API later for automated sends.
