'use server'

import { createServerSupabaseClient } from './supabase-server'

// Zoho API Types
interface ZohoTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  api_domain: string
  token_type: string
}

interface ZohoAccount {
  accountId: string
  accountName: string
  primaryEmailAddress: string
}

interface ZohoAccountsResponse {
  status: {
    code: number
    description: string
  }
  data: ZohoAccount[]
}

interface ZohoFolder {
  folderId: string
  folderName: string
}

interface ZohoEmailSummary {
  messageId: string
  subject: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  time: number
  hasAttachment: boolean
  priority: number
  size: number
  folderId: string
  summary?: string
  receivedTime?: number
}

interface ZohoEmailContent {
  messageId: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string
  summary: string
  time: number
  hasAttachment: boolean
  attachments?: Array<{
    attachmentName: string
    attachmentSize: number
    attachmentPath: string
  }>
}

interface ZohoMessagesResponse {
  status: {
    code: number
    description: string
  }
  data: ZohoEmailSummary[]
}

interface ZohoMessageContentResponse {
  status: {
    code: number
    description: string
  }
  data: ZohoEmailContent
}

// Environment variables
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID

/**
 * Decode HTML entities and extract email address from formatted string
 * Example: "&quot;Name&quot;&lt;email@domain.com&gt;" => "email@domain.com"
 */
function cleanEmailAddress(rawEmail: string): string {
  if (!rawEmail) return ''

  // Decode HTML entities
  let cleaned = rawEmail
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

  // Extract email from "Name"<email@domain.com> format
  const emailMatch = cleaned.match(/<([^>]+)>/)
  if (emailMatch) {
    return emailMatch[1]
  }

  // If no angle brackets, return as is (after HTML decode)
  return cleaned.replace(/"/g, '').trim()
}

// In-memory token cache (will be refreshed as needed)
let cachedAccessToken: string | null = null
let tokenExpiresAt: number | null = null

/**
 * Check if Zoho Mail API is configured
 */
export async function isZohoConfigured(): Promise<boolean> {
  return !!(
    ZOHO_CLIENT_ID &&
    ZOHO_CLIENT_SECRET &&
    ZOHO_REDIRECT_URI &&
    process.env.ZOHO_REFRESH_TOKEN
  )
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(code: string): Promise<ZohoTokenResponse> {
  try {
    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
      redirect_uri: ZOHO_REDIRECT_URI!,
    })

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to exchange auth code: ${error}`)
    }

    const data: ZohoTokenResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error exchanging auth code:', error)
    throw error
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
  try {
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
    })

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to refresh token: ${error}`)
    }

    const data: ZohoTokenResponse = await response.json()

    // Cache the new access token
    cachedAccessToken = data.access_token
    // Tokens expire in 1 hour, cache for 55 minutes to be safe
    tokenExpiresAt = Date.now() + 55 * 60 * 1000

    return data.access_token
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

/**
 * Get a valid access token (cached or refreshed)
 */
async function getValidAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedAccessToken
  }

  // Otherwise, refresh the token
  return await refreshAccessToken()
}

/**
 * Get Zoho Mail account ID
 */
export async function getZohoAccountId(): Promise<string> {
  try {
    // If account ID is in env, use it
    if (ZOHO_ACCOUNT_ID) {
      return ZOHO_ACCOUNT_ID
    }

    // Otherwise, fetch it from API
    const accessToken = await getValidAccessToken()

    const response = await fetch('https://mail.zoho.com/api/accounts', {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch accounts: ${error}`)
    }

    const data: ZohoAccountsResponse = await response.json()

    if (!data.data || data.data.length === 0) {
      throw new Error('No Zoho Mail accounts found')
    }

    // Return the first account ID
    return data.data[0].accountId
  } catch (error) {
    console.error('Error getting Zoho account ID:', error)
    throw error
  }
}

/**
 * Get the Sent folder ID for a Zoho Mail account
 */
async function getSentFolderId(accountId: string, accessToken: string): Promise<string> {
  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/folders`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch folders: ${error}`)
    }

    const data = await response.json()

    // Find the Sent folder (usually has folderName "Sent")
    const sentFolder = data.data.find(
      (folder: ZohoFolder) =>
        folder.folderName === 'Sent' || folder.folderName === 'Sent Items'
    )

    if (!sentFolder) {
      throw new Error('Sent folder not found')
    }

    return sentFolder.folderId
  } catch (error) {
    console.error('Error getting sent folder ID:', error)
    throw error
  }
}

/**
 * Fetch sent emails from Zoho Mail using search API
 */
export async function fetchSentEmails(
  limit: number = 50
): Promise<ZohoEmailContent[]> {
  try {
    if (!(await isZohoConfigured())) {
      console.warn('Zoho Mail API is not configured')
      return []
    }

    const accessToken = await getValidAccessToken()
    const accountId = await getZohoAccountId()

    // Use search API to find sent emails
    const searchResponse = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=in:sent&limit=${limit}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      const error = await searchResponse.text()
      throw new Error(`Failed to search sent emails: ${error}`)
    }

    const searchData: ZohoMessagesResponse = await searchResponse.json()

    if (!searchData.data || searchData.data.length === 0) {
      return []
    }

    // Fetch full HTML content for each email and merge with summary data
    const emailPromises = searchData.data.map(async (email) => {
      try {
        const contentUrl = `https://mail.zoho.com/api/accounts/${accountId}/folders/${email.folderId}/messages/${email.messageId}/content`

        const contentResponse = await fetch(contentUrl, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        })

        if (!contentResponse.ok) {
          console.error(
            `Failed to fetch email ${email.messageId}:`,
            await contentResponse.text()
          )
          return null
        }

        const contentData = await contentResponse.json()

        // Merge summary data with content
        const mergedEmail: ZohoEmailContent = {
          messageId: email.messageId,
          subject: email.subject,
          fromAddress: cleanEmailAddress(email.fromAddress),
          toAddress: cleanEmailAddress(email.toAddress),
          ccAddress: email.ccAddress ? cleanEmailAddress(email.ccAddress) : undefined,
          time: email.time || email.receivedTime || Date.now(),
          hasAttachment: email.hasAttachment,
          content: contentData.data?.content || '',
          summary: email.summary || '',
          attachments: [],
        }

        return mergedEmail
      } catch (error) {
        console.error(`Error fetching email ${email.messageId}:`, error)
        return null
      }
    })

    const emails = await Promise.all(emailPromises)

    // Filter out null values (failed fetches)
    return emails.filter((email): email is ZohoEmailContent => email !== null)
  } catch (error) {
    console.error('Error fetching sent emails:', error)
    return []
  }
}

/**
 * Fetch email thread with a specific email address (both sent and received)
 */
export async function fetchEmailThread(
  emailAddress: string,
  limit: number = 50
): Promise<ZohoEmailContent[]> {
  try {
    if (!(await isZohoConfigured())) {
      console.warn('Zoho Mail API is not configured')
      return []
    }

    const accessToken = await getValidAccessToken()
    const accountId = await getZohoAccountId()

    console.log(`[Zoho] Searching for email thread with: ${emailAddress}`)

    // Zoho doesn't support OR operator, so we need to make two separate searches
    // 1. Search for emails sent TO this address
    const toQuery = `to:${emailAddress}`
    const toUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(toQuery)}&limit=${limit}`

    console.log(`[Zoho] Search 1 - Sent emails: "${toQuery}"`)

    const toResponse = await fetch(toUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    let sentEmails: ZohoEmailSummary[] = []
    if (toResponse.ok) {
      const toData: ZohoMessagesResponse = await toResponse.json()
      sentEmails = toData.data || []
      console.log(`[Zoho] Found ${sentEmails.length} sent emails`)
    } else {
      console.error(`[Zoho] Search failed for sent emails:`, await toResponse.text())
    }

    // 2. Search for emails received FROM this address
    const fromQuery = `from:${emailAddress}`
    const fromUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(fromQuery)}&limit=${limit}`

    console.log(`[Zoho] Search 2 - Received emails: "${fromQuery}"`)

    const fromResponse = await fetch(fromUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    })

    let receivedEmails: ZohoEmailSummary[] = []
    if (fromResponse.ok) {
      const fromData: ZohoMessagesResponse = await fromResponse.json()
      receivedEmails = fromData.data || []
      console.log(`[Zoho] Found ${receivedEmails.length} received emails`)
    } else {
      console.error(`[Zoho] Search failed for received emails:`, await fromResponse.text())
    }

    // Combine and deduplicate by messageId
    const emailMap = new Map<string, ZohoEmailSummary>()

    for (const email of [...sentEmails, ...receivedEmails]) {
      if (!emailMap.has(email.messageId)) {
        emailMap.set(email.messageId, email)
      }
    }

    const allEmails = Array.from(emailMap.values())
    console.log(`[Zoho] Total unique emails: ${allEmails.length}`)

    if (allEmails.length === 0) {
      console.log(`[Zoho] No emails found for ${emailAddress}`)
      return []
    }

    // Fetch full HTML content for each email and merge with summary data
    const emailPromises = allEmails.map(async (email) => {
      try {
        // Zoho requires folderId in the URL path
        const contentUrl = `https://mail.zoho.com/api/accounts/${accountId}/folders/${email.folderId}/messages/${email.messageId}/content`

        console.log(`[Zoho] Fetching content for message ${email.messageId} from folder ${email.folderId}`)

        const contentResponse = await fetch(contentUrl, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        })

        if (!contentResponse.ok) {
          console.error(
            `[Zoho] Failed to fetch email ${email.messageId}:`,
            await contentResponse.text()
          )
          return null
        }

        const contentData = await contentResponse.json()

        // Merge summary data with content data
        // Summary has: subject, fromAddress, toAddress, time, etc.
        // Content endpoint only returns: messageId and content (HTML)
        const mergedEmail: ZohoEmailContent = {
          messageId: email.messageId,
          subject: email.subject,
          fromAddress: cleanEmailAddress(email.fromAddress),
          toAddress: cleanEmailAddress(email.toAddress),
          ccAddress: email.ccAddress ? cleanEmailAddress(email.ccAddress) : undefined,
          time: email.time || email.receivedTime || Date.now(),
          hasAttachment: email.hasAttachment,
          content: contentData.data?.content || '',
          summary: email.summary || '',
          attachments: [],
        }

        return mergedEmail
      } catch (error) {
        console.error(`[Zoho] Error fetching email ${email.messageId}:`, error)
        return null
      }
    })

    const emails = await Promise.all(emailPromises)

    // Filter out null values and sort chronologically (newest first)
    const filteredEmails = emails
      .filter((email): email is ZohoEmailContent => email !== null)
      .sort((a, b) => b.time - a.time)

    console.log(`[Zoho] Successfully fetched ${filteredEmails.length} complete emails`)
    return filteredEmails
  } catch (error) {
    console.error('[Zoho] Error fetching email thread:', error)
    return []
  }
}

/**
 * Generate OAuth authorization URL
 */
export async function getAuthorizationUrl(): Promise<string> {
  if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
    throw new Error('Zoho Client ID and Redirect URI must be configured')
  }

  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    response_type: 'code',
    redirect_uri: ZOHO_REDIRECT_URI,
    scope: 'ZohoMail.messages.READ,ZohoMail.accounts.READ,ZohoMail.folders.READ',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`
}
