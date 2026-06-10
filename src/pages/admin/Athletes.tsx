import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import type { EnrollmentStatus } from '../../types/db'

interface Row {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  guardian_phone: string | null
  categories: { name: string; monthly_fee_xof: number } | null
  enrollments: { id: string; status: EnrollmentStatus }[]
}

const STATUSES: EnrollmentStatus[] = ['pending', 'active', 'cancelled']
const statusColor: Record<EnrollmentStatus, string> = {
  pending: 'text-white/50',
  active: 'text-lion',
  cancelled: 'text-flame',
}

function thisPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Athletes() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data, error } = await supabase
      .from('athletes')
      .select('id, first_name, last_name, dob, guardian_phone, categories(name, monthly_fee_xof), enrollments(id, status)')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setRows((data as unknown as Row[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(enrollmentId: string, status: EnrollmentStatus) {
    const { error } = await supabase.from('enrollments').update({ status }).eq('id', enrollmentId)
    if (error) return toast.error(error.message)
    load()
  }

  async function bill(r: Row) {
    const fee = r.categories?.monthly_fee_xof ?? 0
    const { data, error } = await supabase
      .from('memberships')
      .insert({ athlete_id: r.id, period: thisPeriod(), amount_xof: fee, status: 'due' })
      .select()
      .single()
    if (error) return toast.error(error.message)

    // Shareable Wave/Orange Money payment link for the guardian.
    const link = `${window.location.origin}/pay/${data.id}`
    await navigator.clipboard?.writeText(link).catch(() => {})
    const wa = r.guardian_phone
      ? `https://wa.me/${r.guardian_phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
          `DK Academy — cotisation ${thisPeriod()} de ${r.first_name} (${fee.toLocaleString('fr-FR')} XOF). Payer par Wave/Orange Money : ${link}`,
        )}`
      : null
    toast.success(`Cotisation ${thisPeriod()} créée · lien de paiement copié.`, {
      action: wa ? { label: 'WhatsApp →', onClick: () => window.open(wa, '_blank') } : undefined,
      duration: 8000,
    })
  }

  if (loading) return <p className="label text-white/40">Chargement…</p>

  return (
    <section>
      <h1 className="font-display text-5xl uppercase text-bone">
        Académie <span className="text-flame">· {rows.length}</span>
      </h1>

      {rows.length === 0 ? (
        <p className="mt-6 text-white/50">Aucun joueur inscrit pour l'instant.</p>
      ) : (
        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr className="label text-white/40">
              <th className="border-b border-white/10 py-3">Joueur</th>
              <th className="border-b border-white/10 py-3">Catégorie</th>
              <th className="border-b border-white/10 py-3">Responsable</th>
              <th className="border-b border-white/10 py-3">Statut</th>
              <th className="border-b border-white/10 py-3">Cotisation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const enr = r.enrollments?.[0]
              return (
                <tr key={r.id} className="text-bone/90">
                  <td className="border-b border-white/5 py-3 font-display text-2xl">
                    {r.first_name} {r.last_name}
                  </td>
                  <td className="border-b border-white/5 py-3 text-sun">{r.categories?.name ?? '—'}</td>
                  <td className="border-b border-white/5 py-3 text-sm text-white/50">{r.guardian_phone ?? '—'}</td>
                  <td className="border-b border-white/5 py-3">
                    {enr ? (
                      <select
                        value={enr.status}
                        onChange={(e) => setStatus(enr.id, e.target.value as EnrollmentStatus)}
                        className={`bg-transparent font-display text-xl uppercase focus:outline-none ${statusColor[enr.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="bg-onyx text-bone">{s}</option>
                        ))}
                      </select>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="border-b border-white/5 py-3">
                    <button onClick={() => bill(r)} className="label text-flame hover:text-sun">
                      + {thisPeriod()}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
