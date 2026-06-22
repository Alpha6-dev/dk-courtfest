import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import landingHtml from './courtfest-landing.html?raw'
import landingCss from './courtfest-landing.css?raw'

/**
 * CourtFest landing page — "Le terrain appartient à la ville."
 *
 * The markup and styles are the exact Courtfest basketball redesign
 * (imported as raw strings). This wrapper injects the page-scoped CSS,
 * renders the design, routes internal links through the SPA, and captures
 * the "Rejoindre" email as a lead (contacts table via the capture_lead RPC).
 */
export default function Home() {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      // Internal app routes -> SPA navigation. Leave #hash + external as-is.
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigate(href)
      }
    }

    // The "Rejoindre" email field captures a lead into the CRM (contacts).
    const onSubmit = async (e: Event) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      const input = form.querySelector<HTMLInputElement>('input[type="email"]')
      const button = form.querySelector<HTMLButtonElement>('button')
      const email = input?.value.trim() ?? ''

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Entre une adresse email valide.')
        input?.focus()
        return
      }

      if (button) button.disabled = true
      try {
        const { error } = await supabase.rpc('capture_lead', {
          p_email: email,
          p_source: 'landing',
        })
        if (error) throw error
        toast.success('Merci ! On revient vers toi. 🏀')
        if (input) input.value = ''
      } catch (err) {
        console.error('capture_lead failed', err)
        toast.error('Oups, réessaie dans un instant.')
      } finally {
        if (button) button.disabled = false
      }
    }

    el.addEventListener('click', onClick)
    el.addEventListener('submit', onSubmit)
    return () => {
      el.removeEventListener('click', onClick)
      el.removeEventListener('submit', onSubmit)
    }
  }, [navigate])

  return (
    <>
      <style>{landingCss}</style>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: landingHtml }} />
    </>
  )
}
