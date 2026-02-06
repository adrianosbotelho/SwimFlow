import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM || 'SwimFlow <no-reply@swimflow.app>'

if (!resendApiKey) {
  console.warn('RESEND_API_KEY is not set. Email sending is disabled.')
}

const resend = resendApiKey ? new Resend(resendApiKey) : null

export class EmailService {
  static async sendVerificationEmail(params: { email: string; name: string; token: string }): Promise<void> {
    if (!resend) {
      console.log(`[DEV] Verification email token for ${params.email}: ${params.token}`)
      return
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const verifyUrl = `${frontendUrl}/verify-email?token=${params.token}`

    await resend.emails.send({
      from: resendFrom,
      to: params.email,
      subject: 'Confirme sua conta no SwimFlow',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
          <h2>Olá, ${params.name}!</h2>
          <p>Bem-vindo ao SwimFlow. Para liberar seu acesso, confirme seu email clicando no botão abaixo:</p>
          <p style="margin:24px 0;">
            <a href="${verifyUrl}" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;">
              Confirmar meu email
            </a>
          </p>
          <p>Se o botão não funcionar, copie e cole este link no navegador:</p>
          <p>${verifyUrl}</p>
          <p>Se você não criou uma conta, ignore este email.</p>
        </div>
      `
    })
  }
}
