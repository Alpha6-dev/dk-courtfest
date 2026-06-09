import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'

interface PaymentRow {
  id: string
  provider: string
  amount_xof: number
  status: string
  ticket_id: string | null
  sponsor_id: string | null
  created_at: string
}
interface TicketRow {
  type: string
  price_xof: number
  status: string
}

const BRAND = ['#FF5C00', '#FFB800', '#00C853', '#F5F0E8', '#8A8A8A']

// SYSCOHADA cash/bank account per rail; revenue account per nature.
const debitAccount: Record<string, string> = {
  cash: '571', // Caisse
  wave: '521-WAVE', // Banque · mobile money
  orange_money: '521-OM',
  cinetpay: '521-CINETPAY',
  card: '521',
}

function csv(filename: string, headers: string[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const body = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default function Analytics() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [counts, setCounts] = useState({ checkins: 0, teams: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('payments').select('id, provider, amount_xof, status, ticket_id, sponsor_id, created_at'),
      supabase.from('tickets').select('type, price_xof, status'),
      supabase.from('check_ins').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('*', { count: 'exact', head: true }),
    ]).then(([p, t, ci, tm]) => {
      setPayments((p.data as PaymentRow[]) ?? [])
      setTickets((t.data as TicketRow[]) ?? [])
      setCounts({ checkins: ci.count ?? 0, teams: tm.count ?? 0 })
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="label text-white/40">Chargement…</p>

  const paid = payments.filter((p) => p.status === 'paid')
  const revenue = paid.reduce((s, p) => s + p.amount_xof, 0)

  const byProvider = Object.entries(
    paid.reduce<Record<string, number>>((acc, p) => ((acc[p.provider] = (acc[p.provider] ?? 0) + p.amount_xof), acc), {}),
  ).map(([name, value]) => ({ name, value }))

  const byType = Object.entries(
    tickets.reduce<Record<string, number>>((acc, t) => ((acc[t.type] = (acc[t.type] ?? 0) + 1), acc), {}),
  ).map(([name, value]) => ({ name, value }))

  const kpis = [
    { label: 'Recettes (XOF)', value: revenue.toLocaleString('fr-FR'), accent: 'text-flame' },
    { label: 'Billets', value: tickets.length, accent: 'text-bone' },
    { label: 'Présents', value: counts.checkins, accent: 'text-lion' },
    { label: 'Équipes', value: counts.teams, accent: 'text-sun' },
  ]

  function exportLedger() {
    const rows = paid.map((p) => ({
      date: p.created_at?.slice(0, 10),
      piece: p.id.slice(0, 8),
      libelle: p.sponsor_id ? 'Sponsoring DK CourtFest' : 'Billetterie DK CourtFest',
      compte_debit: debitAccount[p.provider] ?? '521',
      compte_credit: p.sponsor_id ? '7068' : '7061', // sponsoring · billetterie
      montant_xof: p.amount_xof,
      sens: 'recette',
      business: 'Y',
    }))
    csv('dkcourtfest_journal_syscohada.csv', ['date', 'piece', 'libelle', 'compte_debit', 'compte_credit', 'montant_xof', 'sens', 'business'], rows)
  }

  function exportTickets() {
    csv('dkcourtfest_billets.csv', ['type', 'price_xof', 'status'], tickets as unknown as Record<string, unknown>[])
  }

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">Analyse</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-white/10 bg-white/5 p-6">
            <span className="label text-white/40">{k.label}</span>
            <div className={`mt-2 font-display text-5xl ${k.accent}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-white/10 bg-white/5 p-5">
          <span className="label text-sun">Recettes par moyen de paiement (XOF)</span>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProvider}>
                <XAxis dataKey="name" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} />
                <Tooltip contentStyle={{ background: '#0A0A0C', border: '1px solid #333' }} />
                <Bar dataKey="value">
                  {byProvider.map((_, i) => (
                    <Cell key={i} fill={BRAND[i % BRAND.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 p-5">
          <span className="label text-sun">Billets par catégorie</span>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <XAxis dataKey="name" stroke="#8A8A8A" fontSize={12} />
                <YAxis stroke="#8A8A8A" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0A0A0C', border: '1px solid #333' }} />
                <Bar dataKey="value">
                  {byType.map((_, i) => (
                    <Cell key={i} fill={BRAND[i % BRAND.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button onClick={exportLedger} className="bg-flame px-6 py-3 font-display text-xl uppercase text-onyx hover:bg-sun">
          ↓ Journal SYSCOHADA (CSV)
        </button>
        <button onClick={exportTickets} className="border border-white/20 px-6 py-3 font-display text-xl uppercase text-bone hover:border-flame">
          ↓ Billets (CSV)
        </button>
      </div>
      <p className="label mt-3 text-white/30">
        Journal : recettes payées → débit 5xx (caisse/banque mobile) · crédit 7061 billetterie / 7068 sponsoring · business=Y. Comptes ajustables.
      </p>
    </section>
  )
}
