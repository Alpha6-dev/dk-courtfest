-- Courtfest Dakar 2026: kids ticket (ages 5 to 12, 3,000 XOF, 50 tickets),
-- set on Hello-Tix on 8 Nov 2026. Lets the admin issue kids passes with the
-- right type (price_xof stays free text on the ticket row).
alter type ticket_type add value if not exists 'kids';
