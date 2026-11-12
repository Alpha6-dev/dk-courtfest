import type { TicketType } from '../../types/db'

export type Lang = 'fr' | 'en'

export interface TicketOption {
  type: TicketType
  label: string
  // Online price today: the presale price until the presale ends, the advance price after.
  price: number
  // True while `price` is the presale price; absent for tickets without a presale (kids).
  presale?: boolean
  blurb: Record<Lang, string>
}

// Same prices as Hello-Tix (set there on 11 Nov 2026). General and VIP have
// three levels: presale until 30 Nov, advance until the event, door on the day
// (door tickets are not sold here). Kids 5 to 12 at 3,000 (50 tickets, one
// price) and a group price, 10% off from 5 tickets, kids included.
export const PRICES = {
  general: { presale: 6000, advance: 8000, door: 10000 },
  vip: { presale: 11000, advance: 13000, door: 15000 },
} as const
// The presale ends on Monday 30 Nov 2026 at 00:00 in Dakar (UTC+0), as on Hello-Tix.
export const PRESALE_OPEN = Date.now() < Date.UTC(2026, 10, 30)
const online = (p: { presale: number; advance: number }) => (PRESALE_OPEN ? p.presale : p.advance)

export const TICKETS: TicketOption[] = [
  {
    type: 'general',
    label: 'Général',
    price: online(PRICES.general),
    presale: PRESALE_OPEN,
    blurb: { fr: 'Toute la journée : open runs, tournois, musique.', en: 'All day: open runs, tournaments, music.' },
  },
  {
    type: 'vip',
    label: 'VIP',
    price: online(PRICES.vip),
    presale: PRESALE_OPEN,
    blurb: { fr: 'Toute la journée, avec place assise dans l’espace VIP.', en: 'All day, with a seat in the VIP area.' },
  },
  {
    type: 'kids',
    label: 'Enfant',
    price: 3000,
    blurb: { fr: 'Enfants de 5 à 12 ans, toute la journée. 50 billets.', en: 'Kids aged 5 to 12, all day. 50 tickets.' },
  },
]

export const KIDS_CAP = 50
// Group price: 10% off from GROUP_MIN tickets, kids included (applied by
// Hello-Tix; confirmed on WhatsApp for Orange Money).
export const GROUP_MIN = 5
export const GROUP_OFF = 0.1
export const QTY_MAX = 10

export function orderTotal(price: number, quantity: number) {
  const gross = price * quantity
  return quantity >= GROUP_MIN ? Math.round(gross * (1 - GROUP_OFF)) : gross
}

// CourtFest-branded Hello-Tix checkout (Wave and card). Empty until Hello-Tix
// sends the event link; the Wave/card option then switches on by itself.
export const HELLOTIX_URL = 'https://hello-tix.com/e/courtfest26'

// Orange Money is not available on Hello-Tix: buyers send the amount to this
// number, then confirm on WhatsApp and the team issues their QR pass.
export const ORANGE_MONEY_NUMBER = '+221 77 284 26 50'
export const ORANGE_MONEY_HOLDER = 'Mouhamadou Lamine Diop'
export const WHATSAPP_DIGITS = '221772842650'

// Buyers say FCFA, and so does Hello-Tix; XOF stays in the data and the JSON-LD.
export const xof = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`

const frN = (n: number) => n.toLocaleString('fr-FR')
const enN = (n: number) => n.toLocaleString('en-US')
const G = PRICES.general
const V = PRICES.vip

// Language preference shared with /register (key cf_lang).
export function readLang(): Lang {
  try {
    const v = localStorage.getItem('cf_lang')
    return v === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}
export function saveLang(l: Lang) {
  try {
    localStorage.setItem('cf_lang', l)
  } catch {
    /* storage unavailable */
  }
}

export const T = {
  fr: {
    back: 'Retour',
    eyebrow: 'Billetterie',
    title: 'Ta place',
    titleAccent: 'sur le terrain.',
    lede: 'Choisis ton billet, laisse ton contact, paie. Le billet arrive sur WhatsApp.',
    step1: '1 · Ton billet',
    step2: '2 · Tes infos',
    step3: '3 · Paiement',
    presaleBadge: 'Prévente',
    groupLine: 'Tarif groupe (-10 %)',
    groupApplied: 'appliqué au paiement à partir de 5 billets, enfants compris.',
    presaleNote: `${
      PRESALE_OPEN
        ? `Prévente jusqu’au 30 novembre à 0 h. Ensuite : Général ${frN(G.advance)} FCFA, VIP ${frN(V.advance)} FCFA. Sur place : ${frN(G.door)} et ${frN(V.door)} FCFA, selon disponibilité.`
        : `Sur place : Général ${frN(G.door)} FCFA, VIP ${frN(V.door)} FCFA, selon disponibilité.`
    } Enfants de 5 à 12 ans : 3 000 FCFA, ${KIDS_CAP} billets. Groupe de ${GROUP_MIN} billets et plus : -10 %, enfants compris. Joueur ou staff ? Ton entrée est offerte, pas besoin de billet.`,
    chosen: 'Choisi',
    quantity: 'Nombre de billets',
    fewer: 'Un billet de moins',
    more: 'Un billet de plus',
    name: 'Nom complet',
    namePlaceholder: 'Prénom Nom',
    phone: 'Téléphone WhatsApp',
    nameError: 'Ton nom complet, pour le billet.',
    phoneError: 'Un numéro WhatsApp valide, pour recevoir ton billet.',
    waveCard: 'Wave ou carte',
    waveOn: 'Paiement sécurisé sur notre billetterie Hello-Tix. Billet QR immédiat.',
    waveOff: 'Bientôt disponible. En attendant, paie par Orange Money.',
    orange: 'Orange Money',
    orangeNote: 'Transfert au numéro Courtfest, confirmation sur WhatsApp. Pass QR envoyé par l’équipe.',
    sendTitle: 'Envoie le montant',
    sendBy: 'par Orange Money au',
    confirmTitle: 'Confirme sur WhatsApp',
    confirmBody: 'Envoie la capture du transfert. Tes pass QR arrivent en retour, au nom de',
    confirmBtn: 'Confirmer sur WhatsApp',
    summary: 'Récapitulatif',
    date: 'Date',
    dateTbc: 'Date à confirmer',
    venue: 'Lieu',
    hours: 'Horaires',
    allDay: 'Toute la journée',
    ticket: 'Billet',
    tickets: 'billets',
    total: 'Total',
    qrNote: 'Billets nominatifs avec code QR, contrôlés à l’entrée.',
    waIntro: 'Bonjour, je souhaite',
    waTicket: 'billet',
    waTickets: 'billets',
    waFor: 'pour',
    waName: 'Nom',
    waPhone: 'Téléphone',
    waPay: 'Je paie par Orange Money au',
    waGroup: 'tarif groupe -10 % inclus',
    waProof: "J'envoie la confirmation du transfert ici.",
    payNow: 'Payer',
    copy: 'Copier le numéro',
    copied: 'Numéro copié',
    help: 'Une question ?',
    helpLink: 'Écris-nous sur WhatsApp',
    langSwitch: 'EN',
    langAria: 'Switch to English',
  },
  en: {
    back: 'Back',
    eyebrow: 'Tickets',
    title: 'Your spot',
    titleAccent: 'on the court.',
    lede: 'Pick your ticket, leave your contact, pay. The ticket arrives on WhatsApp.',
    step1: '1 · Your ticket',
    step2: '2 · Your details',
    step3: '3 · Payment',
    presaleBadge: 'Presale',
    presaleNote: `${
      PRESALE_OPEN
        ? `Presale until 30 November, 12:00 am. After that: General ${enN(G.advance)} FCFA, VIP ${enN(V.advance)} FCFA. At the door: ${enN(G.door)} and ${enN(V.door)} FCFA, subject to availability.`
        : `At the door: General ${enN(G.door)} FCFA, VIP ${enN(V.door)} FCFA, subject to availability.`
    } Kids aged 5 to 12: 3,000 FCFA, ${KIDS_CAP} tickets. Groups of ${GROUP_MIN} tickets or more: 10% off, kids included. Player or staff? Your entry is free, no ticket needed.`,
    groupLine: 'Group price (10% off)',
    groupApplied: 'applied at checkout from 5 tickets, kids included.',
    chosen: 'Chosen',
    quantity: 'Number of tickets',
    fewer: 'One ticket fewer',
    more: 'One ticket more',
    name: 'Full name',
    namePlaceholder: 'First Last',
    phone: 'WhatsApp phone',
    nameError: 'Your full name, for the ticket.',
    phoneError: 'A valid WhatsApp number, to receive your ticket.',
    waveCard: 'Wave or card',
    waveOn: 'Secure payment on our Hello-Tix ticketing. Instant QR ticket.',
    waveOff: 'Coming soon. Meanwhile, pay with Orange Money.',
    orange: 'Orange Money',
    orangeNote: 'Transfer to the Courtfest number, confirm on WhatsApp. QR pass sent by the team.',
    sendTitle: 'Send the amount',
    sendBy: 'by Orange Money to',
    confirmTitle: 'Confirm on WhatsApp',
    confirmBody: 'Send the transfer screenshot. Your QR passes come back, in the name of',
    confirmBtn: 'Confirm on WhatsApp',
    summary: 'Summary',
    date: 'Date',
    dateTbc: 'Date to be confirmed',
    venue: 'Venue',
    hours: 'Hours',
    allDay: 'All day',
    ticket: 'Ticket',
    tickets: 'tickets',
    total: 'Total',
    qrNote: 'Named tickets with QR code, checked at the gate.',
    waIntro: 'Hello, I would like',
    waTicket: 'ticket',
    waTickets: 'tickets',
    waFor: 'for',
    waName: 'Name',
    waPhone: 'Phone',
    waPay: 'I pay by Orange Money to',
    waGroup: 'group price 10% off included',
    waProof: 'I will send the transfer confirmation here.',
    payNow: 'Pay',
    copy: 'Copy number',
    copied: 'Number copied',
    help: 'A question?',
    helpLink: 'Message us on WhatsApp',
    langSwitch: 'FR',
    langAria: 'Passer en français',
  },
} as const
