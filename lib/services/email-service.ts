import { Lettermint } from 'lettermint'

// Initialize Lettermint with API key
const lettermint = new Lettermint({
  apiToken: process.env.LETTERMINT_API_TOKEN || ''
})

export interface InvitationEmailParams {
  to: string
  inviterName: string
  projectName: string
  acceptUrl: string
  message?: string | null
}

/**
 * Sends a project invitation email using Lettermint
 *
 * @param params - Email parameters including recipient, inviter info, and project details
 * @returns Promise with Lettermint API response
 * @throws Error if email sending fails
 */
export async function sendInvitationEmail(params: InvitationEmailParams) {
  const { to, inviterName, projectName, acceptUrl, message } = params

  // Use FROM_EMAIL environment variable or fallback to a default sender
  const fromEmail = process.env.FROM_EMAIL || 'noreply@hcihub.com'

  try {
    const response = await lettermint.email
      .from(fromEmail)
      .to(to)
      .subject(`Invitation to join "${projectName}" on HCI Hub`)
      .text(buildPlainTextEmail(inviterName, projectName, acceptUrl, message))
      .send()

    return {
      id: response.message_id,
      status: response.status
    }
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    console.error('Error details:', {
      message: error?.message,
      statusCode: error?.statusCode,
      responseBody: error?.responseBody,
      fromEmail,
      to,
    })
    throw error
  }
}

/**
 * Builds the plain text email content
 */
function buildPlainTextEmail(
  inviterName: string,
  projectName: string,
  acceptUrl: string,
  message?: string | null
): string {
  let emailText = `${inviterName} wants to invite you to ${projectName}\n\n`

  if (message) {
    emailText += `Message from ${inviterName}:\n"${message}"\n\n`
  }

  emailText += `Accept Invitation: ${acceptUrl}\n\n`
  emailText += `This invitation will expire in 14 days.\n\n`
  emailText += `---\n`
  emailText += `HCI Hub - Human-Centered Design Project Management`

  return emailText
}
