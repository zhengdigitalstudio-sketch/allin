import nodemailer from 'nodemailer'

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

/** Returns only labels (no emails) for the public dropdown */
export function getRecipientLabels(): { key: string; label: string }[] {
  return getContactRecipients().map((r, i) => ({
    key: String(i),
    label: r.label,
  }))
}

function getTransporter() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) return null

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export async function sendContactEmail(payload: {
  recipientIndex: number
  senderName: string
  senderEmail: string
  subject: string | null
  message: string
}): Promise<{ success: boolean; error?: string }> {
  const recipients = getContactRecipients()
  const recipient = recipients[payload.recipientIndex]

  if (!recipient) {
    return { success: false, error: 'Penerima tidak valid' }
  }

  const transporter = getTransporter()
  if (!transporter) {
    return { success: false, error: 'Email service tidak dikonfigurasi' }
  }

  const subjectLine = payload.subject
    ? `[ALLIN Kontak] ${payload.subject}`
    : '[ALLIN Kontak] Pesan Baru dari Website'

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #15803d; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Pesan Kontak Baru — ALLIN</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #6b7280;">Dikirim ke:</td>
            <td style="padding: 8px 0;">${recipient.label} &lt;${recipient.email}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Nama:</td>
            <td style="padding: 8px 0;">${payload.senderName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${payload.senderEmail}">${payload.senderEmail}</a></td>
          </tr>
          ${payload.subject ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Subjek:</td>
            <td style="padding: 8px 0;">${payload.subject}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #15803d;">
          <p style="margin: 0; white-space: pre-wrap;">${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        Pesan ini dikirim melalui formulir kontak website allin.web.id
      </p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: recipient.email,
      replyTo: payload.senderEmail,
      subject: subjectLine,
      html: htmlBody,
    })
    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal mengirim email'
    return { success: false, error: msg }
  }
}