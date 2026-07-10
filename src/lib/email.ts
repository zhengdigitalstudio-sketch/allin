/**
 * Contact form recipient options.
 *
 * Supports TWO env vars (backward compatible):
 *
 * 1. CONTACT_WHATSAPP (preferred for WhatsApp flow):
 *    Single main WhatsApp number, e.g. "6281359545500"
 *    OR JSON array of per-recipient numbers:
 *    [{"label":"Ketua","phone":"6281234567890"}, ...]
 *
 * 2. CONTACT_GMAILS (legacy, used for mailto: flow):
 *    [{"label":"Ketua","email":"ketua@gmail.com"}, ...]
 *
 * If CONTACT_WHATSAPP is set as a single number string, all recipients
 * will route to that number (recipient label still included in message).
 */

interface RecipientOption {
  label: string
  email?: string
  phone?: string
}

let _recipients: RecipientOption[] | null = null
let _mainWhatsapp: string | null = null

function parseRecipients(): RecipientOption[] {
  if (_recipients) return _recipients

  const whatsappRaw = process.env.CONTACT_WHATSAPP
  const gmailsRaw = process.env.CONTACT_GMAILS

  const list: RecipientOption[] = []

  // Try CONTACT_WHATSAPP first
  if (whatsappRaw) {
    const trimmed = whatsappRaw.trim()
    // Check if it's a JSON array
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === 'object' && item.label && item.phone) {
              list.push({ label: String(item.label), phone: String(item.phone) })
            }
          }
        }
      } catch {
        // Invalid JSON, ignore
      }
    } else {
      // It's a single number — store as main WhatsApp
      _mainWhatsapp = sanitizePhone(trimmed)
    }
  }

  // Merge with legacy CONTACT_GMAILS (for backward compat / admin dashboard)
  if (gmailsRaw) {
    try {
      const parsed = JSON.parse(gmailsRaw)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object' && item.label) {
            const existing = list.find((l) => l.label === item.label)
            if (existing) {
              if (item.email) existing.email = String(item.email)
            } else {
              list.push({ label: String(item.label), email: item.email ? String(item.email) : undefined })
            }
          }
        }
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  _recipients = list
  return _recipients
}

function sanitizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  // Convert Indonesian 08xx to 628xx
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  // Convert +62 already handled by digit strip
  return cleaned
}

/** Returns the main WhatsApp number (env CONTACT_WHATSAPP single number, or default) */
export function getMainWhatsAppNumber(): string {
  parseRecipients()
  if (_mainWhatsapp) return _mainWhatsapp
  // Fallback: try first recipient with phone
  const list = _recipients || []
  const withPhone = list.find((r) => r.phone)
  if (withPhone?.phone) return withPhone.phone
  // Default fallback: ALLIN main phone (+62 813-5954-5500)
  return '6281359545500'
}

/** Returns {key, label, email, phone} for the public dropdown */
export function getRecipientOptions(): { key: string; label: string; email: string; phone: string }[] {
  parseRecipients()
  const list = _recipients || []
  const mainPhone = getMainWhatsAppNumber()

  if (list.length === 0) {
    return []
  }

  return list.map((r, i) => ({
    key: String(i),
    label: r.label,
    email: r.email || '',
    phone: r.phone || mainPhone,
  }))
}

/** Backward compat — returns just emails */
export function getContactRecipients(): RecipientOption[] {
  return parseRecipients()
}
