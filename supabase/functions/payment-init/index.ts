// DK CourtFest — payment initialization (Supabase Edge Function, Deno).
//
// SCAFFOLD. Creates a pending payment + ticket, then asks the mobile-money
// aggregator (CinetPay or PayDunya — both support Wave + Orange Money) for a
// hosted checkout URL that the buyer is redirected to.
//
// Deploy:  supabase functions deploy payment-init
// Secrets: supabase secrets set CINETPAY_API_KEY=... CINETPAY_SITE_ID=...
//
// TODO(account): plug in real CinetPay/PayDunya credentials before going live.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { edition_id, holder_name, phone, type = 'general', amount_xof } = await req.json()

    // Service-role client: trusted server context, bypasses RLS.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Create the ticket (status valid) + a pending payment.
    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .insert({ edition_id, holder_name, phone, type, price_xof: amount_xof })
      .select()
      .single()
    if (tErr) throw tErr

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .insert({ edition_id, provider: 'cinetpay', amount_xof, status: 'pending', ticket_id: ticket.id })
      .select()
      .single()
    if (pErr) throw pErr

    // 2. TODO(account): call the aggregator to get a checkout URL.
    //    Example shape for CinetPay /v2/payment:
    //    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    //      method: 'POST',
    //      headers: { 'Content-Type': 'application/json' },
    //      body: JSON.stringify({
    //        apikey: Deno.env.get('CINETPAY_API_KEY'),
    //        site_id: Deno.env.get('CINETPAY_SITE_ID'),
    //        transaction_id: payment.id,
    //        amount: amount_xof,
    //        currency: 'XOF',
    //        channels: 'MOBILE_MONEY',
    //        customer_name: holder_name,
    //        customer_phone_number: phone,
    //        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
    //        return_url: `${origin}/ticket/${ticket.qr_token}`,
    //      }),
    //    })
    //    const checkout = await res.json()
    //    return new Response(JSON.stringify({ url: checkout.data.payment_url }), ...)

    return new Response(
      JSON.stringify({
        ok: true,
        scaffold: true,
        message: 'Wire CinetPay/PayDunya credentials to return a real checkout URL.',
        payment_id: payment.id,
        ticket_token: ticket.qr_token,
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
