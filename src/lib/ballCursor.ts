// Live basketball cursor. A fixed element follows the mouse and spins with
// it: it rolls in the direction of travel, keeps turning for a moment after
// the mouse stops, grows with its ring over anything clickable and squashes
// on click. Text fields and iframes keep the native cursor. Touch screens,
// coarse pointers and people who prefer reduced motion keep the static ball
// defined in index.css, which also remains the fallback until the first
// move, over scrollbars and while the window has lost focus (the html
// element carries the cf-spin class only while the live ball is shown).

const CLICKABLE =
  'a,button,[role="button"],label,select,summary,.cursor-pointer,' +
  'input[type="checkbox"],input[type="radio"],input[type="submit"],input[type="button"],input[type="file"],' +
  '[data-cf-photos] figure'
const NATIVE =
  'input:not([type="checkbox"],[type="radio"],[type="submit"],[type="button"],[type="file"],[type="range"],[type="color"]),' +
  'textarea,[contenteditable="true"],iframe'

const BALL =
  '<div class="cf-ballcursor-spin"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">' +
  '<circle class="cf-ring" cx="16" cy="16" r="14" fill="none" stroke="#F4EFE7" stroke-width="2"/>' +
  '<circle cx="16" cy="16" r="12.25" fill="#FF6A1A" stroke="#0B0B0C" stroke-width="1.5"/>' +
  '<g fill="none" stroke="#0B0B0C" stroke-width="1.75" stroke-linecap="round">' +
  '<path d="M16 3.75v24.5"/><path d="M3.75 16h24.5"/>' +
  '<path d="M7.35 7.35c3.6 2.9 3.6 14.4 0 17.3"/><path d="M24.65 7.35c-3.6 2.9-3.6 14.4 0 17.3"/>' +
  '</g></svg></div>'

const SPIN_PER_PX = 1 // degrees of rotation per pixel of travel
const MAX_SPIN = 25 // degrees per frame
const DECAY = 0.92 // share of the spin kept each frame once the mouse stops

export function setupBallCursor(): void {
  if (typeof window === 'undefined' || typeof matchMedia !== 'function') return
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const html = document.documentElement
  const el = document.createElement('div')
  el.className = 'cf-ballcursor'
  el.setAttribute('aria-hidden', 'true')
  el.innerHTML = BALL
  document.body.appendChild(el)
  const spinner = el.firstElementChild as HTMLElement

  let on = false
  let angle = 0
  let omega = 0 // degrees per frame
  let pending = 0 // rotation gathered from the moves of the current frame
  let dir = 1
  let lastX = 0
  let lastY = 0
  let raf = 0
  let lastTarget: Element | null = null

  const show = () => {
    if (on) return
    on = true
    el.classList.add('cf-on')
    html.classList.add('cf-spin')
  }
  const hide = () => {
    if (!on) return
    on = false
    el.classList.remove('cf-on')
    html.classList.remove('cf-spin')
  }
  const tick = () => {
    if (pending) {
      omega = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, pending))
      pending = 0
    } else {
      omega *= DECAY
    }
    angle = (angle + omega) % 360
    spinner.style.transform = `rotate(${angle}deg)`
    raf = Math.abs(omega) > 0.05 ? requestAnimationFrame(tick) : 0
  }
  const classify = (target: EventTarget | null) => {
    const t = target instanceof Element ? target : null
    if (t === lastTarget) return
    lastTarget = t
    const native = !!t?.closest(NATIVE)
    el.classList.toggle('cf-off', native)
    el.classList.toggle('cf-hand', !native && !!t?.closest(CLICKABLE))
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') {
        hide()
        return
      }
      const x = e.clientX
      const y = e.clientY
      const wasOn = on
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (wasOn) {
        const dx = x - lastX
        const dy = y - lastY
        if (dx) dir = dx > 0 ? 1 : -1
        pending += dir * Math.hypot(dx, dy) * SPIN_PER_PX
        if (!raf) raf = requestAnimationFrame(tick)
      }
      lastX = x
      lastY = y
      classify(e.target)
      show()
    },
    { passive: true },
  )
  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'mouse') hide()
      else el.classList.add('cf-down')
    },
    { passive: true },
  )
  window.addEventListener('pointerup', () => el.classList.remove('cf-down'), { passive: true })
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget) hide()
  })
  window.addEventListener('blur', hide)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hide()
  })
}
