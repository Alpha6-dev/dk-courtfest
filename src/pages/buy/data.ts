import type { TicketType } from '../../types/db'

export type Lang = 'fr' | 'en'

export interface TicketOption {
  type: TicketType
  label: string
  price: number
  presale: number
  blurb: Record<Lang, string>
}

// Full prices; the presale (first 50 tickets) is applied by Hello-Tix for Wave
// and card, and confirmed by the team for Orange Money buyers.
export const TICKETS: TicketOption[] = [
  {
    type: 'general',
    label: 'Général',
    price: 10000,
    presale: 8000,
    blurb: { fr: 'Toute la journée : open runs, tournois, musique.', en: 'All day: open runs, tournaments, music.' },
  },
  {
    type: 'vip',
    label: 'VIP',
    price: 15000,
    presale: 12000,
    blurb: { fr: 'Toute la journée, avec place assise dans l’espace VIP.', en: 'All day, with a seat in the VIP area.' },
  },
]

export const PRESALE_CAP = 50
export const QTY_MAX = 5

// CourtFest-branded Hello-Tix checkout (Wave and card). Empty until Hello-Tix
// sends the event link; the Wave/card option then switches on by itself.
export const HELLOTIX_URL = ''

// Orange Money is not available on Hello-Tix: buyers send the amount to this
// number, then confirm on WhatsApp and the team issues their QR pass.
export const ORANGE_MONEY_NUMBER = '+221 77 284 26 50'
export const ORANGE_MONEY_HOLDER = 'Mouhamadou Lamine Diop'
export const WHATSAPP_DIGITS = '221772842650'

export const xof = (n: number) => `${n.toLocaleString('fr-FR')} XOF`

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
    presaleNote: `Prévente pour les ${PRESALE_CAP} premiers billets, puis plein tarif. Joueur ou staff ? Ton entrée est offerte, pas besoin de billet.`,
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
    presaleCheck: 'Si la prévente est encore ouverte, on te confirme le prix sur WhatsApp avant le transfert.',
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
    presaleLine: 'En prévente',
    presaleApplied: 'appliqué au paiement tant qu’il en reste.',
    total: 'Total',
    qrNote: 'Billets nominatifs avec code QR, contrôlés à l’entrée.',
    waIntro: 'Bonjour, je souhaite',
    waTicket: 'billet',
    waTickets: 'billets',
    waFor: 'pour',
    waName: 'Nom',
    waPhone: 'Téléphone',
    waPay: 'Je paie par Orange Money au',
    waPresale: 'ou prix de prévente si encore disponible',
    waProof: "J'envoie la confirmation du transfert ici.",
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
    presaleNote: `Presale for the first ${PRESALE_CAP} tickets, then full price. Player or staff? Your entry is free, no ticket needed.`,
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
    presaleCheck: 'If the presale is still open, we confirm the price on WhatsApp before you transfer.',
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
    presaleLine: 'Presale',
    presaleApplied: 'applied at checkout while it lasts.',
    total: 'Total',
    qrNote: 'Named tickets with QR code, checked at the gate.',
    waIntro: 'Hello, I would like',
    waTicket: 'ticket',
    waTickets: 'tickets',
    waFor: 'for',
    waName: 'Name',
    waPhone: 'Phone',
    waPay: 'I pay by Orange Money to',
    waPresale: 'or the presale price if still available',
    waProof: 'I will send the transfer confirmation here.',
    langSwitch: 'FR',
    langAria: 'Passer en français',
  },
} as const
