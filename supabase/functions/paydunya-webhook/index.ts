// Alpha 6 Sports — PayDunya IPN webhook (Supabase Edge Function, Deno).
//
// PayDunya POSTs form-encoded `data[...]` when an invoice settles. We never
// trust the notification body: we re-query PayDunya's confirm endpoint with the
// invoice token, and only then mark the payment (and any linked membership)
// paid. Deploy with verify_jwt = false (public endpoint; PayDunya sends no JWT).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function base() {
  const mode = (Deno.env.get('PAYDUNYA_MODE') ?? 'live').toLowerCase()
  return mode === 'test' ? 'https://app.paydunya.com/sandbox-api/v1' : 'https://app.paydunya.com/api/v1'
}

Deno.serve(async (req) => {
  try {
    const form = await req.formData().catch(() => null)
    let token = form?.get('data[invoice][token]')?.toString()
    let paymentId = form?.get('data[custom_data][payment_id]')?.toString()
    if (!token) {
      const body = await req.clone().json().catch(() => ({}))
      token = body?.data?.invoice?.token ?? body?.invoice?.token
      paymentId = paymentId ?? body?.data?.custom_data?.payment_id ?? body?.custom_data?.payment_id
    }
    if (!token) return new Response('OK', { status: 200 })

    // Source of truth: PayDunya confirm endpoint.
    const check = await fetch(`${base()}/checkout-invoice/confirm/${token}`, {
      headers: {
        'PAYDUNYA-MASTER-KEY': Deno.env.get('PAYDUNYA_MASTER_KEY') ?? '',
        'PAYDUNYA-PRIVATE-KEY': Deno.env.get('PAYDUNYA_PRIVATE_KEY') ?? '',
        'PAYDUNYA-TOKEN': Deno.env.get('PAYDUNYA_TOKEN') ?? '',
      },
    }).then((r) => r.json())

    const completed = check?.status === 'completed'
    const failed = check?.status === 'cancelled'
    if (!paymentId) paymentId = check?.custom_data?.payment_id

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (completed || failed) {
      // Match by payment id from custom_data, falling back to the stored invoice token.
      const q = supabase.from('payments').update({ status: completed ? 'paid' : 'failed', ref: token })
      const { error } = paymentId ? await q.eq('id', paymentId) : await q.eq('ref', token)
      if (error) console.error('paydunya-webhook update', error.message)

      if (completed && paymentId) {
        await supabase.from('memberships').update({ status: 'paid' }).eq('payment_id', paymentId)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('paydunya-webhook', err)
    return new Response('OK', { status: 200 })
  }
})
