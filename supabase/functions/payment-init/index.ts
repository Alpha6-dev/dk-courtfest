// Alpha 6 Sports — payment initialization (Supabase Edge Function, Deno).
//
// Two flows, one CinetPay hosted checkout (Wave + Orange Money + card, XOF):
//   1. Event ticket:        { holder_name, phone, type, amount_xof }
//   2. Academy membership:  { membership_id }   (cotisation created by admin)
//
// The provider lives in this one adapter — swapping CinetPay for PayDunya/
// Flutterwave later only touches `openCheckout()`.
//
// Secrets: CINETPAY_API_KEY, CINETPAY_SITE_ID  (optional SITE_URL)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Provider adapter (CinetPay) ──────────────────────────────────────────────
async function openCheckout(opts: {
  transactionId: string
  amountXof: number
  description: string
  customerName: string
  customerPhone: string
  returnUrl: string
  notifyUrl: string
}): Promise<{ configured: boolean; url?: string }> {
  const apikey = Deno.env.get('CINETPAY_API_KEY')
  const site_id = Deno.env.get('CINETPAY_SITE_ID')
  if (!apikey || !site_id) return { configured: false }

  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey,
      site_id,
      transaction_id: opts.transactionId,
      amount: opts.amountXof,
      currency: 'XOF',
      description: opts.description,
      customer_name: opts.customerName,
      customer_phone_number: opts.customerPhone,
      channels: 'ALL', // Wave, Orange Money, card
      notify_url: opts.notifyUrl,
      return_url: opts.returnUrl,
    }),
  })
  const data = await res.json()
  const url = data?.data?.payment_url
  if (!url) throw new Error('CinetPay: ' + (data?.message ?? 'pas d’URL de paiement'))
  return { configured: true, url }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://courtfest.com'
    const notifyUrl = `${SUPABASE_URL}/functions/v1/payment-webhook`

    const { data: edition } = await supabase
      .from('editions')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (!edition) throw new Error('Aucune édition active')

    // ── Flow 2: academy membership (cotisation) ─────────────────────────────
    if (body.membership_id) {
      const { data: ms, error: mErr } = await supabase
        .from('memberships')
        .select('id, period, amount_xof, status, payment_id, athletes(first_name, last_name, guardian_phone)')
        .eq('id', body.membership_id)
        .single()
      if (mErr || !ms) throw new Error('Cotisation introuvable')
      if (ms.status === 'paid') return json({ ok: true, already_paid: true })

      // Reuse the pending payment if one exists, else create it.
      let paymentId = ms.payment_id as string | null
      if (!paymentId) {
        const { data: payment, error: pErr } = await supabase
          .from('payments')
          .insert({ edition_id: edition.id, provider: 'cinetpay', amount_xof: ms.amount_xof, status: 'pending' })
          .select()
          .single()
        if (pErr) throw pErr
        paymentId = payment.id
        await supabase.from('memberships').update({ payment_id: paymentId }).eq('id', ms.id)
      }

      const athlete = ms.athletes as unknown as { first_name: string; last_name: string; guardian_phone: string | null }
      const checkout = await openCheckout({
        transactionId: paymentId!,
        amountXof: ms.amount_xof,
        description: `DK Academy — cotisation ${ms.period}`,
        customerName: `${athlete.first_name} ${athlete.last_name}`,
        customerPhone: athlete.guardian_phone ?? '',
        returnUrl: `${siteUrl}/academy`,
        notifyUrl,
      })
      return json({ ok: true, ...checkout, label: `${athlete.first_name} ${athlete.last_name} · ${ms.period}`, amount_xof: ms.amount_xof })
    }

    // ── Flow 1: event ticket ────────────────────────────────────────────────
    const { holder_name, phone, type = 'general', amount_xof } = body
    if (!holder_name || !amount_xof) throw new Error('holder_name et amount_xof requis')

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

    const checkout = await openCheckout({
      transactionId: payment.id,
      amountXof: amount_xof,
      description: `DK CourtFest — billet ${type}`,
      customerName: holder_name,
      customerPhone: phone ?? '',
      returnUrl: `${siteUrl}/ticket/${ticket.qr_token}`,
      notifyUrl,
    })
    return json({ ok: true, ...checkout, ticket_token: ticket.qr_token, payment_id: payment.id })
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
