"use server";

import {
  formatCents,
  HOMESCHOOL_SCHOOL_YEAR_PRICING,
  HOMESCHOOL_TIERS,
  SCHOOL_YEAR_TUITION_PRIMARY_CENTS,
  SCHOOL_YEAR_TUITION_UPPER_CENTS,
} from "@/shared/billing/school-year";
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
let cachedAccountId: string | null = null;

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

    // Return cached account ID if available
    if (cachedAccountId) {
      return cachedAccountId;
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

    cachedAccountId = data.data[0].accountId;
    return cachedAccountId;
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

    const normalizedTarget = emailAddress.toLowerCase().trim();
    const relevantEmails = allEmails.filter((email) => {
      const to = (email.toAddress || "").toLowerCase();
      const from = (email.fromAddress || "").toLowerCase();
      return to.includes(normalizedTarget) || from.includes(normalizedTarget);
    });
    console.log(
      `[Zoho] Relevant emails after filter: ${relevantEmails.length}`,
    );

    if (relevantEmails.length === 0) {
      console.log(`[Zoho] No emails found for ${emailAddress}`);
      return [];
    }

    // Fetch full HTML content for each email and merge with summary data
    const emailPromises = relevantEmails.map(async (email) => {
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

  <p style="font-size: 22px; font-weight: bold; color: #2C5F2E; margin: 0 0 16px 0;">🎉 Welcome to the Sage Field Family!</p>

  <p><strong>${opts.childLegalName}</strong> is now officially enrolled at Sage Field School. We are beyond excited to welcome your family into our community — this is just the beginning of something truly wonderful.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Enrollment Confirmation</p>
    <p style="margin: 4px 0;"><strong>Student:</strong> ${opts.childLegalName}</p>
    <p style="margin: 4px 0;"><strong>Program:</strong> ${opts.program}</p>
    <p style="margin: 4px 0;"><strong>Registration Fee:</strong> $${opts.amountDollars} — Received ✓</p>
  </div>

  <p style="margin-top: 28px;"><strong>Your parent portal is now active.</strong> Log in anytime to stay connected with everything happening at Sage Field:</p>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 16px 0 8px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/home" style="color: #5a7a5a; text-decoration: none;">🏠 Parent Home</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">Your dashboard — see check-ins, upcoming events, and portal activity at a glance.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/home" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 8px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/billing" style="color: #5a7a5a; text-decoration: none;">💳 Tuition</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">Pay and manage your tuition, view payment history, and select weeks.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/billing" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 8px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/messages" style="color: #5a7a5a; text-decoration: none;">💬 Messages</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">Connect with the Sage Field team and fellow families in the community.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/messages" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 8px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/children" style="color: #5a7a5a; text-decoration: none;">👨‍👧 My Children</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">View and manage your children's profiles and information.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/children" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 8px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/calendar" style="color: #5a7a5a; text-decoration: none;">📅 Calendar</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">See all upcoming school events, field trips, and important dates.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/calendar" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 8px 0 24px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 15px;"><a href="https://sagefield.co/parent/feed" style="color: #5a7a5a; text-decoration: none;">📰 Feed</a></p>
    <p style="margin: 0; color: #555; font-size: 14px;">Stay up to date with school posts, updates, and community news.</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;"><a href="https://sagefield.co/parent/feed" style="color: #5a7a5a;">Open →</a></p>
  </div>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://sagefield.co/parent/home"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Visit Your Parent Portal →
    </a>
  </p>

  <p>If you have any questions, we are always here — just reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">With so much excitement,</p>
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
  siblings?: Array<{
    childLegalName: string;
    planType: "weekly" | "full";
    weeks?: number[];
  }>;
}): Promise<{ subject: string; content: string }> {
  const subject = "Summer 2026 Tuition Received — See You This Summer!";

  function makePlanLabel(
    planType: "weekly" | "full",
    weeks?: number[],
  ): string {
    return planType === "full"
      ? "Full Summer — all 12 weeks (May 26 – Aug 13, 2026)"
      : `${weeks?.length ?? 0} week${(weeks?.length ?? 0) !== 1 ? "s" : ""}${weeks && weeks.length > 0 ? ` (Weeks ${weeks.join(", ")})` : ""}`;
  }

  const hasSiblings = opts.siblings && opts.siblings.length > 0;

  const childrenHtml = hasSiblings
    ? `<p>We are so excited to confirm that your Summer 2026 tuition payment of <strong>$${opts.amountDollars}</strong> has been received for the following children:</p>
  <ul style="margin: 8px 0 16px 0; padding-left: 20px;">
    <li><strong>${opts.childLegalName}</strong> — ${makePlanLabel(opts.planType, opts.weeks)}</li>
    ${opts.siblings!.map((s) => `<li><strong>${s.childLegalName}</strong> — ${makePlanLabel(s.planType, s.weeks)}</li>`).join("\n    ")}
  </ul>`
    : `<p>We are so excited to confirm that your Summer 2026 tuition payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.childLegalName}</strong>!</p>

  <p><strong>Plan:</strong> ${makePlanLabel(opts.planType, opts.weeks)}</p>`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  ${childrenHtml}

  <p>Your ${hasSiblings ? "children's spots are" : "child's spot is"} officially secured for summer camp. We can't wait to welcome them for a season full of adventure, learning, and fun at Sage Field.</p>

  <p>If you have any questions in the meantime, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

  <p style="margin-top: 32px;">See you this summer!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildFullSummerThankYouEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Thank You for Enrolling in Full Summer 2026!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>Thank you so much for enrolling ${opts.childLegalName} in the <strong>Full Summer 2026</strong> program at Sage Field! We are truly thrilled to have your family with us for all 12 weeks this summer (May 26 – August 13, 2026).</p>

  <p>Choosing the full summer means ${opts.childLegalName} will have the chance to build deep friendships, settle into our rhythms, and really make this place their own. We can't wait to watch them grow and thrive.</p>

  <p>We'll be in touch with more details as summer approaches. In the meantime, please don't hesitate to reach out with any questions at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> — we're always happy to hear from you.</p>

  <p style="margin-top: 32px;">With gratitude,</p>
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
 * Build HTML reminder for enrolled families with incomplete checklist items before school year start
 */
export async function buildEnrollmentChecklistDeadlineReminderEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = `Please complete ${opts.childLegalName}'s enrollment checklist before August 17`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are so excited to welcome <strong>${opts.childLegalName}</strong> to Sage Field for the <strong>2026–2027 school year</strong>, which begins <strong>Monday, August 17</strong>!</p>

  <p>Our records show that a few items on your enrollment checklist are still outstanding. To make sure everything is in order before the first day, please take a moment to complete the remaining steps through your parent dashboard.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Complete Your Enrollment Checklist →
    </a>
  </div>

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
    <li style="margin-bottom: 8px;"><strong>Pay Registration Fee</strong> — submit if not yet paid</li>
  </ol>

  <p style="margin-top: 24px;"><strong>Optional steps (if applicable):</strong></p>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;"><strong>Emergency Medication Plan on File</strong> — if your child requires emergency medication at school</li>
    <li style="margin-bottom: 8px;"><strong>Additional Authorized Pickup Person</strong> — if someone other than a guardian will pick up your child</li>
  </ul>

  <p>We look forward to seeing <strong>${opts.childLegalName}</strong> on August 17. If you have any questions or need help completing any of the steps, please don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a>.</p>

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
      <strong>Tuition</strong> — Your tuition portal is live at <a href="https://www.sagefield.co/parent/billing" style="color: #5a7a5a; font-weight: bold;">sagefield.co/parent/billing</a>. Head there to reserve your summer weeks, or to manage tuition payments for the school year or homeschool drop-in program.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Parent Home</strong> — Your parent home is live at <a href="https://www.sagefield.co/parent/home" style="color: #5a7a5a; font-weight: bold;">sagefield.co/parent/home</a>. Bookmark it — it's your central hub for updates, documents, and important information throughout the year.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>Sage Field Mobile App</strong> — Our app is now available to download! Stay connected with everything at Sage Field — pay tuition, view the school feed, manage your children's profiles, message staff, and join the community channel. <a href="https://www.sagefield.co/download" style="color: #5a7a5a; font-weight: bold;">Download the app here →</a>
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

export async function buildEnrollmentReminder2Email(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  const subject = `Limited Spots Remaining! Complete ${opts.childLegalName}'s Enrollment`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Happy Sunday, ${opts.g1FullName}!</p>

  <p>Summer is right around the corner — there are only <strong>3 weeks</strong> before our summer program begins!</p>

  <p>Thank you again for submitting <strong>${opts.childLegalName}</strong>'s application. We are so excited about the opportunity to have your family join our school community.</p>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    At this time, <strong>${opts.childLegalName}</strong>'s spot is not yet secured. We are actively enrolling new students, and several families are in the process of completing their registration. Availability is now limited — only <strong>4 spots remaining for 2nd–4th grade</strong> and <strong>6 spots for Pre-K – 1st grade</strong>.
  </p>

  <p><strong>To finalize enrollment for summer, please complete the remaining steps through your parent dashboard:</strong></p>

  <ul style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Submit the registration fee</li>
    <li style="margin-bottom: 8px;">Select your child's summer camp weeks</li>
  </ul>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Complete Enrollment →
    </a>
  </p>

  <p>While you are already on our website, you can also:</p>

  <ul style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Confirm enrollment for the upcoming school year</li>
  </ul>

  <p style="font-size: 14px; color: #666;">Spots are filled on a first-come, first-served basis — please complete your enrollment as soon as possible to ensure ${opts.childLegalName}'s placement.</p>

  <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>

  <p>We look forward to seeing you this summer!</p>

  <p style="margin-top: 32px;">Wishing you a peaceful day,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina Grace Obnamia</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br />
    (512) 677-5872
  </p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildEnrollmentReminder3Email(opts: {
  g1FullName: string;
  childLegalName: string;
  program: string | null;
}): Promise<{ subject: string; content: string }> {
  const subject = `Limited Spots Remaining! Complete ${opts.childLegalName}'s Enrollment`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Happy Sunday &amp; Happy Mother&#39;s Day, ${opts.g1FullName}!</p>

  <p>Summer is right around the corner — there are only <strong>2 weeks</strong> before our summer program begins!</p>

  <p>Thank you again for submitting <strong>${opts.childLegalName}</strong>'s application. We are so excited about the opportunity to have your family join our school community.</p>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    At this time, <strong>${opts.childLegalName}</strong>'s spot is not yet secured. We are actively enrolling new students, and several families are in the process of completing their registration. Availability is now limited — only <strong>3 spots remaining for 2nd–4th grade</strong> and <strong>4 spots for Pre-K – 1st grade</strong>.
  </p>

  <p><strong>To finalize enrollment for summer, please complete the remaining steps through your parent dashboard:</strong></p>

  <ul style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Submit the registration fee</li>
    <li style="margin-bottom: 8px;">Select your child's summer camp weeks</li>
  </ul>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Complete Enrollment →
    </a>
  </p>

  <p>While you are already on our website, you can also:</p>

  <ul style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Confirm enrollment for the upcoming school year</li>
  </ul>

  <p style="font-size: 14px; color: #666;">Spots are filled on a first-come, first-served basis — please complete your enrollment as soon as possible to ensure ${opts.childLegalName}'s placement.</p>

  <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>

  <p>We look forward to seeing you this summer!</p>

  <p style="margin-top: 32px;">Wishing you a peaceful day and a beautiful Mother&#39;s Day,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina Grace Obnamia</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br />
    (512) 677-5872
  </p>
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

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 28px 0 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Schedule a Private Campus Tour</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Private &nbsp;·&nbsp; ~45 Minutes &nbsp;·&nbsp; Mon – Sat &nbsp;·&nbsp; 100% Free</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Walk our outdoor learning areas, meet Ms. Sabrina and our educators, and get a real feel for what makes Sage Field special. Tours are personal, unhurried, and completely free.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/tour" style="color: #5a7a5a; font-weight: bold;">Schedule My Tour →</a></p>
  </div>

  <div style="border: 1px solid #ddd; border-radius: 4px; padding: 16px 20px; margin: 0 0 28px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Book a Shadow Day</p>
    <p style="margin: 4px 0; color: #555; font-size: 14px;">Full School Day &nbsp;·&nbsp; 9 AM – 3 PM &nbsp;·&nbsp; Mon – Thu &nbsp;·&nbsp; $95 (waived if you enroll)</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Want your child to actually experience a day at Sage Field? A Shadow Day puts them in real lessons, outdoor time, and lunch with classmates — so they can tell you if it feels like home. The $95 fee is waived if you enroll within 14 days.</p>
    <p style="margin: 10px 0 0 0; font-size: 14px;"><a href="https://www.sagefield.co/shadow-tour" style="color: #5a7a5a; font-weight: bold;">Book a Shadow Day →</a></p>
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
  const MAX_ATTEMPTS = 3;
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
        lastError = errorText;
        // Auth failures won't self-heal — clear stale token and give up
        if (response.status === 401 || response.status === 403) {
          cachedAccessToken = null;
          break;
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
        continue;
      }

      return { success: true };
    } catch (error) {
      lastError = String(error);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  console.error("sendZohoEmail failed after retries:", lastError);
  return { success: false, error: lastError };
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

export async function buildParentTeacherConferenceConfirmationEmail(opts: {
  parentFirstName: string;
  childName: string;
  teacherName: string;
  conferenceDate: string;
  timeSlot: string;
  format: "in_person" | "virtual";
}): Promise<{ subject: string; content: string }> {
  const subject = "Your parent-teacher conference is confirmed — Sage Field School";
  const formatLine =
    opts.format === "in_person"
      ? `<p style="margin: 4px 0;"><strong>Format:</strong> In person at Sage Field</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> <a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>`
      : `<p style="margin: 4px 0;"><strong>Format:</strong> Virtual</p>
    <p style="margin: 4px 0;">We'll send you a video call link before your conference.</p>`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.parentFirstName},</p>

  <p>Your parent-teacher conference for <strong>${opts.childName}</strong> with <strong>${opts.teacherName}</strong> is confirmed. We're looking forward to connecting with you about your child's year ahead.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Conference Details</p>
    <p style="margin: 4px 0;"><strong>Child:</strong> ${opts.childName}</p>
    <p style="margin: 4px 0;"><strong>Teacher:</strong> ${opts.teacherName}</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> ${opts.conferenceDate}</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> ${opts.timeSlot}</p>
    ${formatLine}
  </div>

  <p>If you need to make a change, please reach out to us at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or call/text <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina Obnamia</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
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

  <p>We can&apos;t wait to welcome ${opts.childName} to Sage Field for a full day of real academics, outdoor play, cooking, and genuine community — you&apos;ll get to see exactly how a typical day unfolds.</p>

  <h2 style="font-size: 17px; margin-top: 32px; margin-bottom: 10px; color: #2c2c2c;">Your Shadow Day Details</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
    <tr><td style="padding: 6px 0; width: 28px;">📅</td><td style="padding: 6px 0;"><strong>Date:</strong> ${opts.shadowDate}</td></tr>
    <tr><td style="padding: 6px 0;">🕗</td><td style="padding: 6px 0;"><strong>Hours:</strong> 9:00 AM – 3:00 PM</td></tr>
    <tr><td style="padding: 6px 0;">📍</td><td style="padding: 6px 0;"><strong>Location:</strong> Round Rock, TX &nbsp;·&nbsp; Mon–Thu schedule</td></tr>
  </table>

  <h2 style="font-size: 17px; margin-top: 32px; margin-bottom: 10px; color: #2c2c2c;">What to Pack</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
    <tr><td style="padding: 5px 0; width: 28px;">🧴</td><td style="padding: 5px 0;">Sunscreen <span style="color:#777;">(applied before drop-off)</span></td></tr>
    <tr><td style="padding: 5px 0;">🩱</td><td style="padding: 5px 0;">Swimsuit + towel</td></tr>
    <tr><td style="padding: 5px 0;">👕</td><td style="padding: 5px 0;">Change of clothes</td></tr>
    <tr><td style="padding: 5px 0;">💧</td><td style="padding: 5px 0;">Water bottle, labeled with your child&apos;s name</td></tr>
    <tr><td style="padding: 5px 0;">🦟</td><td style="padding: 5px 0;">Bug spray</td></tr>
    <tr><td style="padding: 5px 0;">🥪</td><td style="padding: 5px 0;">Snack + lunch from home</td></tr>
  </table>

  <p>If you have any questions before the visit, feel free to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you soon!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();
  return { subject, content };
}

export async function buildBeachBashConfirmationEmail(opts: {
  parentName: string;
  childNames: string;
  childCount: number;
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const childLabel =
    opts.childCount > 1 ? `${opts.childCount} children` : opts.childNames;
  const subject = "Beach Bash Day — You're Registered! 🌊";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.parentName},</p>

  <p>Your registration for <strong>${opts.childNames}</strong> is confirmed and your payment of <strong>$${opts.amountDollars}</strong> has been received. We can&apos;t wait to see you at Beach Bash Day${opts.childCount > 1 ? " with the whole crew" : ""}!</p>

  <h2 style="font-size: 17px; margin-top: 32px; margin-bottom: 10px; color: #2c2c2c;">Event Details</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
    <tr><td style="padding: 6px 0; width: 28px;">📅</td><td style="padding: 6px 0;"><strong>Date:</strong> Friday, June 13, 2026</td></tr>
    <tr><td style="padding: 6px 0;">🕗</td><td style="padding: 6px 0;"><strong>Drop-off:</strong> 8:30 AM &nbsp;·&nbsp; <strong>Pick-up:</strong> 1:30 PM</td></tr>
    <tr><td style="padding: 6px 0;">👧</td><td style="padding: 6px 0;"><strong>Registered:</strong> ${childLabel}</td></tr>
    <tr><td style="padding: 6px 0;">📍</td><td style="padding: 6px 0;"><strong>Location:</strong> 2760 Gattis School Rd, Round Rock, TX</td></tr>
  </table>

  <h2 style="font-size: 17px; margin-top: 32px; margin-bottom: 10px; color: #2c2c2c;">What&apos;s on the Agenda</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
    <tr><td style="padding: 5px 0; width: 28px;">🌊</td><td style="padding: 5px 0;">Ocean Slime Making — mix up a batch to take home</td></tr>
    <tr><td style="padding: 5px 0;">🏆</td><td style="padding: 5px 0;">Tug-A-War &amp; Field Day Games</td></tr>
    <tr><td style="padding: 5px 0;">🐚</td><td style="padding: 5px 0;">Sea Shell Painting — a keepsake to take home</td></tr>
    <tr><td style="padding: 5px 0;">🍦</td><td style="padding: 5px 0;">Ice Cream Bar — build your own treat</td></tr>
  </table>

  <h2 style="font-size: 17px; margin-top: 32px; margin-bottom: 10px; color: #2c2c2c;">What to Pack</h2>
  <table style="border-collapse: collapse; width: 100%; font-size: 15px;">
    <tr><td style="padding: 5px 0; width: 28px;">🧴</td><td style="padding: 5px 0;">Sunscreen <span style="color:#777;">(applied before drop-off)</span></td></tr>
    <tr><td style="padding: 5px 0;">🩱</td><td style="padding: 5px 0;">Swimsuit + towel</td></tr>
    <tr><td style="padding: 5px 0;">👕</td><td style="padding: 5px 0;">Change of clothes</td></tr>
    <tr><td style="padding: 5px 0;">💧</td><td style="padding: 5px 0;">Water bottle, labeled with your child&apos;s name</td></tr>
    <tr><td style="padding: 5px 0;">🦟</td><td style="padding: 5px 0;">Bug spray</td></tr>
    <tr><td style="padding: 5px 0;">🥪</td><td style="padding: 5px 0;">Snack + lunch from home</td></tr>
  </table>

  <p style="margin-top: 28px;">Questions before Friday? Reach us at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you at the beach (well, Sage Field)!</p>
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

export async function buildDashboardInviteEmail(opts: {
  ownerName: string;
  inviteLink: string;
  studentNames: string[];
}): Promise<{ subject: string; content: string }> {
  const subject = `${opts.ownerName} invited you to their Sage Field dashboard`;

  const studentLine =
    opts.studentNames.length > 0
      ? `<p>You'll have access to the enrollment records for <strong>${opts.studentNames.join(", ")}</strong>.</p>`
      : "";

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Hello,</p>

  <p><strong>${opts.ownerName}</strong> has invited you to view their child's dashboard on Sage Field School.</p>

  ${studentLine}

  <p>Click the button below to accept the invitation and access the dashboard. You'll be prompted to sign in or create an account.</p>

  <p style="text-align: center; margin: 32px 0;">
    <a href="${opts.inviteLink}" style="background-color: #5a7a5a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-family: Georgia, serif; font-size: 16px;">Accept Invitation</a>
  </p>

  <p style="font-size: 13px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${opts.inviteLink}" style="color: #5a7a5a;">${opts.inviteLink}</a></p>

  <p style="font-size: 13px; color: #666; margin-top: 24px;">This link can only be used once. If you didn't expect this invitation, you can safely ignore this email.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildPaySummerTuitionEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Select Your Child's Summer Weeks";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Happy Sunday &amp; Happy Mother&#39;s Day, ${opts.g1FullName}!</p>

  <p>We have <strong>3 weeks left</strong> until our summer program starts!</p>

  <p>There's just one quick step left: <strong>selecting and confirming the weeks ${opts.childLegalName} will be attending.</strong> This helps us get an accurate headcount so we can create the best experience for each group.</p>

  <p>Please log into your parent portal using the same email you originally registered with — this will take you to your parent homepage where you can select your child's summer weeks.</p>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Go to Parent Portal →
    </a>
  </p>

  <p><strong>Once you're logged in:</strong></p>
  <ol style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Click on the <strong>Tuition</strong> tab</li>
    <li style="margin-bottom: 8px;">Select <strong>Summer 2026 Tuition</strong></li>
    <li style="margin-bottom: 8px;">Choose the weeks your child will be attending</li>
    <li style="margin-bottom: 8px;">Submit to confirm your schedule</li>
  </ol>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    We're currently building out our summer rosters, so we'd really appreciate you completing this step soon — it makes a big difference in helping us prepare well for your children.
  </p>

  <p>If you have any questions or need help accessing your account, I'm happy to guide you through it. Don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">Wishing you a restful Sunday and a beautiful Mother&#39;s Day,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina Grace Obnamia</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br />
    (512) 677-5872
  </p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildPaySummerTuitionEmail2(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "2 Weeks Left + Portal Updates for Summer";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Happy Sunday &amp; Happy Mother&#39;s Day, ${opts.g1FullName}!</p>

  <p>We have <strong>2 weeks left</strong> until our summer program starts!</p>

  <p>We're getting close! If you haven't selected your weeks yet, please do so. Locking this in helps us make sure every group is set up just right.</p>

  <p>Log into your parent portal with the same email you registered with — from there you can head straight to the Tuition tab and confirm your child's summer schedule.</p>

  <p style="text-align: center; margin: 28px 0 12px 0;">
    <a href="https://www.sagefield.co/parent/billing"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px;">
      Select Your Weeks →
    </a>
  </p>

  <p style="text-align: center; margin: 0 0 28px 0;">
    <a href="https://www.sagefield.co/parent/home"
       style="color: #5a7a5a; font-weight: bold; text-decoration: underline; font-size: 14px;">
      Go to Parent Portal
    </a>
  </p>

  <p><strong>Once you're logged in:</strong></p>
  <ol style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 8px;">Click on the <strong>Tuition</strong> tab</li>
    <li style="margin-bottom: 8px;">Select <strong>Summer 2026 Tuition</strong></li>
    <li style="margin-bottom: 8px;">Choose the weeks your child will be attending</li>
    <li style="margin-bottom: 8px;">Submit to confirm your schedule</li>
  </ol>

  <p style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 12px 16px; margin: 20px 0; font-size: 14px;">
    With 2 weeks to go, finalizing your child's weeks now gives our team the time we need to plan the best possible experience for each group.
  </p>

  <p style="margin-top: 28px;"><strong>A few exciting updates while we have you:</strong></p>

  <ul style="padding-left: 20px; margin-bottom: 20px;">
    <li style="margin-bottom: 12px;">
      <strong>📱 Mobile App — Coming May 15:</strong> We're releasing the Sage Field app to all enrolled families. You'll get the full parent portal experience right from your phone — we can't wait for you to try it.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>💬 Community Feature — Now Live:</strong> Head to your parent portal, click <strong>Messages</strong>, and open the <strong>Community</strong> tab. This is a shared space where all Sage Field families can introduce themselves, connect with one another, and ask questions directly to our teachers. We'd love for you to say hello! <a href="https://www.sagefield.co/parent/messages" style="color: #5a7a5a; font-weight: bold;">Go to Messages →</a>
    </li>
    <li style="margin-bottom: 12px;">
      <strong>📲 Mobile-Friendly Portal:</strong> Your entire parent portal — dashboard, billing, forms, calendar, and more — is now fully optimized for mobile browsers. No app needed to get started.
    </li>
    <li style="margin-bottom: 12px;">
      <strong>📝 Submit Learning Requests:</strong> In the <strong>My Children</strong> section, use the <strong>Learning</strong> tab to share any special notes or requests so our teachers can be best prepared for your child. <a href="https://www.sagefield.co/parent/children" style="color: #5a7a5a; font-weight: bold;">Go to My Children →</a>
    </li>
  </ul>

  <p>If you have any questions or need help accessing your account, I'm happy to guide you through it. Don't hesitate to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">Wishing you a restful Sunday and a beautiful Mother&#39;s Day,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina Grace Obnamia</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a><br />
    (512) 677-5872
  </p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildCustomTuitionConfirmationEmail(opts: {
  g1FullName: string;
  label: string;
  amountDollars: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Tuition Payment Received — Thank You!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are pleased to confirm that your tuition payment of <strong>$${opts.amountDollars}</strong> has been received for <strong>${opts.label}</strong>.</p>

  <p>Thank you for your continued support of Sage Field School. If you have any questions, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSupplyFeeConfirmationEmail(opts: {
  g1FullName: string;
  childName: string;
  amountDollars: string;
  bundleType?: string;
  studentBreakdown?: Array<{
    name: string;
    supplyFee: number;
    bundleAmount: number;
  }>;
}): Promise<{ subject: string; content: string }> {
  const hasBundle =
    !!opts.bundleType &&
    !!opts.studentBreakdown &&
    opts.studentBreakdown.length > 0;
  const subject = hasBundle
    ? "Annual Supply Fee + August Tuition Received — You're All Set!"
    : "Annual Supply Fee Received — You're All Set!";

  const breakdownRows = hasBundle
    ? opts
        .studentBreakdown!.map((s) => {
          const total = ((s.supplyFee + s.bundleAmount) / 100).toFixed(2);
          const supplyFmtd = (s.supplyFee / 100).toFixed(2);
          const bundleFmtd = (s.bundleAmount / 100).toFixed(2);
          return `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e8e4e0;">${s.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e8e4e0;">$${supplyFmtd}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e8e4e0;">$${bundleFmtd}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e8e4e0; font-weight: bold;">$${total}</td>
    </tr>`;
        })
        .join("")
    : "";

  const content = hasBundle
    ? `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are pleased to confirm that your payment of <strong>$${opts.amountDollars}</strong> for the <strong>Annual Supply Fee and August 2026 Tuition</strong> for <strong>${opts.childName}</strong> has been received. You are all set for the 2026–27 school year!</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
    <thead>
      <tr style="background-color: #f7f4f0;">
        <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #d4cfc9;">Student</th>
        <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #d4cfc9;">Supply Fee</th>
        <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #d4cfc9;">Aug Tuition</th>
        <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #d4cfc9;">Total</th>
      </tr>
    </thead>
    <tbody>${breakdownRows}
    </tbody>
  </table>

  <p>Your August tuition has been recorded and your supply fee covers all materials for the year. You can view your payment history anytime in your billing portal:</p>

  <p style="margin: 24px 0;">
    <a href="https://sagefield.co/parent/billing" style="display: inline-block; background-color: #4a7c59; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: bold;">Go to Billing Portal</a>
  </p>

  <p>If you have any questions, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim()
    : `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p>We are pleased to confirm that your <strong>Annual Supply Fee of $${opts.amountDollars}</strong> for <strong>${opts.childName}</strong> has been received. You are all set for the 2026–27 school year!</p>

  <p>Your next step is to pay your monthly tuition. You can do that anytime through your billing portal:</p>

  <p style="margin: 24px 0;">
    <a href="https://sagefield.co/parent/billing" style="display: inline-block; background-color: #4a7c59; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: bold;">Go to Billing Portal</a>
  </p>

  <p>If you have any questions, please reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWelcomeEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Welcome to Sage Field Summer — What to Expect ☀️";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p style="margin-bottom: 24px;">We are so excited to welcome your family to Sage Field this summer! With May 26th right around the corner, we wanted to share what the first few weeks will look like and answer some of the questions we've been hearing from families.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🌿 What Summer at Sage Field Actually Looks Like</h2>
  <p style="margin-bottom: 16px;">Summer at Sage Field is not a daycare or drop-in camp — it's a school program with a real schedule designed to balance academics, creativity, outdoor play, and meaningful friendships.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Weekly Schedule</strong></p>
    <p style="margin: 0 0 2px 0; font-size: 14px;">📅 Monday – Thursday</p>
    <p style="margin: 0; font-size: 14px;">⏰ 9:00 AM – 3:00 PM</p>
  </div>

  <p style="margin-bottom: 8px;"><strong>A Typical Day Includes:</strong></p>
  <ul style="padding-left: 20px; margin-bottom: 20px; font-size: 15px;">
    <li style="margin-bottom: 6px;">Morning drop-off + outdoor play beginning at 8:15 AM</li>
    <li style="margin-bottom: 6px;">Short, engaging academic blocks in Reading / ELA and Math<br /><span style="color: #666; font-size: 13px;">(around 15 minutes each — ability-based)</span></li>
    <li style="margin-bottom: 6px;">Daily themed activities</li>
    <li style="margin-bottom: 6px;">Art + music</li>
    <li style="margin-bottom: 6px;">Lunch + outdoor water play every afternoon</li>
    <li style="margin-bottom: 6px;">Journaling</li>
    <li style="margin-bottom: 6px;">Cooking / homesteading</li>
    <li style="margin-bottom: 6px;">Garden + animal care to close the day</li>
  </ul>

  <p style="margin-bottom: 8px;">Each week brings a completely different theme and experience:</p>
  <ul style="padding-left: 20px; margin-bottom: 20px; font-size: 15px;">
    <li style="margin-bottom: 6px;">☀️ Week 1 — Welcome to Sage Field</li>
    <li style="margin-bottom: 6px;">🕵️ Week 2 — Mystery Escape Chalay Bash</li>
    <li style="margin-bottom: 6px; color: #666;">…and so on through Week 12's Finale in August!</li>
  </ul>
  <p style="margin-bottom: 24px; color: #555; font-size: 14px;">Every week includes new crafts, games, challenges, and adventures tied to that theme.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🌲 Field Day Fridays</h2>
  <p style="margin-bottom: 12px;">For families who want more, we also offer outdoor, nature-focused field learning days with a unique theme every Friday. There will typically be 3 unique activities each Friday!</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0 0 4px 0; font-size: 14px;">📅 <strong>Fridays</strong> &nbsp;·&nbsp; ⏰ 9:00 AM – 1:00 PM</p>
    <p style="margin: 6px 0 2px 0; font-size: 14px;">Drop-off: 8:30 – 9:00 AM</p>
    <p style="margin: 0; font-size: 14px;">Pick-up: 1:00 – 1:30 PM</p>
  </div>

  <ul style="padding-left: 20px; margin-bottom: 24px; font-size: 14px; color: #555;">
    <li style="margin-bottom: 4px;">Field Day Fridays are optional</li>
    <li style="margin-bottom: 4px;">They are an add-on program for <strong>$200 a month</strong></li>
    <li style="margin-bottom: 4px;">They are not included in the base summer tuition</li>
  </ul>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">👩‍🏫 Your Child's Group</h2>
  <p style="margin-bottom: 24px;">We intentionally keep groups small! Your child will be placed in a multi-aged, ability-based learning group, allowing them to be challenged at the right level academically while still building strong friendships throughout the summer. Because the assigned groupings stay consistent through the summer, children quickly become comfortable, connected, and genuinely known by their teachers.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🎒 What to Send With Your Child</h2>
  <ul style="padding-left: 20px; margin-bottom: 12px; font-size: 15px;">
    <li style="margin-bottom: 6px;">A packed snack + lunch</li>
    <li style="margin-bottom: 6px;">A reusable water bottle</li>
    <li style="margin-bottom: 6px;">Weather-appropriate clothing</li>
    <li style="margin-bottom: 6px;">Closed-toe shoes</li>
    <li style="margin-bottom: 6px;">Open-toe shoes (for ease before/after water play)</li>
    <li style="margin-bottom: 6px;">A swimsuit</li>
    <li style="margin-bottom: 6px;">A towel</li>
    <li style="margin-bottom: 6px;">A change of clothes</li>
  </ul>
  <p style="margin-bottom: 6px; font-size: 14px; color: #555;"><strong>We also recommend:</strong></p>
  <ul style="padding-left: 20px; margin-bottom: 16px; font-size: 14px; color: #555;">
    <li style="margin-bottom: 4px;">Sunscreen applied before drop-off</li>
    <li style="margin-bottom: 4px;">Additional sunscreen &amp; bug spray</li>
    <li style="margin-bottom: 4px;">A pair of boots</li>
  </ul>
  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">Students may leave their additional shoes at Sage Field. Please ensure to pick them up on your last day.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💻 Join Us for a Live Q&amp;A</h2>
  <p style="margin-bottom: 12px;">We know many families still have questions before Day 1, and we'd love to answer them. We're hosting two open drop-in Google Meet calls where you can join anytime, ask questions, hear from our team, and hop off whenever you'd like.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;">📅 <strong>Saturday, May 16</strong> · 11:00 AM – 12:00 PM</p>
    <p style="margin: 0 0 12px 0;">📅 <strong>Saturday, May 23</strong> · 11:00 AM – 12:00 PM</p>
    <p style="margin: 0;">🔗 <a href="https://meet.google.com/jxk-xkfc-mnp" style="color: #5a7a5a;">Join Google Meet</a></p>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">Both sessions use the same link — you only need to attend one. Sabrina will be there to answer questions about the program, tuition, schedules, Day 1 expectations, and weekly themes.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💳 A Note on Tuition — Please Read</h2>
  <p style="margin-bottom: 12px;">To keep our small-group program running smoothly and to hold your child's spot, tuition for each week must be received by the <strong>Friday before that week begins</strong>.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;"><strong>Examples:</strong></p>
    <p style="margin: 0 0 4px 0;">Week 1 begins May 26 → Tuition due by <strong>May 22</strong></p>
    <p style="margin: 0 0 12px 0;">Week 2 begins June 1 → Tuition due by <strong>May 29</strong></p>
    <p style="margin: 0; color: #c0392b; font-size: 13px;">⚠️ A <strong>$30 late fee</strong> applies if tuition is not received by Friday at 11:59 PM.</p>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #555;">This allows us to properly plan staffing, supplies, activities, meals, and small group placement.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/billing" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Pay Tuition</a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555; text-align: center;">Not logged in yet? <a href="https://www.sagefield.co/parent/home" style="color: #5a7a5a;">Access your parent dashboard here.</a></p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💬 Have Questions? Ask the Community</h2>
  <p style="margin-bottom: 24px;">Inside your parent dashboard we have a community messaging channel where families can ask questions, see announcements, and connect with other Sage Field parents. <a href="https://www.sagefield.co/parent/messages" style="color: #5a7a5a;">Visit the General channel here.</a></p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">📧 Still Have Questions for Us Directly?</h2>
  <p style="margin-bottom: 12px;">We want you to feel completely confident before summer begins. Please reach out anytime:</p>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 16px 0 24px; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 4px 0;">📧 <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
    <p style="margin: 0;">📱 <a href="sms:+15126775872" style="color: #5a7a5a;">512-677-5872</a></p>
  </div>

  <p style="margin-top: 36px; margin-bottom: 4px;">We cannot wait for summer! ☀️</p>
  <p style="margin-top: 4px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina &amp; the Sage Field Team</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerTuitionDueDateReminderEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Tuition Due This Friday — A Quick Note Before Summer Begins";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p style="margin-bottom: 12px;">If you've already paid — thank you so much, you're all set! 🎉 Feel free to skip ahead to the packing list and Q&amp;A info below.</p>

  <p style="margin-bottom: 16px;">If you haven't yet — and if <strong>${opts.childLegalName}</strong> is planning to attend the first week of summer (May 26) — tuition is due this <strong>Friday, May 22</strong>. Your child's spot is held and we can't wait to welcome them — we just need to receive payment to confirm it.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/billing" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Pay Tuition</a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555; text-align: center;">Not logged in yet? <a href="https://www.sagefield.co/parent/home" style="color: #5a7a5a;">Access your parent dashboard here.</a></p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🎒 What to Send With Your Child</h2>
  <div style="line-height: 2.2; margin-bottom: 8px;">
    <span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🍱 Snack + lunch</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">💧 Water bottle</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👕 Change of clothes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👟 Closed-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩴 Open-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">☀️ Sunscreen</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🥾 Boots</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩱 Swimsuit</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🏖️ Towel</span>
  </div>
  <p style="margin-bottom: 24px; font-size: 13px; color: #888; font-style: italic;">Extra shoes may be left at Sage Field — pick them up on your last day.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💻 Join Us for a Live Q&amp;A</h2>
  <p style="margin-bottom: 12px;">Still have questions before Day 1? Join us on Google Meet — drop in anytime, ask what's on your mind, and hop off whenever you'd like.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;">📅 <strong>Saturday, May 23</strong> · 11:00 AM – 12:00 PM</p>
    <p style="margin: 0;">🔗 <a href="https://meet.google.com/jxk-xkfc-mnp" style="color: #5a7a5a;">Join Google Meet</a></p>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">Sabrina will be there to answer questions about the program, schedules, Day 1 expectations, and anything else on your mind.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💳 A Note on Tuition</h2>
  <p style="margin-bottom: 12px;">To keep our small-group program running smoothly and to hold your child's spot, tuition for each week must be received by the <strong>Friday before that week begins</strong>.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;"><strong>Examples:</strong></p>
    <p style="margin: 0 0 4px 0;">Week 1 begins May 26 → Tuition due by <strong>May 22</strong></p>
    <p style="margin: 0 0 12px 0;">Week 2 begins June 1 → Tuition due by <strong>May 29</strong></p>
    <p style="margin: 0; color: #c0392b; font-size: 13px;">⚠️ A <strong>$30 late fee</strong> applies if tuition is not received by Friday at 11:59 PM.</p>
  </div>

  <p style="margin-top: 32px; margin-bottom: 4px;">See you soon! ☀️</p>
  <p style="margin-top: 4px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina &amp; the Sage Field Team</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerTuitionDueDateTodayReminderEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject =
    "Tuition Is Due Today — And the Sage Field App Is Now Live 🎉";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p style="margin-bottom: 12px;">If you've already paid — thank you so much, you're all set! 🎉 Feel free to skip ahead to the packing list and app info below.</p>

  <p style="margin-bottom: 16px;">If you haven't yet — and if <strong>${opts.childLegalName}</strong> is planning to attend the first week of summer (May 26) — <strong>tuition is due today, Friday May 22</strong>. Your child's spot is held and we can't wait to welcome them — we just need to receive payment by tonight to confirm it.</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/billing" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Pay Tuition Now</a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555; text-align: center;">Not logged in yet? <a href="https://www.sagefield.co/parent/home" style="color: #5a7a5a;">Access your parent dashboard here.</a></p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">📱 The Sage Field App Is Now Available!</h2>
  <p style="margin-bottom: 12px;">We're excited to share that the <strong>Sage Field app is officially live</strong> — you can download it today and have everything you need right in your pocket.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="https://www.sagefield.co/download" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Download the App</a>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">With the app you can:</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 2;">
    <li>💳 Pay tuition directly</li>
    <li>📸 View the school feed</li>
    <li>💬 Message staff</li>
    <li>🌿 Join the community channel</li>
    <li>👧 Check your children's profiles</li>
    <li>📋 Go over all your enrollment forms</li>
  </ul>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;"><strong>Android users:</strong> When you tap the Google Play button on the download page, it will prompt you with an email address — we'll use that to send you a direct install link right away.</p>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #888; font-style: italic;">The app is still in beta, so if anything looks off or you have suggestions, we'd love to hear from you — your feedback is genuinely appreciated!</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🎒 What to Pack for the First Day of Summer</h2>
  <div style="line-height: 2.2; margin-bottom: 8px;">
    <span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🍱 Snack + lunch</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">💧 Water bottle</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👕 Change of clothes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👟 Closed-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩴 Open-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">☀️ Sunscreen</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🥾 Boots</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩱 Swimsuit</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🏖️ Towel</span>
  </div>
  <p style="margin-bottom: 24px; font-size: 13px; color: #888; font-style: italic;">Extra shoes may be left at Sage Field — pick them up on your last day.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💻 Join Us for a Live Q&amp;A</h2>
  <p style="margin-bottom: 12px;">Still have questions before Day 1? Join us on Google Meet — drop in anytime, ask what's on your mind, and hop off whenever you'd like.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;">📅 <strong>Saturday, May 23</strong> · 11:00 AM – 12:00 PM</p>
    <p style="margin: 0;">🔗 <a href="https://meet.google.com/jxk-xkfc-mnp" style="color: #5a7a5a;">Join Google Meet</a></p>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">Sabrina will be there to answer questions about the program, schedules, Day 1 expectations, and anything else on your mind.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💳 A Note on Tuition</h2>
  <p style="margin-bottom: 12px;">To keep our small-group program running smoothly and to hold your child's spot, tuition for each week must be received by the <strong>Friday before that week begins</strong>.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;"><strong>Examples:</strong></p>
    <p style="margin: 0 0 4px 0;">Week 1 begins May 26 → Tuition due by <strong>May 22</strong></p>
    <p style="margin: 0 0 12px 0;">Week 2 begins June 1 → Tuition due by <strong>May 29</strong></p>
    <p style="margin: 0; color: #c0392b; font-size: 13px;">⚠️ A <strong>$30 late fee</strong> applies if tuition is not received by Friday at 11:59 PM.</p>
  </div>

  <p style="margin-top: 32px; margin-bottom: 4px;">See you soon! ☀️</p>
  <p style="margin-top: 4px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina &amp; the Sage Field Team</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerStartingEmail(opts: {
  g1FullName: string;
  childLegalName: string;
  program?: string | null;
}): Promise<{ subject: string; content: string }> {
  const subject = `Summer Starts This Tuesday — A Quick Note for ${opts.childLegalName}`;
  const isSummer = opts.program === "summer_26" || opts.program === "both";
  const tuitionNote = isSummer
    ? `<p style="margin-bottom: 24px; font-size: 14px; color: #555;">A quick note: tuition for each week of the summer program is due by the <strong>Friday before</strong> that week begins.</p>`
    : "";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p style="margin-bottom: 16px;">We're so excited — Sage Field Summer kicks off this <strong>Tuesday, May 26</strong>! We wanted to send a quick note to let you know that <strong>${opts.childLegalName}</strong> is very much on our radar, and we'd love to see them there.</p>

  <p style="margin-bottom: 16px;">If you haven't finished your enrollment checklist yet, you can complete it anytime through the parent portal!</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://www.sagefield.co/parent/dashboard" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Complete Your Enrollment →</a>
  </div>

  ${tuitionNote}

  <p style="margin-bottom: 24px; font-size: 14px; color: #555; text-align: center;">Questions? Just reply to this email — we're happy to help.</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">See you soon! ☀️</p>
  <p style="margin-top: 4px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina &amp; the Sage Field Team</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerFirstDayEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Summer Starts Tomorrow — Happy Memorial Day! 🌿☀️";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${opts.g1FullName},</p>

  <p style="margin-bottom: 16px;">Happy Memorial Day! 🇺🇸 We hope you're having a wonderful holiday with your family.</p>

  <p style="margin-bottom: 24px;">Tomorrow is the <strong>first day of Sage Field Summer</strong> and we couldn't be more excited to welcome <strong>${opts.childLegalName}</strong>! The space is ready, the activities are planned, and the team is thrilled. ☀️🌿</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">🚗 Drop-off &amp; Pick-up</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;">🕗 <strong>Drop-off:</strong> As early as <strong>8:15 AM</strong> · Day begins at <strong>9:00 AM</strong></p>
    <p style="margin: 0 0 6px 0;">🕒 <strong>Pick-up:</strong> School ends at <strong>3:00 PM</strong> · Latest pick-up is <strong>3:30 PM</strong></p>
    <p style="margin: 0; font-size: 13px; color: #555;">Need more time? You can sign up for <strong><a href="https://www.sagefield.co/parent/billing" style="color: #5a7a5a;">aftercare</a></strong> through your billing page.</p>
  </div>
  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">🅿️ Please <strong>park in the back</strong> — drive past the open gates and you'll find parking back there.</p>

  <div style="background: #fff8f0; border-left: 3px solid #f59e0b; padding: 16px 20px; margin: 28px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: bold; color: #92400e;">⚠️ Action Needed Before Tomorrow Morning</p>
    <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">We have some exciting <strong>cooking activities</strong> planned this week! To make sure we fully respect each child's comfort and any dietary needs, we ask that you set your participation preferences before the first day begins.</p>
    <p style="margin: 0; font-size: 14px; color: #555;">This only takes a minute — just visit your preferences page and let us know how <strong>${opts.childLegalName}</strong> would like to participate.</p>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="https://www.sagefield.co/parent/preferences" style="background: #b45309; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Set Cooking Preferences →</a>
  </div>

  <h2 style="font-size: 18px; margin-top: 36px; margin-bottom: 12px; color: #2c2c2c;">🎒 What to Pack for the First Day of Summer</h2>
  <div style="line-height: 2.2; margin-bottom: 8px;">
    <span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🍱 Snack + lunch</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">💧 Water bottle</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👕 Change of clothes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">👟 Closed-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩴 Open-toe shoes</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">☀️ Sunscreen</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🥾 Boots</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🩱 Swimsuit</span><span style="display: inline-block; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #374151; margin: 4px 4px 4px 0;">🏖️ Towel</span>
  </div>
  <p style="margin-bottom: 24px; font-size: 13px; color: #888; font-style: italic;">Extra shoes may be left at Sage Field — pick them up on your last day.</p>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">📱 The Sage Field App Is Now Available!</h2>
  <p style="margin-bottom: 12px;">If you haven't downloaded it yet, the <strong>Sage Field app is live</strong> — everything you need right in your pocket.</p>

  <div style="text-align: center; margin: 24px 0;">
    <a href="https://www.sagefield.co/download" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Download the App</a>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">With the app you can:</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 2;">
    <li>💳 Pay tuition directly</li>
    <li>📸 View the school feed</li>
    <li>💬 Message staff</li>
    <li>🌿 Join the community channel</li>
    <li>👧 Check your children's profiles</li>
    <li>📋 Go over all your enrollment forms</li>
  </ul>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 6px 0;"><strong>Android users:</strong> When you tap the Google Play button on the download page, it will prompt you with an email address — we'll use that to send you a direct install link right away.</p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 12px; color: #2c2c2c;">💳 A Note on Tuition for Future Weeks</h2>
  <p style="margin-bottom: 12px; font-size: 14px; color: #555;">To hold your child's spot each week, tuition must be received by the <strong>Friday before that week begins</strong>. Here's the schedule starting from Week 2:</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0 0 4px 0;">Week 2 begins June 1 → Tuition due by <strong>May 29</strong></p>
    <p style="margin: 0 0 4px 0;">Week 3 begins June 8 → Tuition due by <strong>June 5</strong></p>
    <p style="margin: 0 0 4px 0;">Week 4 begins June 15 → Tuition due by <strong>June 12</strong></p>
    <p style="margin: 0 0 4px 0;">Week 5 begins June 22 → Tuition due by <strong>June 19</strong></p>
    <p style="margin: 0 0 12px 0;">Week 6 begins June 29 → Tuition due by <strong>June 26</strong></p>
    <p style="margin: 0; color: #c0392b; font-size: 13px;">⚠️ A <strong>$30 late fee</strong> applies if tuition is not received by Friday at 11:59 PM.</p>
  </div>

  <p style="margin-top: 32px; margin-bottom: 4px;">See you tomorrow! ☀️</p>
  <p style="margin-top: 4px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina &amp; the Sage Field Team</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekOneNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week One is a Wrap — Our First Newsletter is Here 🌱";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">We've wrapped up our very first week of summer, and what a start it's been. The energy, curiosity, and joy the children have brought each day have made it incredibly special already.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>🔢 <strong>Hands-on math</strong> and early literacy work</li>
      <li>🌊 Exploring the <strong>water cycle</strong></li>
      <li>🍳 <strong>Cooking together</strong> as a community</li>
      <li>🎨 <strong>Making art</strong> and creative projects</li>
      <li>🐣 <strong>Caring for our chicks</strong></li>
      <li>🇪🇸 Beginning <strong>Spanish</strong> — daily words and phrases already becoming part of our routine</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've also put together our first newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our First Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our first week.</p>
    <a href="https://www.sagefield.co/newsletter/75e415fc-9036-4a37-8f53-4b04203288fc" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekone</strong></span>
    </div>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We can't wait for all that's ahead this summer. Thank you for sharing your children with us — it truly means the world. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekTwoNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "An Important Update + Week Two Newsletter 🌱";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">We've wrapped up our second week of summer, and the growth we're already seeing in the children has been truly wonderful. Each day they are becoming more confident, independent, and curious — and it shows in everything they do.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📖 <strong>CVC words &amp; phonemic awareness</strong> — letter sounds and emerging reading confidence</li>
      <li>➕ <strong>Addition with counting on</strong> — hands-on math games and group work</li>
      <li>🎨 <strong>Color mixing in the mud kitchen</strong> — sensory exploration and creativity</li>
      <li>🍝 <strong>Homemade pasta &amp; strawberry limeade popsicles</strong> — cooking and teamwork</li>
      <li>🔬 <strong>Animal research projects</strong> — independent National Geographic book reports</li>
      <li>📝 <strong>Main idea &amp; supporting details</strong> — reading comprehension skills in ELA</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our second newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Second Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our second week.</p>
    <a href="https://www.sagefield.co/newsletter/6fedf8d2-5735-451a-971c-4ab9d442710c" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weektwo</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">📢 Primary Program Update</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We wanted to share an important update regarding our Primary Program for the upcoming school year.</p>
    <p style="margin: 0 0 12px 0;">After careful consideration, <strong>Paige Wood</strong> has decided to pursue a different opportunity and will no longer be joining our school for the upcoming year. While we are saddened by this change and know many of you were looking forward to having her in our community, we fully support her decision and wish her all the best in her next chapter.</p>
    <p style="margin: 0 0 12px 0;">At the same time, we are excited to share that we are in the final stages of hiring an exceptional new Primary Guide. We have been intentional in our search and are thrilled about the educator we have selected. She brings a passion for hands-on, engaging learning experiences and aligns beautifully with the culture and values that make our school so special.</p>
    <p style="margin: 0 0 12px 0;">To ensure a <strong>smooth transition</strong>, she plans to begin spending time with us during our summer program. This will allow her to get to know our children, families, routines, and school culture before the start of the school year. We are confident this will help create a strong foundation for a successful year together.</p>
    <p style="margin: 0;">We look forward to officially introducing her very soon and sharing more about her background, experience, and exciting ideas for the classroom. We know she will bring incredible energy, creativity, and care to our Primary community.</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">✨ New: Activity Preferences Auto-Fill</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 10px 0;">We've added a new feature called <strong>Auto-fill Preference</strong> — when you set a preference level, every new activity for ${opts.childLegalName} will be automatically pre-selected. You can still adjust any activity individually at any time.</p>
    <p style="margin: 0;">This also works on the <strong>mobile app</strong> — just fully close/quit and re-open the app to see the changes.</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 New Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral. We'll take care of the rest!</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We can't wait for all that's ahead this summer. Thank you for sharing your children with us — it truly means the world. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekFourNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Four Newsletter + Meet Miss Joy 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">We've officially wrapped up four incredible weeks of summer at Sage Field — and the growth, curiosity, and connection we are seeing in your children continue to inspire us every single day. From new friendships forming to big academic breakthroughs, this week was one to remember.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📖 <strong>Summarizing Fiction &amp; Non-Fiction</strong> — Venn diagrams, comparing and contrasting texts, reading comprehension mastery</li>
      <li>✖️ <strong>Multi-Digit Multiplication</strong> — area model &amp; standard method (upper el), fact fluency numbers 6+ (lower el)</li>
      <li>🍓 <strong>Strawberry Jam</strong> — a full cooking project from maceration to stovetop simmering and jar storage</li>
      <li>☕ <strong>Donuts with Grownups</strong> — Monday July 6, 8:15–9:00am, a special morning with families</li>
      <li>🎬 <strong>Sage Field Reels</strong> — our brand-new highlight video page is live at sagefield.co/reels</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our fourth newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Fourth Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our fourth week.</p>
    <a href="https://www.sagefield.co/newsletter/5363a0e4-44b7-4ab2-909f-e673a8752627" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekfour</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎬 Sage Field Reels</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our new <strong>Sage Field Reels</strong> page, where families can enjoy short highlight videos and special moments from the past four weeks of learning, exploration, and fun.</p>
    <p style="margin: 0 0 12px 0;">These reels offer a glimpse into the daily experiences, projects, outdoor adventures, and memories being made by our students. We hope you enjoy these snapshots of life at Sage Field!</p>
    <p style="margin: 0 0 16px 0; text-align: center;">
      <a href="https://sagefield.co/reels" style="background: #2C5F2E; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 14px; display: inline-block;">Watch the Reels →</a>
    </p>
    <p style="margin: 0; text-align: center;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>childhood</strong></span>
    </p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">👋 Welcome, Miss Joy!</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We are thrilled to officially introduce the newest member of our school family, <strong>Miss Joy</strong>!</p>
    <p style="margin: 0 0 12px 0;">Finding the right teacher is something we take very seriously, and we spent considerable time carefully evaluating candidates to ensure we brought in someone who not only possesses strong teaching skills, but also embodies the values, warmth, flexibility, and dedication that are so important to our school community.</p>
    <p style="margin: 0 0 12px 0;">Miss Joy brings a genuine love for children, a positive attitude, and a passion for helping students grow both academically and personally. She studied Religious Studies at the University of Texas at El Paso and has experience working in a Reggio Emilia-inspired microschool with a rich history of over 40 years. She is drawn to approaches that respect children as capable, independent learners — which makes her a wonderful fit for Sage Field.</p>
    <p style="margin: 0 0 12px 0;">Miss Joy will officially begin with us on <strong>August 10</strong>, during the final week of our Summer Program. This will give her a wonderful opportunity to begin getting to know our students, families, routines, and culture before the start of the new school year.</p>
    <p style="margin: 0;">Please join us in giving Miss Joy a warm welcome when you see her around campus. We are so excited for this next chapter!</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🏡 Logistical Updates</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">Based on family feedback, we have now established a <strong>weekly mowing service</strong> and a <strong>monthly pest control service</strong> to help keep our outdoor learning environment safe and comfortable for students.</p>
    <p style="margin: 0;">To prioritize student safety, all pest control treatments will take place <strong>after school on Fridays</strong>, ensuring that students do not return to campus for more than <strong>50 hours after treatment</strong>. We appreciate your partnership and are committed to maintaining a safe, well-cared-for environment for all of our students.</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral. We'll take care of the rest!</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We're so grateful for your continued trust and partnership — it is a privilege to serve your families each day. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekFiveNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Five Newsletter 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 20px;">It's such a joy to pause and notice all the goodness happening in our community. I am deeply grateful for this wonderful group of families who have come together to support the work we're doing at Sage Field. Throughout each day, we find moments of slowness, peace, presence, and intentionality — and it's a gift to hear our children laugh, play, ask thoughtful questions, and live with so much curiosity and wonder.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📖 <strong>Primary Core Skills</strong> — reading, letter recognition, CVC words, and foundational math</li>
      <li>🏠 <strong>Animal Architects</strong> — exploring animal homes and the structures they build</li>
      <li>🐍 <strong>Snakes</strong> — student-led discussions and a guided snake craft (product art)</li>
      <li>🍳 <strong>Egg Bites &amp; Popsicles</strong> — food prep and fine motor skills in the kitchen</li>
      <li>📚 <strong>Elementary ELA</strong> — making inferences using context clues</li>
      <li>✖️ <strong>Math</strong> — division strategies (upper el) and multiplication practice (lower el)</li>
      <li>🌍 <strong>Cross-Curricular Science</strong> — natural disaster research project</li>
      <li>📦 <strong>Shoe Box Request</strong> — please send a shoe box next week for our diorama project!</li>
      <li>🍎 <strong>Pack Extra Snacks</strong> — students tend to get hungry around 1:30–2pm</li>
      <li>🎉 <strong>Community Updates</strong> — new kids joining us, a second sand delivery, and we doubled our mud kitchen!</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our fifth newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Fifth Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our fifth week.</p>
    <a href="https://www.sagefield.co/newsletter/7ab1be0a-0d8c-4f4f-b101-f097b438b778" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekfive</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎬 Sage Field Reels</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our new <strong>Sage Field Reels</strong> page, where families can enjoy short highlight videos and special moments from the past four weeks of learning, exploration, and fun.</p>
    <p style="margin: 0 0 12px 0;">These reels offer a glimpse into the daily experiences, projects, outdoor adventures, and memories being made by our students. We hope you enjoy these snapshots of life at Sage Field!</p>
    <p style="margin: 0 0 16px 0; text-align: center;">
      <a href="https://sagefield.co/reels" style="background: #2C5F2E; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 14px; display: inline-block;">Watch the Reels →</a>
    </p>
    <p style="margin: 0; text-align: center;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>childhood</strong></span>
    </p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral. We'll take care of the rest!</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We're so grateful for your continued trust and partnership — it is a privilege to serve your families each day. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekThreeNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Three Newsletter + $500 Referral Program 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">Week 3 at Sage Field has been all about embracing independence and community. From Montessori work cycles where students chose their own path, to phonics breakthroughs, delicious cooking projects, a joyful Lunch with a Loved One, and a splashy beach bash Field Friday — it was a week full of growth, connection, and fun.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>🔤 <strong>Phonics</strong> — letter identification, CVC words, blends, digraphs, and Magic E patterns</li>
      <li>✖️ <strong>Math</strong> — multiplication arrays (lower el), 2-digit × 1-digit (upper el), and a hands-on area &amp; perimeter zoo project</li>
      <li>📚 <strong>ELA</strong> — context clues, vocabulary building, and a charades game to bring it all to life</li>
      <li>🍌 <strong>Cooking</strong> — banana bread chocolate chip muffins and banana yogurt popsicles</li>
      <li>🍽️ <strong>Life Skills</strong> — a real dishwashing lesson using our play kitchen (kids were incredible!)</li>
      <li>🏖️ <strong>Field Friday Beach Bash</strong> — inflatable water slide, ocean-themed slime, ice cream bar, and painted sea shells</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our third newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Third Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our third week.</p>
    <a href="https://www.sagefield.co/newsletter/6d9846b6-68b6-4d59-8e57-aa8b2b0db7b5" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekthree</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">👨‍👩‍👧 Community Corner</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">Thank you so much to everyone who joined us for <strong>Lunch with a Loved One</strong>. It was such a joyful event and a beautiful reflection of the strong community we're building together. For those who weren't able to attend, please know you are very much a part of this community and we appreciate you deeply.</p>
    <p style="margin: 0;">Our next family event is coming up — <strong>"Donuts with Grown Ups"</strong> during drop-off on <strong>July 6th (8:15–9:00am)</strong>. We hope to see you there!</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 New Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to introduce our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral. We'll take care of the rest!</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We're looking forward to another wonderful week ahead. Thank you for sharing your children with us — it truly means the world. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildFreeFridayAnnouncementEmail(opts: {
  parentName: string;
  childName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;
  const subject = "This Friday: Bring a Friend to Sage Field for Free 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Hi ${firstName},</p>

  <p>This Friday, June 5th — we'd love for <strong>${opts.childName}</strong> to bring a friend along for the day. Completely free, no strings attached.</p>

  <p>If you know another family with a child who might love Sage Field, this is the perfect chance to let them experience a real day with us. They'll join right in — learning, exploring, cooking, playing — just like any other Friday.</p>

  <p>And if <strong>${opts.childName}</strong> isn't already signed up for this Field Friday, they're welcome to come too — completely free. Just reply to this email and we'll get them added.</p>

  <div style="background-color: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 18px 20px; margin: 28px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #2c2c2c;">📅 Friday, June 5, 2026</p>
    <p style="margin: 4px 0; color: #555;">🕗 Drop-off: 8:15 – 9:00 AM</p>
    <p style="margin: 4px 0; color: #555;">🕒 Pick-up: 1:00 PM</p>
    <p style="margin: 4px 0; color: #555;">📍 2760 Gattis School Rd, Round Rock TX</p>
    <p style="margin: 4px 0; color: #555;">👧 Ages 4–11 · 💰 Completely Free</p>
  </div>

  <p>All they need to do is register — it takes about a minute. Have them use the link below, or pass it along:</p>

  <p style="text-align: center; margin: 28px 0;">
    <a href="https://sagefield.co/free"
       style="display: inline-block; background-color: #2C5F2E; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-family: Georgia, serif;">
      Reserve Their Free Spot →
    </a>
  </p>

  <p style="font-size: 14px; color: #555;"><strong>What to pack:</strong> Sunscreen (applied before drop-off), swimsuit + towel, change of clothes, labeled water bottle, bug spray, snack + lunch from home.</p>

  <p>If you have any questions, you're always welcome to text or call at <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you Friday!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildFreeFridayAttendanceConfirmationEmail(opts: {
  parentName: string;
  childName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0] || opts.parentName;
  const subject = `See you tomorrow, ${firstName}! Free Friday details 🌿`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Hi ${firstName},</p>

  <p>You're all set! We're looking forward to having <strong>${opts.childName}</strong> join us tomorrow for Free Friday at Sage Field. 🌿</p>

  <p>Here's everything you need for a smooth drop-off:</p>

  <div style="background-color: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 18px 20px; margin: 28px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #2c2c2c;">📅 Friday, June 5, 2026</p>
    <p style="margin: 4px 0; color: #555;">🕗 Drop-off: 8:15 – 9:00 AM</p>
    <p style="margin: 4px 0; color: #555;">🕒 Pick-up: 1:00 PM</p>
    <p style="margin: 4px 0; color: #555;">📍 2760 Gattis School Rd, Round Rock TX</p>
    <p style="margin: 4px 0; color: #555;">👧 Ages 4–11 · 💰 Completely Free</p>
  </div>

  <p style="font-weight: bold; color: #2c2c2c; margin-bottom: 8px;">🎒 What to pack:</p>
  <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #555;">
    <li style="margin-bottom: 4px;">🧴 Sunscreen — applied before drop-off</li>
    <li style="margin-bottom: 4px;">🩱 Swimsuit + towel</li>
    <li style="margin-bottom: 4px;">👕 Change of clothes</li>
    <li style="margin-bottom: 4px;">💧 Water bottle, labeled</li>
    <li style="margin-bottom: 4px;">🦟 Bug spray</li>
    <li style="margin-bottom: 4px;">🥪 Snack + lunch from home</li>
  </ul>

  <p>Kids will be outside most of the day — exploring, learning, cooking, and playing. It'll be a great one.</p>

  <p>If you have any questions or need to reach us, text or call at <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">See you tomorrow!</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildOneTimePaymentConfirmationEmail(opts: {
  payerName: string;
  amountDollars: string;
  memo?: string;
}): Promise<{ subject: string; content: string }> {
  const displayName = opts.payerName.split(" ")[0] || opts.payerName;
  const subject = "Payment Received — Sage Field School";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${displayName},</p>

  <p>We have received your payment of <strong>$${opts.amountDollars}</strong> to Sage Field School. Thank you!</p>

${opts.memo ? `  <p style="padding: 12px 16px; background: #f7f4f0; border-left: 3px solid #a8c5a0; margin: 24px 0;">📋 <strong>Memo:</strong> ${opts.memo}</p>` : ""}

  <p>If you have any questions about this payment or anything else, feel free to reach out at <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> or text <a href="sms:+15126775872" style="color: #5a7a5a;">(512) 677-5872</a>.</p>

  <p style="margin-top: 32px;">Thank you,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build confirmation email for the person who submitted a referral
 */
export async function buildReferralConfirmationEmail(opts: {
  referrerName: string;
  referredName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "Your Referral to Sage Field Has Been Sent!";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.referrerName},</p>

  <p>Thank you for referring <strong>${opts.referredName}</strong> to Sage Field! We've just sent them an introduction email and will be following up personally to answer any questions they have.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 24px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; font-size: 15px;">Your $250 Gift Card</p>
    <p style="margin: 0; font-size: 14px; color: #555;">Once <strong>${opts.referredName}</strong>'s family pays their enrollment fee, we'll send both of you a $250 gift card of your choice — Amazon, Target, Visa prepaid, and more. Gift cards are delivered within 5–7 business days of payment clearing.</p>
  </div>

  <p>There's no limit to how many families you can refer — each successful enrollment earns both parties a $250 gift card.</p>

  <p>If you have any questions in the meantime, don't hesitate to reach out.</p>

  <p style="margin-top: 32px;">With gratitude,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build rich invite email for the family being referred
 */
export async function buildReferralInviteEmail(opts: {
  referrerName: string;
  referredName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = `${opts.referrerName} thinks your family would love Sage Field 🌿`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.referredName},</p>

  <p><strong>${opts.referrerName}</strong> thought your family might love what we're building at Sage Field, and wanted to personally introduce you. We're so glad they did.</p>

  <h2 style="font-size: 20px; margin-top: 32px; margin-bottom: 8px; color: #2C5F2E;">What Is Sage Field?</h2>
  <p>Sage Field Private School is a small, outdoor-focused microschool in <strong>Round Rock, Texas</strong>, serving children ages <strong>4–11</strong>. We're not a daycare, and we're not a traditional school — we're something better: a hands-on, nature-rich academic environment where every child is truly known.</p>

  <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px; margin: 24px 0;">
    <tr>
      <td style="padding: 14px 16px; background: #f7f4f0; border-radius: 8px; vertical-align: top; width: 50%;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #2C5F2E;">👥 Tiny Classes</p>
        <p style="margin: 0; font-size: 13px; color: #555;">~10 students per class. Every child gets real attention — no one gets lost in the crowd.</p>
      </td>
      <td style="padding: 14px 16px; background: #f7f4f0; border-radius: 8px; vertical-align: top; width: 50%;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #2C5F2E;">🌿 Outdoor Every Day</p>
        <p style="margin: 0; font-size: 13px; color: #555;">Nature study, gardening, animal care, and outdoor learning are woven into every week.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 16px; background: #f7f4f0; border-radius: 8px; vertical-align: top;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #2C5F2E;">📚 Real Academics</p>
        <p style="margin: 0; font-size: 13px; color: #555;">TEKS-aligned literacy and math, ability-grouped — not grade-grouped — so every child works at their actual level.</p>
      </td>
      <td style="padding: 14px 16px; background: #f7f4f0; border-radius: 8px; vertical-align: top;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #2C5F2E;">🎨 Whole-Child Learning</p>
        <p style="margin: 0; font-size: 13px; color: #555;">Montessori, Waldorf &amp; Reggio-inspired methods. Art, music, cooking, and social-emotional growth every week.</p>
      </td>
    </tr>
  </table>

  <h2 style="font-size: 20px; margin-top: 32px; margin-bottom: 12px; color: #2C5F2E;">Our Programs</h2>

  <a href="https://sagefield.co/summer-2026" style="display: block; text-decoration: none; color: inherit; border: 1px solid #e0dbd5; border-radius: 8px; padding: 14px 18px; margin-bottom: 10px;">
    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #2C5F2E;">☀️ Summer 2026</p>
    <p style="margin: 0 0 4px 0; font-weight: bold; color: #2c2c2c;">May 26 – August 13, 2026</p>
    <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">Twelve weeks of themed academic enrichment — Mon–Thu, ~6 hrs/day. Literacy, math, nature, art, music, cooking, and water play every week.</p>
    <p style="margin: 0; font-size: 13px; color: #5a7a5a;">Learn more →</p>
  </a>

  <a href="https://sagefield.co/school-year-2026-2027" style="display: block; text-decoration: none; color: inherit; border: 1px solid #e0dbd5; border-radius: 8px; padding: 14px 18px; margin-bottom: 10px;">
    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #2C5F2E;">📚 School Year 2026–2027</p>
    <p style="margin: 0 0 4px 0; font-weight: bold; color: #2c2c2c;">Starting August 17, 2026</p>
    <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">Up to 4 days/week of structured small-group learning. A six-month commitment with individualized academic support for ages 4–11.</p>
    <p style="margin: 0; font-size: 13px; color: #5a7a5a;">Learn more →</p>
  </a>

  <a href="https://sagefield.co/homeschool" style="display: block; text-decoration: none; color: inherit; border: 1px solid #e0dbd5; border-radius: 8px; padding: 14px 18px; margin-bottom: 10px;">
    <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #2C5F2E;">🏡 Homeschool Drop-In</p>
    <p style="margin: 0 0 4px 0; font-weight: bold; color: #2c2c2c;">1–3 Days Per Week</p>
    <p style="margin: 0 0 6px 0; font-size: 14px; color: #555;">Flexible enrichment days without a long-term commitment. Choose your schedule — and every Friday is a themed Field Day adventure.</p>
    <p style="margin: 0; font-size: 13px; color: #5a7a5a;">Learn more →</p>
  </a>

  <p style="text-align: center; margin: 4px 0 20px 0; font-size: 13px;">
    <a href="https://sagefield.co" style="color: #5a7a5a;">Learn more about Sage Field →</a>
  </p>

  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; color: #92400e;">🎁 Your Family Gets $250 Too</p>
    <p style="margin: 0; font-size: 14px; color: #78350f;">As a referred family, you'll receive a <strong>$250 gift card</strong> of your choice (Amazon, Target, Visa prepaid, and more) once your enrollment fee is processed. No code needed — we send it directly to you.</p>
  </div>

  <div style="text-align: center; margin: 36px 0;">
    <a href="https://sagefield.co/apply" style="display: inline-block; background: #2C5F2E; color: #ffffff; font-family: Georgia, serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 8px;">Apply Now →</a>
    <p style="margin: 12px 0 0 0; font-size: 13px; color: #888;">sagefield.co/apply &nbsp;·&nbsp; Round Rock, TX &nbsp;·&nbsp; Ages 4–11</p>
  </div>

  <p>We'd love to meet your family. Feel free to reach out at any time — I personally answer every email.</p>

  <p style="margin-top: 32px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field Private School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildGoogleReviewIncentiveEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0] || opts.g1FullName;
  const subject = `We'd love to hear about your Sage Field experience ☕`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p>Dear ${firstName},</p>

  <p>It has been such a joy having ${opts.childLegalName} with us at Sage Field. Watching the kids grow, explore, and light up each week is why we do what we do — and families like yours make it all possible.</p>

  <p>We'd love to hear about your experience in your own words. Your perspective means so much to us, and it helps other families find the right environment for their child.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 20px 24px; margin: 28px 0; border-radius: 4px;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #2C5F2E; font-size: 16px;">☕ Free Coffee, On Us</p>
    <p style="margin: 0 0 6px 0; font-size: 15px;"><strong>Reply to this email</strong> with a short testimonial about your family's experience at Sage Field — and we'll send you a <strong>$15 Starbucks gift card</strong> as a little thank-you.</p>
    <p style="margin: 0; font-size: 14px; color: #555;">It doesn't need to be long. A few honest sentences from the heart is more than enough.</p>
  </div>

  <p style="margin-bottom: 8px;">To help get you started, here are a few prompts — feel free to answer one or all of them:</p>
  <ul style="padding-left: 20px; margin: 0 0 24px 0; color: #2c2c2c; font-size: 15px; line-height: 2;">
    <li>What has ${opts.childLegalName} enjoyed most at Sage Field?</li>
    <li>How has the program impacted them or your family?</li>
    <li>Is there a specific moment or experience that stood out?</li>
    <li>Would you recommend Sage Field to another family, and why?</li>
  </ul>

  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 4px 0; font-weight: bold; color: #92400e;">✨ Your words may be featured on our website</p>
    <p style="margin: 0; font-size: 14px; color: #78350f;">With your permission, standout testimonials may be shared on <a href="https://sagefield.co" style="color: #92400e;">sagefield.co</a> to help other families discover what makes Sage Field special. We'll always reach out before featuring anything.</p>
  </div>

  <p>Thank you for being part of our community. We are so grateful for your trust and your support.</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekSixNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Six Newsletter 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 20px;">We are incredibly proud of every student and the growth we are seeing each day. In Miss Sabrina's Primary class, students are becoming more and more resilient as they work through challenges, stretch their brains, and continue learning how to be thoughtful students, kind friends, and confident young learners. In Ms. Zelinda's Elementary class, students have been diving deep into multi-step problem solving, rich literacy work, and an exciting Natural Disaster research project. It is so special to watch both groups thrive.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📖 <strong>Primary Core Skills</strong> — reading, letter recognition, and foundational math building confidence every day</li>
      <li>🥞 <strong>Banana Oatmeal Pancakes &amp; Pineapple Popsicles</strong> — students made both completely from scratch!</li>
      <li>🍳 <strong>Cooking Together</strong> — food safety, careful movements, following directions, and cooperative work</li>
      <li>📝 <strong>Elementary ELA</strong> — comparing and contrasting across texts using Venn Diagrams</li>
      <li>➕ <strong>Math: Multi-Step Word Problems</strong> — upper el tackled multiplication, subtraction, division &amp; addition; lower el worked two-step equations with two-digit numbers</li>
      <li>🌍 <strong>Natural Disaster Projects</strong> — final drafts nearly complete; 3D models coming next!</li>
      <li>📦 <strong>Shoe Box Reminder</strong> — please send a shoe box by <strong>Wednesday</strong> for our 3D model building</li>
      <li>🎉 <strong>Halfway There!</strong> — six weeks done, and what an incredible journey it's been</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our sixth newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Sixth Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our sixth week.</p>
    <a href="https://sagefield.co/newsletter/83274eee-3358-41dc-bc85-dd4ac827537c" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weeksix</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to share our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral.</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We are so thankful for each of your families and for the beautiful community we are building together. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sage Field School</strong></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekSevenNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Seven Newsletter 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 20px;">What an incredible week it has been! We are so proud of the engagement, growth, and pride in progress we are seeing from every student. From hands-on math to Field Friday adventures, this week reminded us just how special our little community truly is.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📐 <strong>Fractions (Upper El)</strong> — LCM, reducing fractions, adding fractions, and converting improper fractions to mixed numbers</li>
      <li>➕ <strong>Fractions (Lower El)</strong> — numerator/denominator basics, adding with common denominators, comparing fractions, and hands-on manipulatives</li>
      <li>📖 <strong>ELA: Author's Purpose &amp; Theme</strong> — upper el tackled lengthy passages with comprehension questions; lower el worked on independent reading while finding theme and author's purpose</li>
      <li>🦕 <strong>Field Friday: Dino Hunt!</strong> — fossil hunt in oobleck, salt dough fossil pressing, a dinosaur egg hunt, and water play; we also celebrated Ms. Joy's soft launch on campus!</li>
      <li>🫧 <strong>Bubble Wands (Primary)</strong> — fine motor skills, multi-step directions, patience, grip strength, and perseverance all wrapped into one beautiful activity</li>
      <li>👩‍🍳 <strong>Independent Cooking (Primary)</strong> — first week of fully independent cooking; students showed incredible peer leadership, collaboration, and measuring skills</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our seventh newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Seventh Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our seventh week.</p>
    <a href="https://sagefield.co/newsletter/6040970f-fb5a-4127-ab36-3c9fdcbc63a6" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekseven</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to share our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral.</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <h2 style="font-size: 17px; color: #b45309; margin-top: 32px; margin-bottom: 14px;">🌟 Share Your Story</h2>
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">Has Sage Field made a difference for your family? We'd love to hear about it — and so would other families looking for the right fit for their child.</p>
    <p style="margin: 0 0 12px 0;">As a thank-you for sharing your experience, we'll send you a <strong>$15 Starbucks gift card ☕</strong>. It only takes a few minutes and means the world to us.</p>
    <div style="text-align: center; margin-top: 16px;">
      <a href="https://sagefield.co/testimonial" style="background: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Share a Testimonial →</a>
    </div>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We are so thankful for each of your families and for the beautiful community we are building together. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sage Field School</strong></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSummerWeekEightNewsletterEmail(opts: {
  g1FullName: string;
  childLegalName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName.split(" ")[0];
  const subject = "Week Eight Newsletter 🌿";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 20px;">We have loved every moment of spending these weeks with our community — soaking up sunshine, heading out on adventures, and watching your children grow in the most beautiful ways. Week Eight was no exception.</p>

  <p style="margin-bottom: 20px;">In Miss Sabrina's Primary class, students dove into National Geographic books and were especially fascinated by weird sea creatures, and continued building foundational reading and math skills through hands-on play.</p>

  <p style="margin-bottom: 20px;">In Ms. Zelinda's Elementary class, students are in the final stretch — only 3 weeks left! Upper El tackled multiplying mixed numbers and fractions, worked on ELA paragraph writing and text organization using description diagrams, and completed their natural disaster models on Wednesday using incredibly creative materials. Lower El has officially mastered fractions and is now joining Upper El for math. And Field Friday brought Pirate Adventures — complete with an obstacle course, water slide, hat and eye patch making, and a backyard scavenger hunt!</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 What We've Been Up To</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>📚 <strong>National Geographic Exploration (Primary)</strong> — fascinating discoveries all week; this week's favorite: weird sea creatures!</li>
      <li>🔢 <strong>Fractions: Mixed Numbers → Improper Fractions (Upper El)</strong> — multiplying mixed numbers and continuing fraction mastery</li>
      <li>➗ <strong>Fraction Mastery (Lower El)</strong> — officially mastered fractions and now joining Upper El for math!</li>
      <li>✏️ <strong>ELA: Paragraph Writing &amp; Text Organization (Upper El)</strong> — description diagrams, 6–7 sentence paragraphs, and a focus on spelling and grammar</li>
      <li>🌋 <strong>Natural Disasters Models</strong> — completed Wednesday using creative and inventive materials</li>
      <li>🏴‍☠️ <strong>Field Friday: Pirate Adventures</strong> — obstacle course → water slide → hat &amp; eye patch making → backyard scavenger hunt</li>
    </ul>
  </div>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our eighth newsletter — a closer look at the week through photos and classroom moments.</p>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 Our Eighth Newsletter is Live!</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our eighth week.</p>
    <a href="https://sagefield.co/newsletter/da88077b-926f-4f87-886a-78a72d18fb92" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>weekeight</strong></span>
    </div>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">📣 Upcoming Announcements</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <li>🌿 <strong>Community Garden Day</strong> — Thursday, August 27 | 5:30–7:00 PM; join us for planting, painting, snacks, and community! More details + RSVP link coming your way by email.</li>
      <li>🏫 <strong>School starts Monday, August 17</strong> — August tuition is due August 10. Visit your billing page: <a href="https://www.sagefield.co/parent/billing" style="color: #2C5F2E;">sagefield.co/parent/billing</a></li>
    </ul>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to share our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our upcoming school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral.</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our summer program.</p>
  </div>

  <h2 style="font-size: 17px; color: #b45309; margin-top: 32px; margin-bottom: 14px;">🌟 Share Your Story</h2>
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">Has Sage Field made a difference for your family? We'd love to hear about it — and so would other families looking for the right fit for their child.</p>
    <p style="margin: 0 0 12px 0;">As a thank-you for sharing your experience, we'll send you a <strong>$15 Starbucks gift card ☕</strong>. It only takes a few minutes and means the world to us.</p>
    <div style="text-align: center; margin-top: 16px;">
      <a href="https://sagefield.co/testimonial" style="background: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Share a Testimonial →</a>
    </div>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">We are so thankful for each of your families and for the beautiful community we are building together. 🌱</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sage Field School</strong></p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildMeetTheTeacherJoyEmail(opts: {
  parentName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0];
  const subject =
    "You're invited — Meet Miss Joy! Monday, July 13 | 5:30–6:30pm";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p style="margin-bottom: 20px;">We are so excited to invite you to a special evening at Sage Field — a chance to meet our wonderful new teacher, Miss Joy Paige, and get a warm, detailed look at what your child's days will look like this fall.</p>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">Event Details</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0 0 6px 0;"><strong>Date:</strong> <strong>Monday, July 13</strong></p>
    <p style="margin: 0 0 6px 0;"><strong>Time:</strong> <strong>5:30pm – 6:30pm</strong></p>
    <p style="margin: 0;"><strong>Location:</strong> <strong><a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #2C5F2E;">2760 Gattis School Rd, Round Rock, TX 78664</a></strong></p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">About Miss Joy</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px; font-size: 15px;">
    <p style="margin: 0;">Miss Joy Paige is a passionate early childhood educator with a background in Reggio Emilia-inspired learning. She brings hands-on exploration in gardening, engineering, art, literacy, and science — and creates a classroom where children feel confident, curious, and empowered to take ownership of their learning. She loves storytelling, history, and building meaningful connections with every child.</p>
  </div>

  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">Program Agenda</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #e0dbd5;">
        <td style="width: 36px; padding: 10px 8px 10px 0; vertical-align: top; font-size: 18px;">👋</td>
        <td style="padding: 10px 0; vertical-align: top;"><strong>Welcome &amp; all about Miss Joy</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #e0dbd5;">
        <td style="width: 36px; padding: 10px 8px 10px 0; vertical-align: top; font-size: 18px;">🗓️</td>
        <td style="padding: 10px 0; vertical-align: top;"><strong>A day in our life at Sage Field</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #e0dbd5;">
        <td style="width: 36px; padding: 10px 8px 10px 0; vertical-align: top; font-size: 18px;">🧩</td>
        <td style="padding: 10px 0; vertical-align: top;"><strong>How Primary block stations work</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #e0dbd5;">
        <td style="width: 36px; padding: 10px 8px 10px 0; vertical-align: top; font-size: 18px;">📚</td>
        <td style="padding: 10px 0; vertical-align: top;"><strong>Our weekly curriculum</strong></td>
      </tr>
      <tr>
        <td style="width: 36px; padding: 10px 8px 10px 0; vertical-align: top; font-size: 18px;">🎂</td>
        <td style="padding: 10px 0; vertical-align: top;"><strong>Birthday circle celebration</strong></td>
      </tr>
    </table>
  </div>

  <p style="margin-bottom: 20px;">We can't wait for you to meet Miss Joy and get a feel for the warmth and intentionality she brings to every moment in the classroom. We hope to see you there!</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br/>
  Sage Field School<br/>
  <a href="mailto:sabrina@sagefield.co" style="color: #2C5F2E;">sabrina@sagefield.co</a><br/>
  (512) 677-5872</p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildMeetTheTeacherJoyReminderEmail(opts: {
  parentName: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.parentName.split(" ")[0];
  const subject =
    "Reminder — Meet Miss Joy is TOMORROW! Monday, July 13 | 5:30–6:30pm";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Dear ${firstName},</p>

  <p style="margin-bottom: 20px;">Just a quick reminder — <strong>Meet Miss Joy is tomorrow evening!</strong> We'd love to see you there for what's sure to be a wonderful evening together.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0 0 6px 0;"><strong>Date:</strong> <strong>Monday, July 13</strong></p>
    <p style="margin: 0 0 6px 0;"><strong>Time:</strong> <strong>5:30pm – 6:30pm</strong></p>
    <p style="margin: 0;"><strong>Location:</strong> <strong><a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #2C5F2E;">2760 Gattis School Rd, Round Rock, TX 78664</a></strong></p>
  </div>

  <p style="margin-bottom: 20px;">Come meet Miss Joy Paige, hear about what a day at Sage Field looks like, and ask any questions you have before the school year begins.</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br/>
  Sage Field School<br/>
  <a href="mailto:sabrina@sagefield.co" style="color: #2C5F2E;">sabrina@sagefield.co</a><br/>
  (512) 677-5872</p>

</body>
</html>
  `.trim();

  return { subject, content };
}

/**
 * Build HTML confirmation email after a family RSVPs for Meet Miss Joy
 */
export async function buildMeetMissJoyRSVPEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = "You're all set for Meet Miss Joy! — Monday, July 13";
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>You're all set for <strong>Meet Miss Joy</strong>! We're so glad you'll be joining us for this special evening and we can't wait to introduce you to our Primary Lead Teacher.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">Event Details</p>
    <p style="margin: 4px 0;"><strong>Date:</strong> Monday, July 13, 2026</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> 5:30 – 6:30 PM</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> <a href="https://maps.google.com/?q=2760+Gattis+School+Rd,+Round+Rock,+TX+78664" style="color: #5a7a5a;">2760 Gattis School Rd, Round Rock, TX 78664</a></p>
  </div>

  <h2 style="font-size: 18px; margin-top: 32px; margin-bottom: 8px; color: #2c2c2c;">What to Expect</h2>
  <ul style="padding-left: 20px;">
    <li style="margin-bottom: 8px;">👋 <strong>Welcome &amp; All About Miss Joy</strong> — Get to know her background, teaching philosophy, and what she brings to the Primary classroom every day.</li>
    <li style="margin-bottom: 8px;">🗓️ <strong>A Day in Our Life at Sage Field</strong> — We'll walk you through a typical morning from arrival to stations, outdoor time, and circle.</li>
    <li style="margin-bottom: 8px;">🧩 <strong>How Primary Block Stations Work</strong> — See how students rotate through hands-on learning centers designed around the Reggio Emilia approach.</li>
    <li style="margin-bottom: 8px;">📚 <strong>Our Weekly Curriculum</strong> — Reading, math, science, art, and nature all woven together into a cohesive weekly rhythm.</li>
    <li style="margin-bottom: 8px;">🎂 <strong>Birthday Circle Celebration</strong> — Join us for a special birthday circle, a beloved Sage Field tradition that closes every special gathering.</li>
  </ul>

  <p>This is a free, intimate evening open to all families. No enrollment required — just come as you are and bring your questions!</p>

  <p>If you need to reach us before the event, feel free to get in touch:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildTestimonialConfirmationEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = `Thank you for sharing your story, ${opts.firstName}! 🌿`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>Thank you so much for sharing your Sage Field experience with us. Stories like yours help other families find a place where their children can truly thrive — and we're so grateful you took the time to write.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px; color: #5a7a5a;">☕ Coffee on us!</p>
    <p style="margin: 0; font-size: 15px;">As a small thank-you, we'd love to send you a <strong>$15 Starbucks gift card</strong>. Once we've had a chance to review your story, we'll reach out with your gift. It's the least we can do for sharing such a thoughtful reflection.</p>
  </div>

  <p>We'll review your submission with care and be in touch soon. If you have any questions in the meantime, feel free to reach out:</p>

  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">With gratitude,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSchoolYearCommitmentEmail(opts: {
  firstName: string;
}): Promise<{ subject: string; content: string }> {
  const subject = `Thanks for letting us know, ${opts.firstName}! 🌿`;
  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">
  <p style="margin-bottom: 24px;">Dear ${opts.firstName},</p>

  <p>Thank you for taking a moment to let us know your thoughts on the <strong>2026–2027 school year</strong>. We truly appreciate you sharing your family's plans with us — it helps us make sure every family who wants a spot has one.</p>

  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; margin: 28px 0;">
    <p style="margin: 0; font-size: 15px;">We'll be in touch as enrollment opens. Sabrina will reach out personally to walk you through next steps and answer any questions you have.</p>
  </div>

  <p>In the meantime, if anything changes or you have questions, don't hesitate to reach out:</p>
  <ul style="padding-left: 20px; margin: 8px 0;">
    <li style="margin-bottom: 6px;">📧 Email: <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></li>
    <li style="margin-bottom: 6px;">📱 Call/Text: <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a></li>
  </ul>

  <p style="margin-top: 32px;">We can't wait to keep growing with your family. 🌿</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;"><strong>Sabrina</strong><br />Sage Field School<br /><a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a></p>
</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSchoolYearCommitmentRequestEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] ?? "there";
  const childFirstName = opts.childLegalName?.split(" ")[0] ?? "your child";

  const subject = `A spot is waiting for ${childFirstName} — school year starts August 17 🌿`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 16px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">What a summer it's been — we are so grateful to have had ${childFirstName} with us this season. Watching your family become part of the Sage Field community has been a true joy.</p>

  <p style="margin-bottom: 24px;">As summer draws to a close, we want to make sure <strong>${childFirstName}'s spot is ready for the 2026–2027 school year</strong> if your family plans to continue.</p>

  <div style="background: #fef3c7; border-left: 4px solid #d97706; border-radius: 6px; padding: 14px 18px; margin: 0 0 28px 0;">
    <p style="margin: 0; font-size: 15px; color: #92400e;"><strong>⏰ Deadline: July 17</strong> — one month before the August 17 school year start</p>
  </div>

  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #2c2c2c;">Ready to share your family's plans? It only takes a minute.</p>
    <a href="https://sagefield.co/school-year-2026-commitment"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Let us know your plan →
    </a>
  </div>

  <p style="margin-bottom: 10px; font-weight: bold; color: #2C5F2E;">Why let us know by July 17?</p>
  <ul style="padding-left: 20px; margin: 0 0 28px 0;">
    <li style="margin-bottom: 8px;">🏡 <strong>Secure ${childFirstName}'s spot</strong> before enrollment opens to new families</li>
    <li style="margin-bottom: 8px;">📋 <strong>Help Sage Field plan staffing</strong> and classroom capacity for the year</li>
    <li style="margin-bottom: 8px;">🎒 <strong>Get early access</strong> to program details and supply lists</li>
  </ul>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">No commitment required — even a "not this year" is incredibly helpful. It lets us plan thoughtfully and ensures another family on the waitlist can get a spot in time.</p>

  <p style="margin-top: 32px;">With so much warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}

function schoolYearTuitionByGradeTableHtml(marginBottom = "28px"): string {
  const primaryMonthly = formatCents(SCHOOL_YEAR_TUITION_PRIMARY_CENTS);
  const primaryAnnual = formatCents(SCHOOL_YEAR_TUITION_PRIMARY_CENTS * 10);
  const upperMonthly = formatCents(SCHOOL_YEAR_TUITION_UPPER_CENTS);
  const upperAnnual = formatCents(SCHOOL_YEAR_TUITION_UPPER_CENTS * 10);

  return `
  <p style="margin-bottom: 10px; font-weight: bold; color: #2C5F2E; font-size: 16px;">Tuition by Grade Level</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: ${marginBottom}; font-size: 14px;">
    <thead>
      <tr style="background: #f7f4f0;">
        <th style="text-align: left; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Grade</th>
        <th style="text-align: right; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Monthly Payment</th>
        <th style="text-align: right; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Annual Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">PreK – 1st Grade</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${primaryMonthly} / month</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${primaryAnnual}</td>
      </tr>
      <tr style="background: #fafaf8;">
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">2nd – 4th Grade</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${upperMonthly} / month</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${upperAnnual}</td>
      </tr>
    </tbody>
  </table>`;
}

function homeschoolDropInPricingTableHtml(marginBottom = "28px"): string {
  const rows = HOMESCHOOL_TIERS.map((tier, i) => {
    const pricing = HOMESCHOOL_SCHOOL_YEAR_PRICING[tier.key];
    const rowStyle = i % 2 === 1 ? ' style="background: #fafaf8;"' : "";
    return `
      <tr${rowStyle}>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">${tier.label}</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${formatCents(pricing.primary)} / month</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">${formatCents(pricing.upper)} / month</td>
      </tr>`;
  }).join("");

  return `
  <p style="margin-bottom: 10px; font-weight: bold; color: #2C5F2E; font-size: 16px;">Monthly Drop-In Pricing by Schedule</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: ${marginBottom}; font-size: 14px;">
    <thead>
      <tr style="background: #f7f4f0;">
        <th style="text-align: left; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Schedule</th>
        <th style="text-align: right; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Primary (PreK–1st)</th>
        <th style="text-align: right; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Upper (2nd–4th)</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>`;
}

export async function buildSchoolYearTuitionInfoEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] || "there";

  const subject = `School Year Tuition & Billing Info — 2026–2027`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 12px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">
    We are so excited to welcome your family for the 2026–2027 school year, starting <strong>August 17</strong>.
    School year tuition for PreK–1st grade is <strong>$11,950 annually</strong>, billed in
    <strong>10 equal monthly payments of $1,195</strong> — one per month from August through May.
    Payments are due on the 1st of each month, with the exception of August (August tuition is due <strong>August 10</strong>, one week before school starts).
    A <strong>$50 late fee</strong> applies to any payment not received by the 4th of the month (August payments not received by <strong>August 13</strong>).
  </p>

  <p style="margin-bottom: 16px;">
    In replacement of a school supply list, we require a <strong>$300 annual supply fee</strong> (one-time per school year) that covers all classroom consumables —
    art materials, learning manipulatives, science supplies, workbooks, and hands-on tools — so students are fully equipped from day one.
    Below is everything you need to know about tuition and billing.
  </p>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">
    If you joined us for summer and are still deciding about the school year, you can commit and pay the registration fee directly through your
    <a href="https://sagefield.co/parent/billing" style="color: #2C5F2E;">parent billing portal</a>.
    And if you've already let us know you're not continuing for the school year, please disregard this email — no action needed!
  </p>

  <!-- Portal CTA -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; color: #2c2c2c; font-weight: bold;">Tuition is now available to pay in the parent portal</p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #555;">Go to the <strong>Billing</strong> page and click the <strong>"School Year"</strong> tab.</p>
    <a href="https://sagefield.co/parent/billing"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Open Parent Billing Portal →
    </a>
  </div>

  <!-- Payment Schedule -->
  <p style="margin-bottom: 10px; font-weight: bold; color: #2C5F2E; font-size: 16px;">Payment Schedule</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
    <thead>
      <tr style="background: #f7f4f0;">
        <th style="text-align: left; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Month</th>
        <th style="text-align: left; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Due Date</th>
        <th style="text-align: right; padding: 10px 14px; border: 1px solid #d8d0c8; font-weight: bold;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">August</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;"><strong>August 10</strong> (one week before school starts)</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$1,195</td>
      </tr>
      <tr style="background: #fafaf8;">
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">September</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">September 1</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$1,195</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">October</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">October 1</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$1,195</td>
      </tr>
      <tr style="background: #fafaf8;">
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">November</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">November 1</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$1,195</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: center; color: #888; padding: 8px 14px; border: 1px solid #d8d0c8; font-size: 18px; letter-spacing: 4px;">···</td>
      </tr>
      <tr style="background: #fafaf8;">
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">May</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;">May 1</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$1,195</td>
      </tr>
      <tr style="background: #f7f4f0; font-weight: bold;">
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8;" colspan="2">Annual Total</td>
        <td style="padding: 10px 14px; border: 1px solid #d8d0c8; text-align: right;">$11,950</td>
      </tr>
    </tbody>
  </table>

  <!-- No Proration -->
  <div style="background: #fef3c7; border-left: 4px solid #d97706; border-radius: 6px; padding: 16px 18px; margin: 0 0 28px 0;">
    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: bold; color: #92400e;">A note on August tuition</p>
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #3a3a3a;">The school year starts <strong>August 17</strong>, but monthly tuition is <strong>not</strong> prorated for partial months. Here is why:</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #3a3a3a;">
      <li style="margin-bottom: 6px;">Annual tuition for PreK–1st grade is <strong>$11,950</strong></li>
      <li style="margin-bottom: 6px;">This is divided into <strong>10 equal monthly payments of $1,195</strong></li>
      <li style="margin-bottom: 0;">August tuition = <strong>$1,195</strong> (same as every month) — the total is simply divided for consistency and convenience, not calculated by days attended</li>
    </ul>
  </div>

  <p style="margin-bottom: 10px; font-size: 14px; color: #555;">For homeschool drop-in families, monthly pricing varies by schedule:</p>
  ${homeschoolDropInPricingTableHtml()}

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">If you have any questions about billing, please don't hesitate to reach out. We are happy to help!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSchoolYearTuitionClarificationEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] || "there";

  const subject = `A Follow-Up on Your Tuition Info — 2026–2027`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 12px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">
    We wanted to follow up on the tuition information we shared recently to make sure everything is crystal clear.
    Tuition for the 2026–2027 school year varies by grade level, and we want to ensure you have the complete picture.
  </p>

  <!-- Grade Comparison Table -->
  ${schoolYearTuitionByGradeTableHtml()}
  ${homeschoolDropInPricingTableHtml()}

  <p style="margin-bottom: 16px;">
    Both grade bands are billed in <strong>10 equal monthly payments</strong> — one per month from August through May.
    Payments are due on the 1st of each month, with the exception of August (August tuition is due <strong>August 10</strong>, one week before school starts).
    A <strong>$50 late fee</strong> applies to any payment not received by the 4th of the month (August payments not received by <strong>August 13</strong>).
  </p>

  <p style="margin-bottom: 16px;">
    In replacement of a school supply list, we require a <strong>$300 annual supply fee</strong> (one-time per school year) that covers all classroom consumables —
    art materials, learning manipulatives, science supplies, workbooks, and hands-on tools — so students are fully equipped from day one.
  </p>

  <!-- Portal CTA -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; color: #2c2c2c; font-weight: bold;">Your parent billing portal reflects the correct tuition for your child's grade</p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #555;">Go to the <strong>Billing</strong> page and click the <strong>"School Year"</strong> tab to review your payment schedule.</p>
    <a href="https://sagefield.co/parent/billing"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Open Parent Billing Portal →
    </a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">If you have any questions about your specific tuition or billing, please don't hesitate to reach out. We are happy to help!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSchoolYearTuitionReminderEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] || "there";

  const subject = `Reminder: August Tuition Due August 10 — 2026–2027`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 12px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">
    If you've already paid August tuition — thank you, you're all set! 🎉
  </p>

  <p style="margin-bottom: 16px;">
    If you haven't yet — a quick reminder that <strong>August tuition is due August 10</strong>, one week before the school year begins on <strong>August 17</strong>.
    You can pay through your parent billing portal under the <strong>"School Year"</strong> tab.
  </p>

  <!-- Grade Comparison Table -->
  ${schoolYearTuitionByGradeTableHtml("24px")}
  ${homeschoolDropInPricingTableHtml()}

  <p style="margin-bottom: 16px; font-size: 14px; color: #3a3a3a;">
    Both grade bands are billed in <strong>10 equal monthly payments</strong> (August through May).
    Payments are due on the 1st of each month, with the exception of August (due <strong>August 10</strong>).
    A <strong>$50 late fee</strong> applies to any payment not received by the 4th of the month (August payments not received by <strong>August 13</strong>).
    We also require a <strong>$300 annual supply fee</strong> (one-time per school year) that covers all classroom consumables.
  </p>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">
    A quick note on August tuition: the school year starts August 17, but monthly tuition is <strong>not</strong> prorated for partial months.
    Annual tuition is simply divided into 10 equal monthly payments for consistency — not calculated by days attended.
  </p>

  <!-- Portal CTA -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; color: #2c2c2c; font-weight: bold;">Your parent billing portal reflects the correct tuition for your child's grade</p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #555;">Go to the <strong>Billing</strong> page and click the <strong>"School Year"</strong> tab.</p>
    <a href="https://sagefield.co/parent/billing"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Open Parent Billing Portal →
    </a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">If you have any questions about your specific tuition or billing, please don't hesitate to reach out. We are happy to help!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildHomeschoolDropInClarificationEmail(opts: {
  g1FullName?: string;
  childLegalName?: string;
  email: string;
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] || "there";

  const subject = `A Follow-Up on Your Homeschool Drop-In Info — 2026–2027`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 12px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">
    We wanted to follow up on the homeschool drop-in information we shared recently to make sure everything is crystal clear.
    Pricing for the 2026–2027 school year varies by grade level and the number of days per week you select, and we want to make sure you have the full picture.
  </p>

  <!-- Pricing Table -->
  ${homeschoolDropInPricingTableHtml()}

  <p style="margin-bottom: 10px; font-weight: bold; color: #2C5F2E; font-size: 16px;">How It Works</p>
  <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 15px;">
    <li style="margin-bottom: 8px;"><strong>Month-by-month billing</strong> — pay only for the months you enroll.</li>
    <li style="margin-bottom: 8px;"><strong>Choose your days each month</strong> — select which days work best for your family from our available schedule (Monday–Thursday).</li>
    <li style="margin-bottom: 8px;"><strong>Supply fee</strong> — a one-time <strong>$300 annual supply fee</strong> must be paid before your first drop-in day. This covers all classroom consumables so your child is fully equipped from day one.</li>
  </ul>

  <!-- Portal CTA -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; color: #2c2c2c; font-weight: bold;">Ready to enroll? Your parent billing portal has everything you need.</p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: #555;">Go to the <strong>Billing</strong> page → <strong>"School Year"</strong> tab → <strong>"Homeschool Drop-In"</strong> to select your schedule and get started.</p>
    <a href="https://sagefield.co/parent/billing"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Open Parent Billing Portal →
    </a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">If you have any questions about homeschool drop-in pricing or scheduling, please don't hesitate to reach out. We are happy to help!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}

export async function buildSchoolYearTuitionConfirmationEmail(opts: {
  g1FullName: string;
  childName: string;
  amountDollars: string;
  selectedMonths?: number[];
}): Promise<{ subject: string; content: string }> {
  const firstName = opts.g1FullName?.split(" ")[0] ?? "there";

  const MONTH_NAMES: Record<number, string> = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
  };

  const monthList = opts.selectedMonths && opts.selectedMonths.length > 0
    ? opts.selectedMonths.map((m) => MONTH_NAMES[m] ?? `Month ${m}`).join(", ")
    : null;

  const subject = `School Year Tuition Received — Sage Field School`;

  const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 12px;">Hi ${firstName}!</p>

  <p style="margin-bottom: 16px;">
    We have received your school year tuition payment for <strong>${opts.childName}</strong>. Thank you!
  </p>

  <!-- Payment Summary -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 10px; padding: 20px 24px; margin: 0 0 28px 0;">
    <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">Payment Summary</p>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      <tr>
        <td style="padding: 4px 0; color: #555;">Student</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">${opts.childName}</td>
      </tr>
      ${monthList ? `<tr>
        <td style="padding: 4px 0; color: #555;">Months Covered</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">${monthList}</td>
      </tr>` : ""}
      <tr>
        <td style="padding: 4px 0; color: #555;">Amount Paid</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">$${opts.amountDollars}</td>
      </tr>
    </table>
  </div>

  <!-- Portal CTA -->
  <div style="background: #f7f4f0; border: 1px solid #d8d0c8; border-radius: 10px; padding: 20px 24px; margin: 0 0 28px 0; text-align: center;">
    <p style="margin: 0 0 14px 0; font-size: 14px; color: #555;">View your full payment history and upcoming balances in the parent billing portal.</p>
    <a href="https://sagefield.co/parent/billing"
       style="display: inline-block; background: #2C5F2E; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.3px;">
      Open Billing Portal →
    </a>
  </div>

  <p style="margin-bottom: 24px; font-size: 14px; color: #555;">If you have any questions about your billing, please don't hesitate to reach out. We are happy to help!</p>

  <p style="margin-top: 32px;">With warmth,</p>
  <p style="margin-top: 4px;">
    <strong>Sabrina</strong><br />
    Sage Field School<br />
    <a href="mailto:sabrina@sagefield.co" style="color: #5a7a5a;">sabrina@sagefield.co</a> · <a href="tel:5126775872" style="color: #5a7a5a;">(512) 677-5872</a>
  </p>

</body>
</html>
  `.trim();

  return { subject, content };
}
