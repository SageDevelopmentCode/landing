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
    if (program === "summer_2026") return "Summer 2026";
    if (program === "school_year_26_27") return "School Year 2026-2027";
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

  <p>You're registered for the Sage Field Open House — we're so glad you'll be joining us. This is a wonderful chance to see the space, meet our educators, and get a feel for what learning at Sage Field really looks like.</p>

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
    <p style="margin: 10px 0 0 0; font-size: 14px;">A full-year outdoor-based education grounded in Montessori principles, outdoor learning, and deep connection to the living world — with flexible scheduling for families.</p>
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
