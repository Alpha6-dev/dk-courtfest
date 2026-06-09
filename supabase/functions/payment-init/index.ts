// DK CourtFest — payment initialization (Supabase Edge Function, Deno).
//
// Creates a ticket + pending payment, then opens a CinetPay hosted checkout
// that accepts **Wave + Orange Money + card** (XOF). Returns the checkout URL.
//
// Deploy:  (via Supabase MCP / CLI) function name: payment-init
// Secrets: CINETPAY_API_KEY, CINETPAY_SITE_ID  (and optional SITE_URL)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { holder_name, phone, type = 'general', amount_xof } = await req.json()
    if (!holder_name || !amount_xof) throw new Error('holder_name et amount_xof requis')

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Active edition (latest).
    const { data: edition } = await supabase
      .from('editions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (!edition) throw new Error('Aucune édition active')

    // 1. Ticket (valid) + pending payment.
    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .insert({ edition_id: edition.id, holder_name, phone, type, price_xof: amount_xof })
      .select()
      .single()
    if (tErr) throw tErr

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .insert({ edition_id: edition.id, provider: 'cinetpay', amount_xof, status: 'pending', ticket_id: ticket.id })
      .select()
      .single()
    if (pErr) throw pErr

    // 2. CinetPay hosted checkout (Wave + Orange Money + card).
    const apikey = Deno.env.get('CINETPAY_API_KEY')
    const site_id = Deno.env.get('CINETPAY_SITE_ID')
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://dkcourtfest.com'
    if (!apikey || !site_id) {
      // Not configured yet — return the ticket so cash/manual still works.
      return json({ ok: true, configured: false, ticket_token: ticket.qr_token, payment_id: payment.id })
    }

    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey,
        site_id,
        transaction_id: payment.id,
        amount: amount_xof, // XOF, multiple of 5
        currency: 'XOF',
        description: `DK CourtFest — billet ${type}`,
        customer_name: holder_name,
        customer_phone_number: phone ?? '',
        channels: 'ALL', // Wave, Orange Money, card
        notify_url: `${SUPABASE_URL}/functions/v1/payment-webhook`,
        return_url: `${siteUrl}/ticket/${ticket.qr_token}`,
      }),
    })
    const data = await res.json()
    const url = data?.data?.payment_url
    if (!url) throw new Error('CinetPay: ' + (data?.message ?? 'pas d’URL de paiement'))

    return json({ ok: true, configured: true, url, ticket_token: ticket.qr_token })
  } catch (err) {
    return json({ ok: false, error: String(err) }, 400)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
