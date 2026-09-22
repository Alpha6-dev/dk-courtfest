import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { track } from '../lib/analytics'
import { useBrand } from '../lib/brand'
import { use3DTier } from '../three/use3DTier'
import navFr from './landing/nav.fr.html?raw'
import navEn from './landing/nav.en.html?raw'
import footerFr from './landing/footer.fr.html?raw'
import footerEn from './landing/footer.en.html?raw'
import homeFr from './landing/home.fr.html?raw'
import homeEn from './landing/home.en.html?raw'
import evenementsFr from './landing/evenements.fr.html?raw'
import evenementsEn from './landing/evenements.en.html?raw'
import openRunsFr from './landing/open-runs.fr.html?raw'
import openRunsEn from './landing/open-runs.en.html?raw'
import galerieFr from './landing/galerie.fr.html?raw'
import galerieEn from './landing/galerie.en.html?raw'
import rejoindreFr from './landing/rejoindre.fr.html?raw'
import rejoindreEn from './landing/rejoindre.en.html?raw'
import landingCss from './courtfest-landing.css?raw'

export type LandingPageId = 'home' | 'evenements' | 'open-runs' | 'galerie' | 'rejoindre'
type Lang = 'fr' | 'en'

/**
 * The public site is five pages that share one nav and one footer. Each page
 * body is a raw HTML fragment per language (src/pages/landing); the nav links
 * point at routes, so React Router renders this component for every page and
 * the wrapper wires the behaviour once per page and language.
 */
const PAGES: Record<LandingPageId, { path: string; fr: string; en: string; title: { fr: string; en: string } | null }> = {
  home: { path: '/', fr: homeFr, en: homeEn, title: null },
  evenements: { path: '/evenements', fr: evenementsFr, en: evenementsEn, title: { fr: 'Événements', en: 'Events' } },
  'open-runs': { path: '/open-runs', fr: openRunsFr, en: openRunsEn, title: { fr: 'Open runs', en: 'Open runs' } },
  galerie: { path: '/galerie', fr: galerieFr, en: galerieEn, title: { fr: 'Galerie', en: 'Gallery' } },
  rejoindre: { path: '/rejoindre', fr: rejoindreFr, en: rejoindreEn, title: { fr: 'Rejoindre', en: 'Join' } },
}

const readLang = (): Lang => {
  try {
    return localStorage.getItem('cf_lang') === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

// 3D stage (blueprint P0) - lazy chunk, loaded only on the home page when the
// tier gate opens (?v3d=1 + capability checks). The flat tier never downloads three.js.
const Stage = lazy(() => import('../three/Stage'))

const ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
const ICON_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6"/></svg>'
const ICON_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>'

/**
 * Photo lightbox for every [data-cf-photos] grid on the page. Click, Enter or
 * Space on a photo opens it full screen with its caption; previous/next
 * buttons, arrow keys and swipe move between photos; Escape, the close button
 * or the backdrop close it. Built on demand and removed on teardown.
 */
function setupLightbox(el: HTMLElement, lang: Lang): () => void {
  const figures = Array.from(el.querySelectorAll<HTMLElement>('[data-cf-photos] figure')).filter((f) => f.querySelector('img'))
  if (figures.length === 0) return () => {}
  const t =
    lang === 'en'
      ? { open: 'Enlarge photo', close: 'Close', prev: 'Previous photo', next: 'Next photo', dialog: 'Photo' }
      : { open: 'Agrandir la photo', close: 'Fermer', prev: 'Photo précédente', next: 'Photo suivante', dialog: 'Photo' }
  let box: HTMLElement | null = null
  let index = 0
  let opener: HTMLElement | null = null
  let touchX = 0

  const render = () => {
    if (!box) return
    const fig = figures[index]
    const img = fig.querySelector('img')
    const shown = box.querySelector('img')
    if (!img || !shown) return
    shown.src = img.currentSrc || img.src
    shown.alt = img.alt
    const caption = box.querySelector('figcaption')
    if (caption) caption.textContent = fig.querySelector('figcaption')?.textContent ?? ''
    const count = box.querySelector('[data-cf-count]')
    if (count) count.textContent = `${index + 1} / ${figures.length}`
  }
  const step = (d: number) => {
    index = (index + d + figures.length) % figures.length
    render()
  }
  const close = () => {
    if (!box) return
    const b = box
    box = null
    b.classList.remove('cf-open')
    window.setTimeout(() => b.remove(), 220)
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
    opener?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
  }
  const open = (i: number, from: HTMLElement) => {
    index = i
    opener = from
    if (!box) {
      box = document.createElement('div')
      box.className = 'cf-lightbox'
      box.setAttribute('role', 'dialog')
      box.setAttribute('aria-modal', 'true')
      box.setAttribute('aria-label', t.dialog)
      box.innerHTML =
        `<button type="button" class="cf-lb-close" aria-label="${t.close}">${ICON_X}</button>` +
        `<button type="button" class="cf-lb-nav cf-lb-prev" aria-label="${t.prev}">${ICON_PREV}</button>` +
        `<figure><img alt=""><figcaption></figcaption><span data-cf-count></span></figure>` +
        `<button type="button" class="cf-lb-nav cf-lb-next" aria-label="${t.next}">${ICON_NEXT}</button>`
      box.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (target === box || target.closest('.cf-lb-close')) close()
        else if (target.closest('.cf-lb-prev')) step(-1)
        else if (target.closest('.cf-lb-next')) step(1)
      })
      box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX }, { passive: true })
      box.addEventListener(
        'touchend',
        (e) => {
          const dx = e.changedTouches[0].clientX - touchX
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        },
        { passive: true },
      )
      document.body.appendChild(box)
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKey)
      requestAnimationFrame(() => box?.classList.add('cf-open'))
      box.querySelector<HTMLElement>('.cf-lb-close')?.focus()
    }
    render()
    track('gallery_open', { photo: index + 1 })
  }

  const cleanups: Array<() => void> = []
  figures.forEach((fig, i) => {
    const caption = fig.querySelector('figcaption')?.textContent?.trim()
    fig.setAttribute('role', 'button')
    fig.setAttribute('tabindex', '0')
    fig.setAttribute('aria-label', caption ? `${t.open}: ${caption}` : t.open)
    const onClick = () => open(i, fig)
    const onKeyFig = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open(i, fig)
      }
    }
    fig.addEventListener('click', onClick)
    fig.addEventListener('keydown', onKeyFig)
    cleanups.push(() => {
      fig.removeEventListener('click', onClick)
      fig.removeEventListener('keydown', onKeyFig)
    })
  })
  return () => {
    close()
    cleanups.forEach((fn) => fn())
  }
}

export default function LandingPage({ page }: { page: LandingPageId }) {
  const navigate = useNavigate()
  const { eventName, tagline } = useBrand()
  const ref = useRef<HTMLDivElement>(null)
  const tier3d = use3DTier()
  const [lang, setLang] = useState<Lang>(readLang)
  const def = PAGES[page]
  const html = (lang === 'en' ? navEn : navFr) + (lang === 'en' ? def.en : def.fr) + (lang === 'en' ? footerEn : footerFr)
  // Stable prop object: React re-injects innerHTML whenever it receives a new
  // dangerouslySetInnerHTML object, which would throw away the classes and
  // listeners wired below every time the app re-renders (e.g. edition load).
  const htmlProp = useMemo(() => ({ __html: html }), [html])

  // Tab title: inner pages announce themselves; BrandProvider reads the same
  // flag (data-cf-page) when the active edition loads, so the two agree.
  useEffect(() => {
    const label = def.title ? def.title[lang] : ''
    if (label) document.documentElement.dataset.cfPage = label
    else delete document.documentElement.dataset.cfPage
    document.title = label ? `${label} · ${eventName}` : `${eventName} · ${tagline}`
  }, [def, lang, eventName, tagline])

  // React Router keeps the scroll position between routes; a new page starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    document.documentElement.lang = lang

    // Nav: mark the link of the page we are on.
    el.querySelectorAll<HTMLAnchorElement>('[data-nav="desk"] a, [data-nav="mlink"]').forEach((a) => {
      a.classList.toggle('cf-active', a.getAttribute('href') === def.path)
    })

    const setMenu = (open: boolean) => {
      const menu = el.querySelector('[data-nav="mobile"]')
      const toggle = el.querySelector('[data-nav="toggle"]')
      menu?.classList.toggle('cf-open', open)
      menu?.setAttribute('aria-hidden', String(!open))
      toggle?.setAttribute('aria-expanded', String(open))
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // FR/EN switch - swaps which raw fragments are injected, persisted.
      if (target.closest('[data-lang-toggle]')) {
        e.preventDefault()
        const next: Lang = lang === 'fr' ? 'en' : 'fr'
        try {
          localStorage.setItem('cf_lang', next)
        } catch {
          /* private mode */
        }
        track('lang_switch', { to: next })
        setLang(next)
        return
      }
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
      // Any link inside the mobile menu dismisses it (route nav or external).
      if (anchor.closest('[data-nav="mobile"]')) setMenu(false)
      const href = anchor.getAttribute('href') || ''
      // Funnel beacons (fire-and-forget; never block navigation).
      if (href.includes('wa.me')) track('wa_click', { page })
      if (href === '/rejoindre' && anchor.closest('#top')) track('hero_cta_click')
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
    //  - "Devenir partenaire" (events page): organisation + email, source 'partner'
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
      track(isPartner ? 'partner_form_submit' : 'rejoindre_submit', { page })
      supabase.rpc('capture_lead', { p_email: email, p_source: isPartner ? 'partner' : 'landing' }).then(({ error }) => {
        if (error) console.error('capture_lead failed', error)
      })

      let subject = 'Rejoindre le mouvement Courtfest'
      let body = `Bonjour,\n\nJe veux rejoindre le mouvement Courtfest (jouer, coacher, organiser ou devenir partenaire).\n\nMon email : ${email}\n\nMerci !`
      if (isPartner) {
        const org = form.querySelector<HTMLInputElement>('input[name="org"]')?.value.trim() ?? ''
        subject = `Partenariat Courtfest${org ? ` - ${org}` : ''}`
        body = `Bonjour,\n\nNous souhaitons devenir partenaire de Courtfest (Dakar).\n\nOrganisation : ${org || '-'}\nEmail : ${email}\n\nMerci de revenir vers nous.`
      }
      window.location.href = `mailto:alpha.vientreprise@courtfest.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      toast.success(isPartner ? 'Votre demande de partenariat est prête, envoyez l\'email. 🤝' : 'Ton message est prêt, envoie l\'email et on revient vers toi. 🏀')
      if (input) input.value = ''
    }

    // Background clips (hero + CTA). Media injected via innerHTML doesn't run
    // source selection, so kick each off manually. Skip under reduced-motion -
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

    // Nav: clear glass over the home hero, solid frosted bar once scrolled past
    // it and on every inner page. The floating WhatsApp button follows the same
    // rule so it never sits on top of the hero CTA on phones.
    const navBar = el.querySelector('[data-nav="bar"]')
    const waFab = el.querySelector('.cf-wa')
    const onScroll = () => {
      navBar?.classList.toggle('cf-solid', page !== 'home' || window.scrollY > 60)
      waFab?.classList.toggle('cf-show', page !== 'home' || window.scrollY > window.innerHeight * 0.6)
    }
    onScroll() // apply immediately (e.g. reload mid-page)
    window.addEventListener('scroll', onScroll, { passive: true })

    // Funnel: one visit beacon + one section_view per section per page.
    track('visit', { page }, 'visit')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          const id = (en.target as HTMLElement).id
          track('section_view', { section: id, page }, `sv:${page}:${id}`)
          io.unobserve(en.target)
        })
      },
      { threshold: 0.25 },
    )
    el.querySelectorAll('section[id]').forEach((s) => io.observe(s))

    // Photos open in a lightbox (prev/next, keyboard, swipe).
    const teardownLightbox = setupLightbox(el, lang)

    el.addEventListener('click', onClick)
    el.addEventListener('submit', onSubmit)
    return () => {
      teardownLightbox()
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('click', onClick)
      el.removeEventListener('submit', onSubmit)
    }
  }, [navigate, lang, page, def.path])

  return (
    <>
      <style>{landingCss}</style>
      {page === 'home' && tier3d && (
        <Suspense fallback={null}>
          {/* key remounts the stage on language switch so the headline choreography re-runs on the new DOM */}
          <Stage key={lang} />
        </Suspense>
      )}
      <div ref={ref} dangerouslySetInnerHTML={htmlProp} />
    </>
  )
}
