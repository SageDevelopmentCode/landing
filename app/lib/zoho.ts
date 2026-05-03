"use server";

import { createServerSupabaseClient } from "./supabase-server";

// Zoho API Types
interface ZohoTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  api_domain: string;
  token_type: string;
}

interface ZohoAccount {
  accountId: string;
  accountName: string;
  primaryEmailAddress: string;
}

interface ZohoAccountsResponse {
  status: {
    code: number;
    description: string;
  };
  data: ZohoAccount[];
}

interface ZohoFolder {
  folderId: string;
  folderName: string;
}

interface ZohoEmailSummary {
  messageId: string;
  subject: string;
  fromAddress: string;
  toAddress: string;
  ccAddress?: string;
  time: number;
  hasAttachment: boolean;
  priority: number;
  size: number;
  folderId: string;
  summary?: string;
  receivedTime?: number;
}

interface ZohoEmailContent {
  messageId: string;
  fromAddress: string;
  toAddress: string;
  ccAddress?: string;
  bccAddress?: string;
  subject: string;
  content: string;
  summary: string;
  time: number;
  hasAttachment: boolean;
  attachments?: Array<{
    attachmentName: string;
    attachmentSize: number;
    attachmentPath: string;
  }>;
}

interface ZohoMessagesResponse {
  status: {
    code: number;
    description: string;
  };
  data: ZohoEmailSummary[];
}

interface ZohoMessageContentResponse {
  status: {
    code: number;
    description: string;
  };
  data: ZohoEmailContent;
}

// Environment variables
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID;

/**
 * Decode HTML entities and extract email address from formatted string
 * Example: "&quot;Name&quot;&lt;email@domain.com&gt;" => "email@domain.com"
 */
function cleanEmailAddress(rawEmail: string): string {
  if (!rawEmail) return "";

  // Decode HTML entities
  const cleaned = rawEmail
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  // Extract email from "Name"<email@domain.com> format
  const emailMatch = cleaned.match(/<([^>]+)>/);
  if (emailMatch) {
    return emailMatch[1];
  }

  // If no angle brackets, return as is (after HTML decode)
  return cleaned.replace(/"/g, "").trim();
}

// In-memory token cache (will be refreshed as needed)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number | null = null;

/**
 * Check if Zoho Mail API is configured
 */
export async function isZohoConfigured(): Promise<boolean> {
  return !!(
    ZOHO_CLIENT_ID &&
    ZOHO_CLIENT_SECRET &&
    ZOHO_REDIRECT_URI &&
    process.env.ZOHO_REFRESH_TOKEN
  );
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeAuthCode(
  code: string,
): Promise<ZohoTokenResponse> {
  try {
    const params = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
      redirect_uri: ZOHO_REDIRECT_URI!,
    });

    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange auth code: ${error}`);
    }

    const data: ZohoTokenResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error exchanging auth code:", error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
  try {
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: ZOHO_CLIENT_ID!,
      client_secret: ZOHO_CLIENT_SECRET!,
    });

    const response = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data: ZohoTokenResponse = await response.json();

    // Cache the new access token
    cachedAccessToken = data.access_token;
    // Tokens expire in 1 hour, cache for 55 minutes to be safe
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;

    return data.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

/**
 * Get a valid access token (cached or refreshed)
 */
async function getValidAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  // Otherwise, refresh the token
  return await refreshAccessToken();
}

/**
 * Get Zoho Mail account ID
 */
export async function getZohoAccountId(): Promise<string> {
  try {
    // If account ID is in env, use it
    if (ZOHO_ACCOUNT_ID) {
      return ZOHO_ACCOUNT_ID;
    }

    // Otherwise, fetch it from API
    const accessToken = await getValidAccessToken();

    const response = await fetch("https://mail.zoho.com/api/accounts", {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch accounts: ${error}`);
    }

    const data: ZohoAccountsResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No Zoho Mail accounts found");
    }

    // Return the first account ID
    return data.data[0].accountId;
  } catch (error) {
    console.error("Error getting Zoho account ID:", error);
    throw error;
  }
}

/**
 * Get the Sent folder ID for a Zoho Mail account
 */
async function getSentFolderId(
  accountId: string,
  accessToken: string,
): Promise<string> {
  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/folders`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch folders: ${error}`);
    }

    const data = await response.json();

    // Find the Sent folder (usually has folderName "Sent")
    const sentFolder = data.data.find(
      (folder: ZohoFolder) =>
        folder.folderName === "Sent" || folder.folderName === "Sent Items",
    );

    if (!sentFolder) {
      throw new Error("Sent folder not found");
    }

    return sentFolder.folderId;
  } catch (error) {
    console.error("Error getting sent folder ID:", error);
    throw error;
  }
}

/**
 * Fetch sent emails from Zoho Mail using search API
 */
export async function fetchSentEmails(
  limit: number = 50,
): Promise<ZohoEmailContent[]> {
  try {
    if (!(await isZohoConfigured())) {
      console.warn("Zoho Mail API is not configured");
      return [];
    }

    const accessToken = await getValidAccessToken();
    const accountId = await getZohoAccountId();

    // Use search API to find sent emails
    const searchResponse = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=in:sent&limit=${limit}`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      },
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      throw new Error(`Failed to search sent emails: ${error}`);
    }

    const searchData: ZohoMessagesResponse = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return [];
    }

    // Fetch full HTML content for each email and merge with summary data
    const emailPromises = searchData.data.map(async (email) => {
      try {
        const contentUrl = `https://mail.zoho.com/api/accounts/${accountId}/folders/${email.folderId}/messages/${email.messageId}/content`;

        const contentResponse = await fetch(contentUrl, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (!contentResponse.ok) {
          console.error(
            `Failed to fetch email ${email.messageId}:`,
            await contentResponse.text(),
          );
          return null;
        }

        const contentData = await contentResponse.json();

        // Merge summary data with content
        const mergedEmail: ZohoEmailContent = {
          messageId: email.messageId,
          subject: email.subject,
          fromAddress: cleanEmailAddress(email.fromAddress),
          toAddress: cleanEmailAddress(email.toAddress),
          ccAddress: email.ccAddress
            ? cleanEmailAddress(email.ccAddress)
            : undefined,
          time: email.time || email.receivedTime || Date.now(),
          hasAttachment: email.hasAttachment,
          content: contentData.data?.content || "",
          summary: email.summary || "",
          attachments: [],
        };

        return mergedEmail;
      } catch (error) {
        console.error(`Error fetching email ${email.messageId}:`, error);
        return null;
      }
    });

    const emails = await Promise.all(emailPromises);

    // Filter out null values (failed fetches)
    return emails.filter((email): email is ZohoEmailContent => email !== null);
  } catch (error) {
    console.error("Error fetching sent emails:", error);
    return [];
  }
}

/**
 * Fetch email thread with a specific email address (both sent and received)
 */
export async function fetchEmailThread(
  emailAddress: string,
  limit: number = 50,
): Promise<ZohoEmailContent[]> {
  try {
    if (!(await isZohoConfigured())) {
      console.warn("Zoho Mail API is not configured");
      return [];
    }

    const accessToken = await getValidAccessToken();
    const accountId = await getZohoAccountId();

    console.log(`[Zoho] Searching for email thread with: ${emailAddress}`);

    // Zoho doesn't support OR operator, so we need to make two separate searches
    // 1. Search for emails sent TO this address
    const toQuery = `to:${emailAddress}`;
    const toUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(toQuery)}&limit=${limit}`;

    console.log(`[Zoho] Search 1 - Sent emails: "${toQuery}"`);

    const toResponse = await fetch(toUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    let sentEmails: ZohoEmailSummary[] = [];
    if (toResponse.ok) {
      const toData: ZohoMessagesResponse = await toResponse.json();
      sentEmails = toData.data || [];
      console.log(`[Zoho] Found ${sentEmails.length} sent emails`);
    } else {
      console.error(
        `[Zoho] Search failed for sent emails:`,
        await toResponse.text(),
      );
    }

    // 2. Search for emails received FROM this address
    const fromQuery = `from:${emailAddress}`;
    const fromUrl = `https://mail.zoho.com/api/accounts/${accountId}/messages/search?searchKey=${encodeURIComponent(fromQuery)}&limit=${limit}`;

    console.log(`[Zoho] Search 2 - Received emails: "${fromQuery}"`);

    const fromResponse = await fetch(fromUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });

    let receivedEmails: ZohoEmailSummary[] = [];
    if (fromResponse.ok) {
      const fromData: ZohoMessagesResponse = await fromResponse.json();
      receivedEmails = fromData.data || [];
      console.log(`[Zoho] Found ${receivedEmails.length} received emails`);
    } else {
      console.error(
        `[Zoho] Search failed for received emails:`,
        await fromResponse.text(),
      );
    }

    // Combine and deduplicate by messageId
    const emailMap = new Map<string, ZohoEmailSummary>();

    for (const email of [...sentEmails, ...receivedEmails]) {
      if (!emailMap.has(email.messageId)) {
        emailMap.set(email.messageId, email);
      }
    }

    const allEmails = Array.from(emailMap.values());
    console.log(`[Zoho] Total unique emails: ${allEmails.length}`);

    if (allEmails.length === 0) {
      console.log(`[Zoho] No emails found for ${emailAddress}`);
      return [];
    }

    // Fetch full HTML content for each email and merge with summary data
    const emailPromises = allEmails.map(async (email) => {
      try {
        // Zoho requires folderId in the URL path
        const contentUrl = `https://mail.zoho.com/api/accounts/${accountId}/folders/${email.folderId}/messages/${email.messageId}/content`;

        console.log(
          `[Zoho] Fetching content for message ${email.messageId} from folder ${email.folderId}`,
        );

        const contentResponse = await fetch(contentUrl, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        });

        if (!contentResponse.ok) {
          console.error(
            `[Zoho] Failed to fetch email ${email.messageId}:`,
            await contentResponse.text(),
          );
          return null;
        }

        const contentData = await contentResponse.json();

        // Merge summary data with content data
        // Summary has: subject, fromAddress, toAddress, time, etc.
        // Content endpoint only returns: messageId and content (HTML)
        const mergedEmail: ZohoEmailContent = {
          messageId: email.messageId,
          subject: email.subject,
          fromAddress: cleanEmailAddress(email.fromAddress),
          toAddress: cleanEmailAddress(email.toAddress),
          ccAddress: email.ccAddress
            ? cleanEmailAddress(email.ccAddress)
            : undefined,
          time: email.time || email.receivedTime || Date.now(),
          hasAttachment: email.hasAttachment,
          content: contentData.data?.content || "",
          summary: email.summary || "",
          attachments: [],
        };

        return mergedEmail;
      } catch (error) {
        console.error(`[Zoho] Error fetching email ${email.messageId}:`, error);
        return null;
      }
    });

    const emails = await Promise.all(emailPromises);

    // Filter out null values and sort chronologically (newest first)
    const filteredEmails = emails
      .filter((email): email is ZohoEmailContent => email !== null)
      .sort((a, b) => b.time - a.time);

    console.log(
      `[Zoho] Successfully fetched ${filteredEmails.length} complete emails`,
    );
    return filteredEmails;
  } catch (error) {
    console.error("[Zoho] Error fetching email thread:", error);
    return [];
  }
}

/**
 * Build HTML thank-you email for a completed donation
 */
export async function buildDonationConfirmationEmail(opts: {
  donorName?: string;
  donorEmail: string;
  amountDollars: string;
  message?: string;
}): Promise<{ subject: string; content: string }> {
  const displayName = opts.donorName || "Friend";
  const subject = "Thank You for Supporting Sage Field!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${displayName},</p>

  <p>Thank you so much for your generous donation of <strong>$${opts.amountDollars}</strong> to Sage Field Private School. Your support means the world to us and brings our dream one meaningful step closer to reality.</p>

${opts.message ? `  <p style="padding: 12px 16px; background: #f7f4f0; border-left: 3px solid #a8c5a0; margin: 24px 0; font-style: italic;">"${opts.message}"</p>` : ""}

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">Our Vision</h2>
  <p>At Sage Field, we believe that children learn best when they are connected to the living world. Our farm property will become an extension of the classroom — a place where kids can dig, plant, care for animals, and discover the rhythms of nature through direct, unhurried experience. From raised garden beds to a chicken coop and an aquatic pond, every element of our farm is designed to spark curiosity, build responsibility, and cultivate a deep love for the natural world.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">How Your Gift Will Be Used</h2>
  <p>We are working toward a <strong>$10,000 goal</strong> to transform our Central Texas property into a thriving outdoor learning environment. Here is how every dollar is being put to work:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Raised Garden Beds</td>
      <td style="padding: 10px 12px; text-align: right;">$2,000</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">Children plant, tend, and harvest their own vegetables and herbs — learning nutrition and life cycles hands-on.</td>
      <td></td>
    </tr>
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Chicken Coop</td>
      <td style="padding: 10px 12px; text-align: right;">$2,000</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">A small flock of chickens gives children daily responsibility, empathy, and a connection to where food comes from.</td>
      <td></td>
    </tr>
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Pond &amp; Aquatic Area</td>
      <td style="padding: 10px 12px; text-align: right;">$1,500</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">A small pond with native plants and aquatic life creates a living science lab right in our backyard.</td>
      <td></td>
    </tr>
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Farm Infrastructure</td>
      <td style="padding: 10px 12px; text-align: right;">$1,500</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">Fencing, pathways, and safety structures to make the entire farm property safe and fully accessible.</td>
      <td></td>
    </tr>
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Mud Kitchen</td>
      <td style="padding: 10px 12px; text-align: right;">$700</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">An outdoor mud kitchen sparks imaginative play and sensory exploration — a Montessori staple in nature education.</td>
      <td></td>
    </tr>
    <tr style="background: #f7f4f0;">
      <td style="padding: 10px 12px; font-weight: bold;">Misc. Improvements</td>
      <td style="padding: 10px 12px; text-align: right;">$2,300</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; color: #555;">Shade structures, tool storage, signage, and finishing touches to make the space fully functional and beautiful.</td>
      <td></td>
    </tr>
    <tr style="border-top: 2px solid #2c2c2c;">
      <td style="padding: 12px; font-weight: bold;">Total Goal</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">$10,000</td>
    </tr>
  </table>

  <p>Your contribution — no matter the size — is a real, tangible investment in the children of Central Texas and the kind of education we believe every child deserves.</p>

  <p>If you have any questions or would like to stay connected with our journey, please don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With deep gratitude,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a completed application
 */
export async function buildApplicationConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  const subject = "Your Sage Field Application Has Been Received";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>Thank you for submitting your application for <strong>${opts.childLegalName}</strong>${opts.program ? ` to the <strong>${opts.program}</strong> program` : ""} at Sage Field School. We are delighted to have received it.</p>

  <p>Our team will carefully review your application and reach out to you within <strong>3–5 business days</strong> to discuss next steps.</p>

  <p>In the meantime, if you have any questions or would like to share anything additional, please don't hesitate to reach out to us directly at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a paid registration fee
 */
export async function buildRegistrationFeeConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string;
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Registration Fee Received — Welcome to Sage Field!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are thrilled to confirm that your registration fee of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong> in the <strong>${opts.program}</strong> program at Sage Field School.</p>

  <p>Your child's spot is now secured and we cannot wait to welcome them. Our team will be in touch soon with more details about what to expect next.</p>

  <p>If you have any questions in the meantime, please don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With excitement,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();
  return { subject, content };
}

/**
 * Build HTML confirmation email for a paid summer tuition
 */
export async function buildSummerTuitionConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  planType: "weekly" | "full";
  amountDollars: string;
  weeks?: number[];
}): Promise<{ subject: string; content: string }> {
  const subject = "Summer 2026 Tuition Received — See You This Summer!";
  const planLabel =
    opts.planType === "full"
      ? "Full Summer — all 12 weeks (May 26 – Aug 13, 2026)"
      : `${opts.weeks?.length ?? 0} week${(opts.weeks?.length ?? 0) !== 1 ? "s" : ""}${opts.weeks && opts.weeks.length > 0 ? ` (Weeks ${opts.weeks.join(", ")})` : ""}`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are so excited to confirm that your Summer 2026 tuition payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong>!</p>

  <p><strong>Plan:</strong> ${planLabel}</p>

  <p>Your child's spot is officially secured for summer camp. We can't wait to welcome them for a season full of adventure, learning, and fun at Sage Field.</p>

  <p>If you have any questions in the meantime, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">See you this summer!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a Homeschool Drop-In payment
 */
export async function buildHomeschoolDropInConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string;
  tier: string;
  selectedDays: string[];
  selectedWeeks: number[];
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const PROGRAM_LABELS: Record<string, string> = {
    summer_26: "Summer 2026",
    school_year_26_27: "School Year 2026–2027",
  };
  const TIER_LABELS: Record<string, string> = {
    dropin: "Explorer Day Pass (Drop-In)",
    "2day": "2 Days / Week",
    "3day": "3 Days / Week",
  };

  const isSummer = opts.program === "summer_26";
  const programLabel = PROGRAM_LABELS[opts.program] ?? opts.program;
  const tierLabel = TIER_LABELS[opts.tier] ?? opts.tier;
  const daysLabel =
    opts.selectedDays.length > 0
      ? opts.selectedDays
          .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
          .join(", ")
      : "";
  const weeksLabel =
    opts.selectedWeeks.length > 0
      ? `${opts.selectedWeeks.length} week${opts.selectedWeeks.length !== 1 ? "s" : ""} (Weeks ${opts.selectedWeeks.join(", ")})`
      : "";

  const planDetail =
    opts.tier === "dropin"
      ? tierLabel
      : `${tierLabel}${daysLabel ? ` — ${daysLabel}` : ""}`;

  const subject = `Homeschool Drop-In Payment Confirmed — ${programLabel}`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are delighted to confirm that your Homeschool Drop-In payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong>!</p>

  <p><strong>Program:</strong> ${programLabel}</p>
  <p><strong>Plan:</strong> ${planDetail}</p>
  ${isSummer && weeksLabel ? `<p><strong>Weeks:</strong> ${weeksLabel}</p>` : ""}
  ${!isSummer ? `<p><strong>Rate:</strong> $${opts.amountDollars}/month</p>` : ""}

  <p>We look forward to welcoming ${opts.childLegalName} to Sage Field. If you have any questions, please don&apos;t hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">See you soon!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML approval email for an approved application
 */
export async function buildApprovalEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  function formatProgram(program: string | null): string | null {
    if (!program) return null;
    if (program === "both") return "Summer 2026 and School Year 2026-2027";
    if (program === "summer_26") return "Summer 2026";
    if (program === "school_year_26_27") return "School Year 2026-2027";
    if (program === "homeschool_drop_in") return "Homeschool Drop-In";
    return program;
  }

  const subject =
    "Your Application Has Been Approved — Next Steps to Complete Enrollment";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are thrilled to let you know that <strong>${opts.childLegalName}</strong>'s application${formatProgram(opts.program) ? ` for the <strong>${formatProgram(opts.program)}</strong> program` : ""} has been <strong>approved</strong>. Welcome to the Sage Field family!</p>

  <p>To complete enrollment, please log in to your parent dashboard and work through the enrollment checklist:</p>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    <strong>Tip:</strong> We highly recommend completing your enrollment on a laptop or desktop computer for the best experience. Some steps (document signing, file uploads) may be difficult on a mobile device.
  </p>

  <p style="margin-bottom: 4px;"><a href="https://www.sagefield.co/parent/dashboard" style="color: #5a7a5a; font-weight: bold;">https://www.sagefield.co/parent/dashboard</a></p>

  <p style="margin-top: 24px;"><strong>Required steps:</strong></p>
  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 8px;"><strong>Program Description, Parent Responsibilities, and Key Policies</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Community Agreement for Families and Staff</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Emergency Contact, Health, and Immunization Form</strong> — complete and sign</li>
    <li style="margin-bottom: 8px;"><strong>Submit Proof of Immunizations</strong> — upload your child's current immunization records</li>
    <li style="margin-bottom: 8px;"><strong>Photo Release Form</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Assumption of Risk and Liability Release</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Health Information Form</strong> — complete and sign</li>
    <li style="margin-bottom: 8px;"><strong>Pay Registration Fee</strong> — submit to secure your child's spot</li>
  </ol>

  <p style="margin-top: 24px;"><strong>Optional steps (if applicable):</strong></p>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;"><strong>Emergency Medication Plan on File</strong> — if your child requires emergency medication at school</li>
    <li style="margin-bottom: 8px;"><strong>Additional Authorized Pickup Person</strong> — if someone other than a guardian will pick up your child</li>
  </ul>

  <p>Please complete all required steps as soon as possible to secure your child's enrollment. If you have any questions, don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With warmth and excitement,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML enrollment reminder email for approved applicants who haven't completed the checklist
 */
export async function buildEnrollmentReminderEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  function formatProgram(program: string | null): string | null {
    if (!program) return null;
    if (program === "both") return "Summer 2026 and School Year 2026-2027";
    if (program === "summer_26") return "Summer 2026";
    if (program === "school_year_26_27") return "School Year 2026-2027";
    if (program === "homeschool_drop_in") return "Homeschool Drop-In";
    return program;
  }

  const subject = `A reminder to complete ${opts.childLegalName}'s enrollment at Sage Field`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>Just a friendly reminder that <strong>${opts.childLegalName}</strong>'s application${formatProgram(opts.program) ? ` for the <strong>${formatProgram(opts.program)}</strong> program` : ""} has been approved — but the enrollment checklist still needs to be completed to secure their spot.</p>

  <p>To continue, log back in to your parent dashboard:</p>

  <p style="margin-bottom: 4px;"><a href="https://www.sagefield.co/parent/dashboard" style="color: #5a7a5a; font-weight: bold;">https://www.sagefield.co/parent/dashboard</a></p>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    <strong>Tip:</strong> We highly recommend completing your enrollment on a laptop or desktop computer for the best experience. Some steps (document signing, file uploads) may be difficult on a mobile device.
  </p>

  <p style="margin-top: 24px;"><strong>Required steps:</strong></p>
  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 8px;"><strong>Program Description, Parent Responsibilities, and Key Policies</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Community Agreement for Families and Staff</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Emergency Contact, Health, and Immunization Form</strong> — complete and sign</li>
    <li style="margin-bottom: 8px;"><strong>Submit Proof of Immunizations</strong> — upload your child's current immunization records</li>
    <li style="margin-bottom: 8px;"><strong>Photo Release Form</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Assumption of Risk and Liability Release</strong> — review and sign</li>
    <li style="margin-bottom: 8px;"><strong>Health Information Form</strong> — complete and sign</li>
    <li style="margin-bottom: 8px;"><strong>Pay Registration Fee</strong> — submit to secure your child's spot</li>
  </ol>

  <p style="margin-top: 24px;"><strong>Optional steps (if applicable):</strong></p>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;"><strong>Emergency Medication Plan on File</strong> — if your child requires emergency medication at school</li>
    <li style="margin-bottom: 8px;"><strong>Additional Authorized Pickup Person</strong> — if someone other than a guardian will pick up your child</li>
  </ul>

  <p>Please complete all required steps as soon as possible to secure your child's enrollment. If you have any questions, don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a completed enrollment
 */
export async function buildEnrollmentConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  function formatProgram(program: string | null): string | null {
    if (!program) return null;
    if (program === "both") return "Summer 2026 and School Year 2026-2027";
    if (program === "summer_26") return "Summer 2026";
    if (program === "school_year_26_27") return "School Year 2026-2027";
    if (program === "homeschool_drop_in") return "Homeschool Drop-In";
    return program;
  }

  const programLabel = formatProgram(opts.program);
  const subject = `${opts.childLegalName} is enrolled at Sage Field!`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are so glad to have <strong>${opts.childLegalName}</strong> joining us${programLabel ? ` for the <strong>${programLabel}</strong> program` : ""}. Their enrollment is complete and their spot is secured — welcome to the Sage Field family.</p>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    <strong>Enrollment complete</strong> — ${opts.childLegalName} is officially enrolled${programLabel ? ` in the <strong>${programLabel}</strong> program` : ""} at Sage Field School.
  </p>

  <p style="margin-top: 24px;"><strong>What's coming next:</strong></p>
  <ol style="padding-left: 20px;">
    <li style="margin-bottom: 12px;">
      <strong>Tuition</strong> — We will be reaching out soon with tuition details and payment information. Keep an eye on your inbox.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Parent Dashboard</strong> — Your parent dashboard at <a href="https://www.sagefield.co/parent/dashboard" style="color: #5a7a5a; font-weight: bold;">sagefield.co/parent/dashboard</a> is your central hub. Bookmark it — we will use it to share updates, documents, and important information throughout the year.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Sage Field Mobile App</strong> — We have a mobile app in the works that will make staying connected even easier. We will let you know as soon as it is available.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Preparing for the Program</strong> — Closer to the start date, we will send a detailed guide on what to expect, what to bring, and how to prepare ${opts.childLegalName} for their first day.
    </li>
  </ol>

  <p>In the meantime, if you have any questions at all, please don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>. We are always happy to help.</p>

  <p>We cannot wait to see ${opts.childLegalName} thrive at Sage Field.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for an Open House RSVP
 */
export async function buildRSVPConfirmationEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0] || opts.name;
  const subject = "You're on the list — Sage Field Open House, April 25";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>You're registered for our Sage Field Open House — we're so glad you'll be joining us. This is a wonderful chance to see the space, meet our educators, and get a feel for what learning at Sage Field really looks like.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Event Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> Saturday, April 25, 2026</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> 2:00 PM – 4:00 PM</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> <a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">What to Expect</h2>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">Tour our outdoor learning space and farm property</li>
    <li style="margin-bottom: 8px;">Meet Sabrina and our educators in person</li>
    <li style="margin-bottom: 8px;">See our curriculum and outdoor-based approach in action</li>
    <li style="margin-bottom: 8px;">Connect with other families exploring Sage Field</li>
    <li style="margin-bottom: 8px;">Learn about enrollment for Summer 2026 &amp; School Year 2026–2027</li>
  </ul>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 16px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu, ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">An immersive summer of outdoor-based learning — gardening, animal care, outdoor exploration, and hands-on projects in a small, intentional community.</p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year outdoor-based education. We blend Montessori, Waldorf, and Reggio Emilia approaches with TEKS-aligned academics, so learning stays both meaningful, intentional, and grounded — with flexible scheduling for families.</p>
  </div>

  <p style="text-align: center; margin: 32px 0;">
    <a href="https://www.sagefield.co/apply" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">Apply for a Program</a>
  </p>

  <p>We look forward to meeting you and your family on April 25. If you have any questions before then, don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a waitlist / interest form submission
 */
export async function buildWaitlistConfirmationEmail(opts: {
  parentName: string;
  programInterest: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;

  const programLabels: Record<string, string> = {
    "summer-2026": "Summer 2026",
    "school-year-2026": "School Year 2026–2027",
    both: "Summer 2026 &amp; School Year 2026–2027",
    homeschool_drop_in: "Homeschool Drop-In",
  };

  const programDetails: Record<string, string> = {
    "summer-2026":
      "May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu, ~6 hrs/day &nbsp;·&nbsp; Group of ~10",
    "school-year-2026":
      "Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment",
    both: "Summer 2026 (May 26–Aug 13) + School Year 2026–2027 (starts Aug 17)",
    homeschool_drop_in:
      "1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays Are Field Days &nbsp;·&nbsp; Group of ~10",
  };

  const selectedLabel =
    programLabels[opts.programInterest] || opts.programInterest;
  const selectedDetails = programDetails[opts.programInterest] || "";

  const subject = "We received your interest form — Sage Field School";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>Thank you for submitting your interest form for Sage Field School! We're so glad you reached out, and we look forward to connecting with you soon.</p>

  <p>We'll be in touch shortly to learn more about your family and answer any questions you have.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Your Program Interest</p>
    <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold; color: #5a7a5a;">${selectedLabel}</p>
    ${selectedDetails ? `<p style="margin: 4px 0; color: #555; font-size: 14px;">${selectedDetails}</p>` : ""}
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu, ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, music, and academic enrichment in a small, nurturing group setting.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year microschool experience blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics — in a small, nature-connected environment.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays Are Field Days</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible enriching support for homeschooling families — choose 1 to 5 days per week with ability-based grouping and all enrichments included every day.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 8px; color: #2c2c2c;">How We Learn</h2>
  <p style="font-size: 14px; margin-bottom: 8px;">Sage Field integrates elements of <strong>Montessori</strong>, <strong>Waldorf</strong>, and <strong>Reggio Emilia</strong> methods with <strong>TEKS-aligned academics</strong>. We enrich every day with social-emotional education, arts, music, movement, and creative problem-solving — all in a small outdoor setting where children feel seen and supported.</p>
  <p style="font-size: 14px;">We value emotional regulation for both students and educators. A calm, connected teacher creates a community where children truly thrive.</p>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Join Us at Our Open House</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Saturday, April 25, 2026 &nbsp;·&nbsp; 2:00 PM – 4:00 PM</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">2760 Gattis School Rd, Round Rock, TX 78664</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Come tour the space, meet Sabrina and our educators, and see the outdoor learning environment in person. It's a wonderful chance to get a real feel for what Sage Field is all about.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/rsvp" style="color: #5a7a5a; font-weight: bold;">RSVP for the Open House →</a></p>
  </div>

  <p style="margin-top: 8px; font-size: 14px;">Ready to take the next step? <a href="https://www.sagefield.co/apply" style="color: #5a7a5a; font-weight: bold;">Start your application →</a></p>

  <p>If you have any questions in the meantime, don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML outreach email for a Facebook lead (name, email, phone only — no child info)
 */
export async function buildFacebookLeadEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0] || opts.name;

  const subject = "Thank you for your interest in Sage Field!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>Thank you so much for your interest in Sage Field! We're thrilled you reached out and would love to share more about what we offer. Below you'll find everything you need to get a feel for our school — our programs, our approach to learning, and how to connect with us.</p>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu, ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, music, and academic enrichment in a small, nurturing group setting.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year microschool experience blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics — in a small, nature-connected environment.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays Are Field Days</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible enriching support for homeschooling families — choose 1 to 5 days per week with ability-based grouping and all enrichments included every day.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 8px; color: #2c2c2c;">How We Learn</h2>
  <p style="font-size: 14px; margin-bottom: 8px;">Sage Field integrates elements of <strong>Montessori</strong>, <strong>Waldorf</strong>, and <strong>Reggio Emilia</strong> methods with <strong>TEKS-aligned academics</strong>. We enrich every day with social-emotional education, arts, music, movement, and creative problem-solving — all in a small outdoor setting where children feel seen and supported.</p>
  <p style="font-size: 14px; margin-bottom: 8px;">We value emotional regulation for both students and educators. A calm, connected teacher creates a community where children truly thrive.</p>
  <p style="font-size: 14px;"><a href="https://www.sagefield.co/about" style="color: #5a7a5a;">Learn more about our philosophy →</a></p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Join Us at Our Open House</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Saturday, April 25, 2026 &nbsp;·&nbsp; 2:00 PM – 4:00 PM</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">2760 Gattis School Rd, Round Rock, TX 78664</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Come tour the space, meet Sabrina and our educators, and see the outdoor learning environment in person. It's a wonderful chance to get a real feel for what Sage Field is all about.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/rsvp" style="color: #5a7a5a; font-weight: bold;">RSVP for the Open House →</a></p>
  </div>

  <p style="margin-top: 8px; font-size: 14px;">Ready to take the next step? <a href="https://www.sagefield.co/apply" style="color: #5a7a5a; font-weight: bold;">Start your application →</a></p>

  <p>If you have any questions, we'd love to hear from you — reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or call/text us at <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>. We're happy to chat!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br /><a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a> — call or text</p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML follow-up email for families who enrolled during the Open House
 */
export async function buildOpenHouseEnrollmentEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  const PROGRAM_LABELS: Record<string, { label: string; details: string }> = {
    summer_26: {
      label: "Summer 2026",
      details:
        "May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu, ~6 hrs/day",
    },
    school_year_26_27: {
      label: "School Year 2026–2027",
      details:
        "Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week",
    },
    both: {
      label: "Summer 2026 &amp; School Year 2026–2027",
      details: "Both programs — Summer and the full school year",
    },
    homeschool_drop_in: {
      label: "Homeschool Drop-In",
      details:
        "1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays Are Field Days",
    },
  };

  const programInfo = opts.program ? PROGRAM_LABELS[opts.program] : null;
  const subject = "You're Enrolled at Sage Field — Here's What's Next";

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>What a wonderful day at the Open House! We are so thrilled that you enrolled <strong>${opts.childLegalName}</strong> at Sage Field — it means the world to us to have your family join our community.</p>

  <p>Your registration fee has been received, and your spot is officially secured. Here is a quick summary of where things stand:</p>

  ${
    programInfo
      ? `
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Your Enrolled Program</p>
    <p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #5a7a5a;">${programInfo.label}</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">${programInfo.details}</p>
  </div>
  `
      : ""
  }

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 8px; color: #2c2c2c;">Continue Your Enrollment Checklist</h2>
  <p>Your next step is to complete the enrollment checklist in your parent dashboard. This includes forms, signatures, and any remaining information we need before the first day.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; font-family: Georgia, serif; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
      Go to Your Dashboard →
    </a>
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 8px; color: #2c2c2c;">Your Open House Bonus 🎉</h2>
  <p>As a thank-you for enrolling on Open House day, <strong>${opts.childLegalName}</strong> has earned <strong>2 free Field Day Fridays</strong>. We will send you a code to redeem them once the tuition portal opens next week — so keep an eye on your inbox!</p>

  <p>If you have any questions in the meantime, please don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With so much excitement,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build urgency email for leads — limited spots + enrollment deadline
 */
export async function buildSummerUrgencyEmail(opts: {
  parentName: string;
  spotsRemaining: number;
  deadlineDate: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;

  const subject = `Only ${opts.spotsRemaining} spot${opts.spotsRemaining === 1 ? "" : "s"} left — Summer enrollment closes ${opts.deadlineDate}`;

  const spotsWord =
    opts.spotsRemaining === 1
      ? "one spot"
      : opts.spotsRemaining === 2
        ? "two spots"
        : opts.spotsRemaining === 3
          ? "three spots"
          : opts.spotsRemaining === 4
            ? "four spots"
            : `${opts.spotsRemaining} spots`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>I wanted to personally reach out as we head into the final stretch of Summer 2026 enrollment at Sage Field. We only have ${spotsWord} left, and I didn't want your family to miss the chance to join us if this has been on your mind.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Summer 2026 — Enrollment Update</p>
    <p style="margin: 4px 0; color: #2c2c2c; font-size: 15px;">Only <strong>${spotsWord} remaining</strong></p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Enrollment closes <strong>${opts.deadlineDate}</strong> — about 2 weeks away</p>
  </div>

  <p>This summer is shaping up to be something really special. We'll spend twelve weeks exploring themes through hands-on projects, outdoor play, art, music, and gentle academic enrichment. Our days are intentionally unhurried and rooted in connection, with each group of about ten to twelve children so each child is truly known and supported.</p>

  <p>Our summer session runs May 26 through August 13, Monday through Thursday. Enrollment will close on ${opts.deadlineDate}, or sooner if those last spots fill.</p>

  <p>If Sage Field feels like it could be a good fit for your child, I would love to welcome you.</p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://www.sagefield.co/apply"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; font-family: Georgia, serif; font-size: 15px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
      Secure Your Spot →
    </a>
  </div>

  <p>And if you have any questions at all, feel free to reply directly to this email or text/call me at <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>. I'm always happy to talk things through.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br /><a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a> — call or text</p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Send an email via Zoho Mail API
 */
export async function sendZohoEmail(opts: {
  toAddress: string;
  subject: string;
  content: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getValidAccessToken();
    const accountId = await getZohoAccountId();

    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress: "sabrina@sagefield.co",
          toAddress: opts.toAddress,
          subject: opts.subject,
          content: opts.content,
          mailFormat: "html",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send Zoho email:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending Zoho email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate OAuth authorization URL
 */
export async function getAuthorizationUrl(): Promise<string> {
  if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
    throw new Error("Zoho Client ID and Redirect URI must be configured");
  }

  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    response_type: "code",
    redirect_uri: ZOHO_REDIRECT_URI,
    scope:
      "ZohoMail.messages.READ,ZohoMail.messages.CREATE,ZohoMail.accounts.READ,ZohoMail.folders.READ",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
}

/**
 * Build HTML confirmation email for a campus tour booking
 */
export async function buildTourConfirmationEmail(opts: {
  firstName: string;
  tourDate: string;
  tourTime: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Your campus tour is confirmed — Sage Field School";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>Thank you for scheduling a campus tour at Sage Field School! We're looking forward to showing you around and answering any questions you have about our programs.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Your Tour Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> ${opts.tourDate}</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> ${opts.tourTime}</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> <a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>
    <p style="margin: 4px 0;"><strong>Duration:</strong> Approximately 45 minutes</p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">What to Expect</h2>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">A private, one-on-one family tour of our campus</li>
    <li style="margin-bottom: 8px;">Walk through our outdoor learning spaces and classrooms</li>
    <li style="margin-bottom: 8px;">Meet Sabrina and our educators</li>
    <li style="margin-bottom: 8px;">See our curriculum and day-to-day rhythm in action</li>
    <li style="margin-bottom: 8px;">Learn about enrollment for Summer 2026 &amp; School Year 2026–2027</li>
  </ul>

  <p>We'll be in touch to confirm the details closer to your visit. In the meantime, if you have any questions, feel free to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildOpenHouseReminderEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0] || opts.name;
  const subject = "See you in two weeks! Sage Field Open House, April 25th";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>It's just two weeks away! Our Open House is <strong>Saturday, April 25th from 2:00–4:00 PM</strong> at:<br />
  2760 Gattis School Rd, Round Rock, TX 78664</p>

  <p>We are an all weather school! Whether it rains or shines, we will be there enjoying the day!</p>

  <p>We're so excited to meet you! It's going to be a wonderful afternoon and a great chance to see Sage Field in person.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0;">🎉 Anyone who is enrolled for a program by the end of Open House <strong>(April 25, 2026, 11:59pm)</strong> will be given <strong>2 free Field Day Fridays! ($120 value)</strong></p>
  </div>

  <div style="background: #f0f4f7; border-left: 3px solid #a0b8c5; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">A Note on Our Space</p>
    <p style="margin: 0;">We are parting from a different nature school, bringing our same staff and students, but we are so excited that our vision is actively coming to life at our new location! By the time of the Open House, we anticipate being around 75% complete with our building development. Things are progressing beautifully, and we're so grateful for your support as we carefully curate this intentional environment! Thank you so much for growing with us.</p>
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, music, and academic enrichment in a small, nurturing group setting.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year microschool experience blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics, in a small, nature-connected environment.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays are Field Days</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible enriching support for homeschooling families. Choose 1 to 5 days per week with ability-based grouping and all enrichments included every day.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <div style="border: 1px solid #a8c5a0; border-radius: 4px; padding: 20px 24px; margin: 28px 0; text-align: center; background: #f7f4f0;">
    <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 15px;">Ready to enroll?</p>
    <a href="https://www.sagefield.co/apply" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">Apply Here →</a>
  </div>

  <p>We can't wait to see you on April 25! If anything comes up or you have questions before then, feel free to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p>Additionally, we are so thankful for the number of expected guests who have RSVP'd. Please stay tuned as we will send you a separate email about parking.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildOpenHouseTwoDayReminderEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0] || opts.name;
  const subject =
    "This Saturday! Sage Field Open House, April 25th, 2–4 PM + Parking Info";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>We are just one day away! We can't wait to see you <strong>this Saturday, April 25th from 2:00–4:00 PM</strong> at:<br />
  <a href="https://maps.app.goo.gl/qjgRZjberhZMzEBd7" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>

  <p>We're so excited to welcome you this Saturday. It's going to be a wonderful afternoon — a great chance to see Sage Field in person, meet our educators, and get a real feel for what learning here looks like.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0;">🎉 Anyone who is enrolled for a program by the end of Open House <strong>(April 25, 2026, 11:59pm)</strong> will be given <strong>2 free Field Day Fridays! ($120 value)</strong></p>
  </div>

  <div style="background: #f0f4f7; border-left: 3px solid #a0b8c5; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">🅿️ Parking</p>
    <p style="margin: 0;">Please park <strong>across the street</strong> from our school at:<br />
    <a href="https://maps.app.goo.gl/Ga1wv5Cu33PTGyvM8" style="color: #5a7a5a;"><strong>2801 Gattis School Rd, Round Rock, TX 78664</strong></a><br />
    (Aquatic Center parking lot)</p>
  </div>

  <img src="https://www.sagefield.co/assets/parking-map.png" alt="Parking map showing the Aquatic Center lot across from Sage Field School" style="max-width: 100%; border-radius: 4px; margin: 8px 0 28px 0; display: block;" />

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, music, and academic enrichment in a small, nurturing group setting.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year microschool experience blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics, in a small, nature-connected environment.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays are Field Days</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible enriching support for homeschooling families. Choose 1 to 5 days per week with ability-based grouping and all enrichments included every day.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <div style="border: 1px solid #a8c5a0; border-radius: 4px; padding: 20px 24px; margin: 28px 0; text-align: center; background: #f7f4f0;">
    <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 15px;">Ready to enroll?</p>
    <a href="https://www.sagefield.co/apply" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">Apply Here →</a>
  </div>

  <p>We can't wait to see you on Saturday! If anything comes up or you have questions before then, feel free to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildParkingEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0] || opts.name;
  const subject = "Parking Info — Sage Field Open House This Saturday";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p>We are so excited to see you this <strong>Saturday, April 25th from 2:00–4:00 PM</strong> at <a href="https://maps.app.goo.gl/jcivTxav92yRLJSC9" style="color: #5a7a5a;">Sage Field School</a>!</p>

  <p>We wanted to give you a heads-up on parking ahead of the event. Please see the details below:</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">🅿️ Parking Instructions</p>
    <p style="margin: 0;">Please park <strong>across the street</strong> from our school at:<br />
    <a href="https://maps.app.goo.gl/Ga1wv5Cu33PTGyvM8" style="color: #5a7a5a;"><strong>2801 Gattis School Rd, Round Rock, TX 78664</strong></a><br />
    (Aquatic Center parking lot)</p>
  </div>

  <img src="https://www.sagefield.co/assets/parking-map.png" alt="Parking map showing the Aquatic Center lot across from Sage Field School" style="max-width: 100%; border-radius: 4px; margin: 8px 0 28px 0; display: block;" />

  <p>We are an all weather school! Whether it rains or shines, we will be there enjoying the day!</p>

  <p>We recommend kids pack some <strong>boots</strong> to enjoy whatever weather comes our way!</p>

  <p>If you have any questions before Saturday, feel free to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">Can't wait to see you there!</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for an info session RSVP (April 18, 2026 virtual)
 */
export async function buildInfoSessionInviteEmail(opts: {
  name: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.name.split(" ")[0];
  const subject =
    "Sage Field Virtual Parent Info Session — April 18th at 10am CST";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Hi ${firstName},</p>

  <p>As we get closer to our Open House on April 25th, we're hosting a <a href="https://sagefield.co/info" style="color: #5a7a5a;">virtual Parent Info Session</a> on <strong>Saturday, April 18th at 10:00 AM CST</strong>, and we'd love for you to join us. Whether you're a new family curious about Sage Field or already enrolled and want to learn more about what's coming up, this one's for you.</p>

  <p>Sage Field is a small private microschool in Round Rock, TX for children ages 4–11. We're outdoor-focused with hands-on learning, movement, art, music, and real academic work, all in a small group of about 10 kids. It's the kind of place where children actually look forward to school.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 15px;">We'll walk through everything:</p>
    <ul style="padding-left: 20px; margin: 0;">
      <li style="margin-bottom: 6px;"><strong>Summer 2026</strong> — May 26 through Aug 13, Mon–Thu, ages 4–11</li>
      <li style="margin-bottom: 6px;"><strong>School Year 2026–2027</strong> — Full microschool experience starting August</li>
      <li style="margin-bottom: 6px;"><strong>Homeschool Drop-In</strong> — Flexible 1–5 days/week for homeschool families</li>
    </ul>
    <p style="margin: 12px 0 0 0; font-size: 14px; color: #555;">Our philosophy, a peek at a typical day, pricing, and plenty of time for your questions.</p>
  </div>

  <p>It's a casual virtual meetup on Google Meet and a chance to see if Sage Field might be a good fit for your family.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="https://sagefield.co/info" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">RSVP Here →</a>
  </p>

  <p>If you have any questions before then, feel free to reach out directly:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">Hope to see you there!</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildInfoSessionRSVPEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject =
    "You're registered — Sage Field Virtual Info Session, April 18";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>You're all set! We've received your RSVP for our upcoming Virtual Parent Info Session and we're so glad you'll be joining us.</p>

  <p>This is a great opportunity to learn all about Sage Field — our programs, philosophy, daily life, and what makes our school a special place for kids.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Event Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> Saturday, April 18, 2026</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> 10:00 AM CST</p>
    <p style="margin: 4px 0;"><strong>Format:</strong> Virtual via Google Meet</p>
    <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>Video call link:</strong> <a href="https://meet.google.com/epm-ashp-tyf" style="color: #5a7a5a;">https://meet.google.com/epm-ashp-tyf</a></p>
    <p style="margin: 16px 0 0 0;">
      <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sage+Field+Parent+Info+Session&dates=20260418T150000Z/20260418T160000Z&details=Join+us+on+Google+Meet%3A+https%3A%2F%2Fmeet.google.com%2Fepm-ashp-tyf&location=https%3A%2F%2Fmeet.google.com%2Fepm-ashp-tyf" style="display: inline-block; background: #4285f4; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-family: Georgia, serif; font-size: 14px;">Add to Google Calendar</a>
    </p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">What We'll Cover</h2>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">Overview of Sage Field and our educational philosophy</li>
    <li style="margin-bottom: 8px;">Breakdown of our Summer 2026 and School Year 2026–2027 programs</li>
    <li style="margin-bottom: 8px;">A peek into daily life — movement, art, music, outdoor exploration, and more</li>
    <li style="margin-bottom: 8px;">Transparent pricing and enrollment process</li>
    <li style="margin-bottom: 8px;">Live Q&amp;A — bring your questions!</li>
  </ul>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">Our Programs</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 16px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu &nbsp;·&nbsp; 12 Weeks &nbsp;·&nbsp; ~10 children</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, and academic enrichment in a small, nurturing group.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 16px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Aug 17, 2026 – March 2027 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Mon–Thu &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full school-year microschool experience blending Montessori, Waldorf, and Reggio-inspired methods with TEKS-aligned academics.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Ages 4–11 &nbsp;·&nbsp; 1–5 Days/Week &nbsp;·&nbsp; Flexible Scheduling</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible drop-in program for homeschool families — choose 1 to 5 days per week with ability-based learning, enrichments, and Friday Field Days.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <p style="text-align: center; margin: 32px 0;">
    <a href="https://www.sagefield.co/apply" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">Apply for a Program</a>
  </p>

  <p>We look forward to seeing you on April 18! If you have any questions before then, don't hesitate to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildInfoSessionReminderEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject =
    "Reminder: Virtual Parent Info Session today, April 18 at 10 AM";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>Just a quick reminder that our <strong>Virtual Parent Info Session</strong> is today! We're so excited to connect with you and share everything about Sage Field.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Event Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> Saturday, April 18, 2026</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> 10:00 AM CST</p>
    <p style="margin: 4px 0;"><strong>Format:</strong> Virtual via Google Meet</p>
    <p style="margin: 12px 0 0 0; font-size: 14px;"><strong>Join here:</strong> <a href="https://meet.google.com/epm-ashp-tyf" style="color: #5a7a5a;">https://meet.google.com/epm-ashp-tyf</a></p>
  </div>

  <p>We'll cover our programs, philosophy, daily life at Sage Field, pricing, enrollment, and leave plenty of time for your questions.</p>

  <p>We look forward to seeing you today! If anything comes up, feel free to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildTourReminderEmail(opts: {
  firstName: string;
  tourDate: string;
  tourTime: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Reminder: Your campus tour at Sage Field School";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>Just a friendly reminder that your campus tour at Sage Field School is coming up! We're looking forward to meeting you and your family.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Your Tour Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> ${opts.tourDate}</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> ${opts.tourTime}</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> <a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>
    <p style="margin: 4px 0;"><strong>Duration:</strong> Approximately 45 minutes</p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">What to Expect</h2>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">A private, one-on-one family tour of our campus</li>
    <li style="margin-bottom: 8px;">Walk through our outdoor learning spaces and classrooms</li>
    <li style="margin-bottom: 8px;">Meet Sabrina and our educators</li>
    <li style="margin-bottom: 8px;">See our curriculum and day-to-day rhythm in action</li>
    <li style="margin-bottom: 8px;">Learn about enrollment for Summer 2026 &amp; School Year 2026–2027</li>
  </ul>

  <p>Please <strong>reply to this email</strong> to confirm your attendance, or let us know if you need to reschedule. We want to make sure we're ready for you!</p>

  <p>If you have any questions before your visit, feel free to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or call/text <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email for a paid shadow day fee
 */
export async function buildShadowDayPaymentConfirmationEmail(opts: {
  parentName: string;
  childName: string;
  shadowDate: string;
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Shadow Day Fee Received — You're All Set!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.parentName},</p>

  <p>We are excited to confirm that your shadow day fee of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childName}</strong>! Your child&apos;s visit on <strong>${opts.shadowDate}</strong> is now officially confirmed.</p>

  <p>We can&apos;t wait to welcome ${opts.childName} to Sage Field for a full day of outdoor learning, creative projects, and community.</p>

  <p><strong>A quick reminder:</strong> If you decide to enroll within 14 days of your child&apos;s shadow day visit, the $95 fee will be fully applied toward your registration — so it&apos;s essentially free if you join the family!</p>

  <p>If you have any questions before the visit, feel free to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you soon!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();
  return { subject, content };
}

export async function buildTourThankYouEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Thank you for visiting Sage Field School";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>It was such a joy having you and your family on campus! We hope you left feeling the warmth and intention that goes into everything we do at Sage Field School.</p>

  <p>We know choosing the right learning environment is a big decision, and we're grateful you took the time to visit. If you have any questions that came up after your tour — big or small — please don't hesitate to reach out.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">Ready for Next Steps?</h2>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Summer 2026</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">May 26 – Aug 13 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; ~6 hrs/day &nbsp;·&nbsp; Group of ~10</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Twelve weeks of themed adventures, hands-on projects, nature play, art, music, and academic enrichment in a small, nurturing group setting.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/summer-2026" style="color: #5a7a5a;">Learn more about Summer 2026 →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 12px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">School Year 2026–2027</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Starts Aug 17, 2026 &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Up to 4 days/week &nbsp;·&nbsp; 6-month commitment</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year microschool experience blending Montessori, Waldorf, and Reggio Emilia philosophies with TEKS-aligned academics, in a small, nature-connected environment.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/school-year-2026-2027" style="color: #5a7a5a;">Learn more about the School Year →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;">Homeschool Drop-In</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">1–5 Days/Week &nbsp;·&nbsp; Ages 4–11 &nbsp;·&nbsp; Fridays are Field Days</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Flexible enriching support for homeschooling families. Choose 1 to 5 days per week with ability-based grouping and all enrichments included every day.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/homeschool" style="color: #5a7a5a;">Learn more about Homeschool Drop-In →</a></p>
  </div>

  <div style="border: 1px solid #a8c5a0; border-radius: 4px; padding: 20px 24px; margin: 28px 0; text-align: center; background: #f7f4f0;">
    <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 15px;">Ready to enroll?</p>
    <a href="https://www.sagefield.co/apply" style="display: inline-block; background: #5a7a5a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px;">Apply Here →</a>
  </div>

  <p>We'd love to have your family join ours. Whether you're ready to enroll now or still exploring, we're here for you every step of the way.</p>

  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildAftercareConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  planType: "monthly" | "daily";
  selectedMonths: string[];
  selectedDays: string[];
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const MONTH_LABELS: Record<string, string> = {
    may: "May 2026",
    jun: "June 2026",
    jul: "July 2026",
    aug: "August 2026",
  };
  const formatISODate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const planLabel =
    opts.planType === "monthly"
      ? `Monthly — ${opts.selectedMonths.map((k) => MONTH_LABELS[k] ?? k).join(", ")}`
      : `Daily — ${opts.selectedDays.length} day${opts.selectedDays.length !== 1 ? "s" : ""}`;

  const subject = "Extended Learning Tuition Received — Thank You!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are so pleased to confirm that your Extended Learning tuition payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong>!</p>

  <p><strong>Plan:</strong> ${planLabel}</p>
  ${opts.planType === "daily" && opts.selectedDays.length > 0 ? `<p><strong>Scheduled Days:</strong> ${opts.selectedDays.map(formatISODate).join(", ")}</p>` : ""}

  <p>Your child&apos;s spot is confirmed. We look forward to welcoming ${opts.childLegalName} for extended learning. If you have any questions, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildFunFridayConfirmationEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  planType: "monthly" | "dropin";
  selectedMonths: string[];
  selectedFridays: string[];
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const MONTH_LABELS: Record<string, string> = {
    may: "May 2026",
    jun: "June 2026",
    jul: "July 2026",
    aug: "August 2026",
  };
  const formatISODate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const planLabel =
    opts.planType === "monthly"
      ? `Monthly — ${opts.selectedMonths.map((k) => MONTH_LABELS[k] ?? k).join(", ")}`
      : `Drop-in — ${opts.selectedFridays.length} session${opts.selectedFridays.length !== 1 ? "s" : ""}`;

  const subject = "Fun Friday Payment Received — See You Friday!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are delighted to confirm that your Fun Friday payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong>!</p>

  <p><strong>Plan:</strong> ${planLabel}</p>
  ${opts.planType === "dropin" && opts.selectedFridays.length > 0 ? `<p><strong>Scheduled Fridays:</strong> ${opts.selectedFridays.map(formatISODate).join(", ")}</p>` : ""}

  <p>We can&apos;t wait to see ${opts.childLegalName} on Friday! If you have any questions, please don&apos;t hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you Friday!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}
