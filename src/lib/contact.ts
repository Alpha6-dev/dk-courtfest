// The Courtfest team number (WhatsApp and Orange Money), in one place.
// It is stored as letters (a=0, b=1 ... j=9) so the full number never appears as
// plain digits in the page source or the built JavaScript, which keeps it out of
// simple number-harvesting scrapers. It is decoded in the browser.
const ENCODED = 'ccbhhciecgfa'

/** International digits without "+", for wa.me links. */
export const CONTACT_DIGITS = Array.from(ENCODED, (c) => String(c.charCodeAt(0) - 97)).join('')

/** Human format, as shown to Orange Money buyers: +221 77 123 45 67 */
export const CONTACT_DISPLAY = `+${CONTACT_DIGITS.slice(0, 3)} ${CONTACT_DIGITS.slice(3, 5)} ${CONTACT_DIGITS.slice(5, 8)} ${CONTACT_DIGITS.slice(8, 10)} ${CONTACT_DIGITS.slice(10)}`

/** WhatsApp chat link, optionally with a prefilled message. */
export const waLink = (text?: string) => `https://wa.me/${CONTACT_DIGITS}${text ? `?text=${encodeURIComponent(text)}` : ''}`
