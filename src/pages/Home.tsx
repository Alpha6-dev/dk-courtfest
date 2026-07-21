import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import landingHtml from './courtfest-landing.html?raw'
import landingCss from './courtfest-landing.css?raw'

/**
 * CourtFest landing page — "Le basket qui rassemble la ville."
 *
 * The markup and styles are the exact Courtfest basketball redesign
 * (imported as raw strings). This wrapper injects the page-scoped CSS,
 * renders the design, and routes internal links through the SPA.
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
      // Internal app routes -> SPA navigation. Leave #hash + external as-is.
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigate(href)
      }
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

    el.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('click', onClick)
    }
  }, [navigate])

  return (
    <>
      <style>{landingCss}</style>
      <div ref={ref} dangerouslySetInnerHTML={{ __html: landingHtml }} />
    </>
  )
}
