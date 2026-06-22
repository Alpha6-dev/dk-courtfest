import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import landingHtml from './courtfest-landing.html?raw'
import landingCss from './courtfest-landing.css?raw'

/**
 * CourtFest landing page — "Le terrain appartient à la ville."
 *
 * The markup and styles are the exact Courtfest basketball redesign
 * (imported as raw strings). This wrapper injects the page-scoped CSS,
 * renders the design, and intercepts internal links / the join form so
 * navigation stays within the SPA (react-router) instead of full reloads.
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

    // The "Rejoindre" email field is a teaser — send people to registration.
    const onSubmit = (e: Event) => {
      e.preventDefault()
      navigate('/register')
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
