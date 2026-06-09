// Shared types mirroring the Supabase schema (0001_init.sql).

export type Division = '3x3' | '5x5'
export type ContactType = 'sponsor' | 'partner' | 'media' | 'volunteer' | 'vip'
export type TeamStatus = 'pending' | 'confirmed' | 'waitlist' | 'withdrawn'
export type TicketType = 'general' | 'vip' | 'player' | 'staff'
export type TicketStatus = 'valid' | 'used' | 'void'
export type MatchStatus = 'scheduled' | 'live' | 'final' | 'cancelled'

export interface Match {
  id: string
  edition_id: string
  division: Division
  round: string | null
  team_a: string | null
  team_b: string | null
  score_a: number
  score_b: number
  court: string | null
  scheduled_at: string | null
  status: MatchStatus
}

export interface Ticket {
  id: string
  edition_id: string
  holder_name: string
  phone: string | null
  type: TicketType
  price_xof: number
  qr_token: string
  status: TicketStatus
  issued_at: string
}

export interface Team {
  id: string
  edition_id: string
  name: string
  division: Division
  category: string | null
  captain_name: string
  captain_phone: string
  captain_email: string | null
  status: TeamStatus
  created_at: string
}

export interface Player {
  id: string
  team_id: string
  first_name: string
  last_name: string
  jersey_no: number | null
  position: string | null
  phone: string | null
  waiver_signed: boolean
}

export interface Contact {
  id: string
  type: ContactType
  org_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

// Form-side shapes (no ids; the DB fills defaults).
export interface PlayerDraft {
  first_name: string
  last_name: string
  jersey_no: string
  position: string
}
