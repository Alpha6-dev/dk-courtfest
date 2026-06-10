// Alpha 6 Sports — payment initialization (Supabase Edge Function, Deno).
//
// Two flows, one hosted checkout (Wave + Orange Money + Free Money + card, XOF):
//   1. Event ticket:        { holder_name, phone, type, amount_xof }
//   2. Academy membership:  { membership_id }   (cotisation created by admin)
//
// Provider adapters (auto-selected by which secrets are set, PayDunya first):
//   - PayDunya:  PAYDUNYA_MASTER_KEY + PAYDUNYA_PRIVATE_KEY + PAYDUNYA_TOKEN
//                (+ PAYDUNYA_MODE=test|live, default live)
//   - CinetPay:  CINETPAY_API_KEY + CINETPAY_SITE_ID
// Swapping/adding a provider only touches this file. The workflow
// (init → hosted checkout → webhook → verify → paid) never changes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutOpts {
  transactionId: string
  amountXof: number
  description: string
  customerName: string
  customerPhone: string
  returnUrl: string
  supabaseUrl: string
}

interface CheckoutResult {
  configured: boolean
  provider?: 'paydunya' | 'cinetpay'
  url?: string
  providerRef?: string // PayDunya invoice token
}

// ── PayDunya adapter ─────────────────────────────────────────────────────────
function paydunyaBase() {
  const mode = (Deno.env.get('PAYDUNYA_MODE') ?? 'live').toLowerCase()
  return mode === 'test'
    ? 'https://app.paydunya.com/sandbox-api/v1'
    : 'https://app.paydunya.com/api/v1'
}

export function paydunyaHeaders() {
  return {
    'Content-Type': 'application/json',
    'PAYDUNYA-MASTER-KEY': Deno.env.get('PAYDUNYA_MASTER_KEY') ?? '',
    'PAYDUNYA-PRIVATE-KEY': Deno.env.get('PAYDUNYA_PRIVATE_KEY') ?? '',
    'PAYDUNYA-TOKEN': Deno.env.get('PAYDUNYA_TOKEN') ?? '',
  }
}

async function paydunyaCheckout(o: CheckoutOpts): Promise<CheckoutResult> {
  const res = await fetch(`${paydunyaBase()}/checkout-invoice/create`, {
    method: 'POST',
    headers: paydunyaHeaders(),
    body: JSON.stringify({
      invoice: { total_amount: o.amountXof, description: o.description },
      store: { name: 'DK CourtFest', website_url: 'https://courtfest.com' },
      actions: {
        callback_url: `${o.supabaseUrl}/functions/v1/paydunya-webhook`,
        return_url: o.returnUrl,
        cancel_url: o.returnUrl,
      },
      custom_data: { payment_id: o.transactionId },
    }),
  })
  const data = await res.json()
  if (data?.response_code !== '00') {
    throw new Error('PayDunya: ' + (data?.response_text ?? data?.description ?? 'échec de création de facture'))
  }
  const url =
    (typeof data.response_text === 'string' && data.response_text.startsWith('http') && data.response_text) ||
    data.invoice_url ||
    `https://paydunya.com/checkout/invoice/${data.token}`
  return { configured: true, provider: 'paydunya', url, providerRef: data.token }
}

// ── CinetPay adapter (kept for when/if that account activates) ───────────────
async function cinetpayCheckout(o: CheckoutOpts): Promise<CheckoutResult> {
  const apikey = Deno.env.get('CINETPAY_API_KEY')
  const site_id = Deno.env.get('CINETPAY_SITE_ID')
  const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey,
      site_id,
      transaction_id: o.transactionId,
      amount: o.amountXof,
      currency: 'XOF',
      description: o.description,
      customer_name: o.customerName,
      customer_phone_number: o.customerPhone,
      channels: 'ALL',
      notify_url: `${o.supabaseUrl}/functions/v1/payment-webhook`,
      return_url: o.returnUrl,
    }),
  })
  const data = await res.json()
  const url = data?.data?.payment_url
  if (!url) throw new Error('CinetPay: ' + (data?.message ?? 'pas d’URL de paiement'))
  return { configured: true, provider: 'cinetpay', url }
}

function activeProvider(): 'paydunya' | 'cinetpay' | null {
  if (Deno.env.get('PAYDUNYA_MASTER_KEY') && Deno.env.get('PAYDUNYA_PRIVATE_KEY') && Deno.env.get('PAYDUNYA_TOKEN'))
    return 'paydunya'
  if (Deno.env.get('CINETPAY_API_KEY') && Deno.env.get('CINETPAY_SITE_ID')) return 'cinetpay'
  return null
}

async function openCheckout(o: CheckoutOpts): Promise<CheckoutResult> {
  const p = activeProvider()
  if (!p) return { configured: false }
  return p === 'paydunya' ? paydunyaCheckout(o) : cinetpayCheckout(o)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://courtfest.com'
    const provider = activeProvider() ?? 'paydunya'

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

      let paymentId = ms.payment_id as string | null
      if (!paymentId) {
        const { data: payment, error: pErr } = await supabase
          .from('payments')
          .insert({ edition_id: edition.id, provider, amount_xof: ms.amount_xof, status: 'pending' })
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
        supabaseUrl: SUPABASE_URL,
      })
      if (checkout.providerRef) await supabase.from('payments').update({ ref: checkout.providerRef }).eq('id', paymentId)
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
      .insert({ edition_id: edition.id, provider, amount_xof, status: 'pending', ticket_id: ticket.id })
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
      supabaseUrl: SUPABASE_URL,
    })
    if (checkout.providerRef) await supabase.from('payments').update({ ref: checkout.providerRef }).eq('id', payment.id)
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
