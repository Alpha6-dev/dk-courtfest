import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
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

    const setMenu = (open: boolean) => {
      const menu = el.querySelector('[data-nav="mobile"]')
      const toggle = el.querySelector('[data-nav="toggle"]')
      menu?.classList.toggle('cf-open', open)
      menu?.setAttribute('aria-hidden', String(!open))
      toggle?.setAttribute('aria-expanded', String(open))
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Mobile menu open/close controls.
      if (target.closest('[data-nav="toggle"]')) {
        e.preventDefault()
        setMenu(true)
        return
      }
      if (target.closest('[data-nav="close"]')) {
        e.preventDefault()
        setMenu(false)
        return
      }

      const anchor = target.closest('a')
      if (!anchor) return
      // Any link inside the mobile menu dismisses it (hash scroll or route nav).
      if (anchor.closest('[data-nav="mobile"]')) setMenu(false)
      const href = anchor.getAttribute('href') || ''
      // Funnel beacons (fire-and-forget; never block navigation).
      if (href.includes('wa.me')) track('wa_click')
      if (href === '/register' && anchor.closest('#top')) track('hero_cta_click')
      // Internal app routes -> SPA navigation. Leave #hash + external as-is.
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigate(href)
      }
    }

    // Both landing forms open an email to the team (same address as the
    // billetterie payment requests); the CRM capture still runs best-effort
    // in the background so no lead is lost.
    //  - "Rejoindre" (CTA): email only, source 'landing'
    //  - "Devenir partenaire" (#evenement): organisation + email, source 'partner'
    const onSubmit = (e: Event) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      const input = form.querySelector<HTMLInputElement>('input[type="email"]')
      const email = input?.value.trim() ?? ''

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Entre une adresse email valide.')
        input?.focus()
        return
      }

      const isPartner = form.matches('[data-partner-form]')
      track(isPartner ? 'partner_form_submit' : 'rejoindre_submit')
      supabase.rpc('capture_lead', { p_email: email, p_source: isPartner ? 'partner' : 'landing' }).then(({ error }) => {
        if (error) console.error('capture_lead failed', error)
      })

      let subject = 'Rejoindre le mouvement Courtfest'
      let body = `Bonjour,\n\nJe veux rejoindre le mouvement Courtfest (jouer, coacher, organiser ou devenir partenaire).\n\nMon email : ${email}\n\nMerci !`
      if (isPartner) {
        const org = form.querySelector<HTMLInputElement>('input[name="org"]')?.value.trim() ?? ''
        subject = `Partenariat Courtfest Vol. 02${org ? ` — ${org}` : ''}`
        body = `Bonjour,\n\nNous souhaitons devenir partenaire de Courtfest Vol. 02 (Dakar, samedi 22 août 2026, Djily Mbaye).\n\nOrganisation : ${org || '—'}\nEmail : ${email}\n\nMerci de revenir vers nous.`
      }
      window.location.href = `mailto:alpha.vientreprise@courtfest.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      toast.success(isPartner ? 'Votre demande de partenariat est prête — envoyez l\'email. 🤝' : 'Ton message est prêt — envoie l\'email et on revient vers toi. 🏀')
      if (input) input.value = ''
    }

    // Background clips (hero + CTA). Media injected via innerHTML doesn't run
    // source selection, so kick each off manually. Skip under reduced-motion —
    // CSS hides the <video> and the poster still shows, and we avoid the fetch.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduceMotion) {
      el.querySelectorAll<HTMLVideoElement>('video[data-hero-video], video[data-cta-video]').forEach((v) => {
        v.muted = true // iOS Safari requires the property (not just the attr) for autoplay
        v.load()
        const play = () => v.play().catch(() => {})
        if (v.readyState >= 2) play()
        else v.addEventListener('canplay', play, { once: true })
      })
    }

    // Nav: clear glass over the hero, solid frosted bar once scrolled past it.
    const navBar = el.querySelector('[data-nav="bar"]')
    const onScroll = () => navBar?.classList.toggle('cf-solid', window.scrollY > 60)
    onScroll() // apply immediately (e.g. reload mid-page)
    window.addEventListener('scroll', onScroll, { passive: true })

    // Funnel: one visit beacon + one section_view per section per page load.
    track('visit', undefined, 'visit')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          const id = (en.target as HTMLElement).id
          track('section_view', { section: id }, `sv:${id}`)
          io.unobserve(en.target)
        })
      },
      { threshold: 0.25 },
    )
    el.querySelectorAll('section[id]').forEach((s) => io.observe(s))

    el.addEventListener('click', onClick)
    el.addEventListener('submit', onSubmit)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
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
