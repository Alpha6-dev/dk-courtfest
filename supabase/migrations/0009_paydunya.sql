-- Provider switch: PayDunya (Senegal-native; CinetPay onboarding stalled).
-- Applied live 11 Jun 2026 via MCP.
alter type payment_provider add value if not exists 'paydunya';
