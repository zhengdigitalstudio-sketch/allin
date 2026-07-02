/**
 * Contact form recipient options.
 * Configured via CONTACT_GMAILS env var as JSON array:
 * [{"label":"Ketua","email":"ketua@gmail.com"}, ...]
 */
interface RecipientOption {
  label: string
  email: string
}

let _recipients: RecipientOption[] | null = null

export function getContactRecipients(): RecipientOption[] {
  if (_recipients) return _recipients

  const raw = process.env.CONTACT_GMAILS
  if (!raw) {
    _recipients = []
    return _recipients
  }

  try {
    _recipients = JSON.parse(raw)
    if (!Array.isArray(_recipients)) _recipients = []
  } catch {
    _recipients = []
  }

  return _recipients
}

/** Returns {key, label, email} for the public dropdown (emails needed for mailto: CTA) */
export function getRecipientOptions(): { key: string; label: string; email: string }[] {
  return getContactRecipients().map((r, i) => ({
    key: String(i),
    label: r.label,
    email: r.email,
  }))
}