// DK CourtFest — payment webhook (Supabase Edge Function, Deno).
//
// CinetPay calls this when a payment settles. We DON'T trust the notification
// body — we re-query CinetPay's /check endpoint with our transaction_id and only
// then mark the payment paid. Deploy with verify_jwt = false (public endpoint).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    // CinetPay posts form-encoded: cpm_trans_id = our payment.id (transaction_id).
    const form = await req.formData().catch(() => null)
    const transactionId =
      form?.get('cpm_trans_id')?.toString() ??
      (await req.clone().json().catch(() => ({})))?.cpm_trans_id
    if (!transactionId) return new Response('OK', { status: 200 })

    const apikey = Deno.env.get('CINETPAY_API_KEY')
    const site_id = Deno.env.get('CINETPAY_SITE_ID')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Verify with CinetPay (source of truth).
    const check = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey, site_id, transaction_id: transactionId }),
    }).then((r) => r.json())

    const accepted = check?.data?.status === 'ACCEPTED'
    const method = check?.data?.payment_method // WAVE / OM / CARD, etc.

    await supabase
      .from('payments')
      .update({ status: accepted ? 'paid' : 'failed', ref: method ?? check?.data?.status ?? null })
      .eq('id', transactionId)

    // Always 200 so CinetPay stops retrying.
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('payment-webhook', err)
    return new Response('OK', { status: 200 })
  }
})
