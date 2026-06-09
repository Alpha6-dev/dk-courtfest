// DK CourtFest — payment webhook (Supabase Edge Function, Deno).
//
// SCAFFOLD. The aggregator (CinetPay/PayDunya) calls this URL when a payment
// settles. We verify the notification, mark the payment paid, and confirm the
// ticket. The buyer already holds the QR; this just flips it to confirmed.
//
// Deploy: supabase functions deploy payment-webhook --no-verify-jwt
//
// TODO(account): verify the signature/HMAC the aggregator sends before trusting.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const body = await req.json()

    // TODO(account): verify authenticity (CinetPay: re-query /v2/payment/check
    // with the transaction_id; PayDunya: validate the hash) before updating.
    const paymentId = body.transaction_id ?? body.cpm_trans_id
    const settled = (body.status ?? body.cpm_result) // map provider status → boolean

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (paymentId && settled) {
      await supabase.from('payments').update({ status: 'paid', ref: String(settled) }).eq('id', paymentId)
      // (ticket already valid; optionally promote / flag confirmed here)
    }

    // Always 200 so the aggregator stops retrying.
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('payment-webhook', err)
    return new Response('OK', { status: 200 })
  }
})
