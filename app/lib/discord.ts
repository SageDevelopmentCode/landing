/**
 * Discord webhook notification utility
 * Sends formatted notifications to Discord when forms are submitted
 */

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordEmbedField[];
  timestamp: string;
}

interface DiscordWebhookPayload {
  embeds: DiscordEmbed[];
}

/**
 * Sends a notification to Discord via webhook
 * @param embed - The embed object containing notification details
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export async function sendDiscordNotification(
  embed: DiscordEmbed,
  webhookUrl?: string,
): Promise<boolean> {
  const resolvedUrl = webhookUrl ?? process.env.DISCORD_WEBHOOK_URL;

  // If no webhook URL is configured, log and return
  if (!resolvedUrl) {
    console.warn(
      "No Discord webhook URL configured. Skipping Discord notification.",
    );
    return false;
  }

  try {
    const payload: DiscordWebhookPayload = {
      embeds: [embed],
    };

    const response = await fetch(resolvedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed with status ${response.status}:`,
        await response.text(),
      );
      return false;
    }

    console.log("Discord notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return false;
  }
}

/**
 * Creates a Discord embed for waitlist form submissions
 */
export function createWaitlistEmbed(data: {
  parentName: string;
  email: string;
  phone?: string;
  childName: string;
  childAge: number;
  programInterest: string;
  specialInterests?: string;
}): DiscordEmbed {
  // Format program interest to be more readable
  const programMap: Record<string, string> = {
    "summer-2026": "Summer 2026",
    "school-year-2026": "School Year 2026-2027",
    both: "Both Programs",
    homeschool_drop_in: "Homeschool Drop-in",
  };

  const fields: DiscordEmbedField[] = [
    {
      name: "Parent/Guardian",
      value: data.parentName,
      inline: true,
    },
    {
      name: "Email",
      value: data.email,
      inline: true,
    },
    {
      name: "Phone",
      value: data.phone || "Not provided",
      inline: true,
    },
    {
      name: "Child Name",
      value: data.childName,
      inline: true,
    },
    {
      name: "Child Age",
      value: data.childAge.toString(),
      inline: true,
    },
    {
      name: "Program Interest",
      value: programMap[data.programInterest] || data.programInterest,
      inline: false,
    },
  ];

  // Add special interests if provided
  if (data.specialInterests) {
    fields.push({
      name: "Special Interests & Learning Needs",
      value:
        data.specialInterests.length > 1024
          ? data.specialInterests.substring(0, 1021) + "..."
          : data.specialInterests,
      inline: false,
    });
  }

  return {
    title: "🎓 New Waitlist Submission",
    color: 0x3498db, // Blue
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for contact form submissions
 */
export function createContactEmbed(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    {
      name: "Name",
      value: data.name,
      inline: true,
    },
    {
      name: "Email",
      value: data.email,
      inline: true,
    },
    {
      name: "Phone",
      value: data.phone || "Not provided",
      inline: true,
    },
    {
      name: "Subject",
      value: data.subject,
      inline: false,
    },
    {
      name: "Message",
      value:
        data.message.length > 1024
          ? data.message.substring(0, 1021) + "..."
          : data.message,
      inline: false,
    },
  ];

  return {
    title: "📧 New Contact Form Submission",
    color: 0x2ecc71, // Green
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for server errors
 */
export function createErrorEmbed(data: {
  context: string;
  error: string;
  details?: Record<string, string>;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Context", value: data.context, inline: false },
    { name: "Error", value: data.error.substring(0, 1024), inline: false },
  ];
  if (data.details) {
    for (const [k, v] of Object.entries(data.details)) {
      fields.push({ name: k, value: v.substring(0, 1024), inline: true });
    }
  }
  return {
    title: "🚨 Server Error",
    color: 0xe74c3c,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for registration fee payments
 */
export function createRegistrationFeeEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  program: string;
  amountCents: number;
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  return {
    title: "💳 Registration Fee Paid",
    color: 0x27ae60, // Green
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Child", value: data.childName || "N/A", inline: true },
      { name: "Program", value: data.program || "N/A", inline: true },
      { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for donation payments
 */
export function createDonationEmbed(data: {
  donorName?: string;
  donorEmail: string;
  amountCents: number;
  message?: string;
  coverFees: boolean;
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  const fields: DiscordEmbedField[] = [
    { name: "Donor", value: data.donorName || "Anonymous", inline: true },
    { name: "Email", value: data.donorEmail || "N/A", inline: true },
    { name: "Amount Received", value: `$${amountDollars}`, inline: true },
    {
      name: "Covered Fees",
      value: data.coverFees ? "Yes" : "No",
      inline: true,
    },
  ];
  if (data.message) {
    fields.push({
      name: "Message",
      value:
        data.message.length > 1024
          ? data.message.substring(0, 1021) + "..."
          : data.message,
      inline: false,
    });
  }
  return {
    title: "💚 New Donation Received",
    color: 0xe91e8c,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for new parent account creation
 */
export function createParentSignupEmbed(data: {
  fullName: string;
  email: string;
}): DiscordEmbed {
  return {
    title: "🆕 New Parent Account Created",
    color: 0x5865f2, // Discord blurple
    fields: [
      { name: "Name", value: data.fullName || "N/A", inline: true },
      { name: "Email", value: data.email || "N/A", inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for application completions
 */
export function createApplicationEmbed(data: {
  g1FullName: string;
  g1Email: string;
  g1Phone: string;
  g2FullName?: string | null;
  g2Email?: string | null;
  childLegalName: string;
  childAge: number | null;
  childGrade: string | null;
  program: string | null;
  specialInterests?: string | null;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Guardian 1 Name", value: data.g1FullName || "N/A", inline: true },
    { name: "Guardian 1 Email", value: data.g1Email || "N/A", inline: true },
    { name: "Guardian 1 Phone", value: data.g1Phone || "N/A", inline: true },
  ];

  if (data.g2FullName) {
    fields.push({
      name: "Guardian 2 Name",
      value: data.g2FullName,
      inline: true,
    });
  }
  if (data.g2Email) {
    fields.push({
      name: "Guardian 2 Email",
      value: data.g2Email,
      inline: true,
    });
  }

  fields.push(
    {
      name: "Child Legal Name",
      value: data.childLegalName || "N/A",
      inline: true,
    },
    {
      name: "Age / Grade",
      value: `${data.childAge ?? "N/A"} / ${data.childGrade ?? "N/A"}`,
      inline: true,
    },
    { name: "Program", value: data.program || "N/A", inline: true },
  );

  if (data.specialInterests) {
    fields.push({
      name: "Special Interests / Notes",
      value:
        data.specialInterests.length > 1024
          ? data.specialInterests.substring(0, 1021) + "..."
          : data.specialInterests,
      inline: false,
    });
  }

  return {
    title: "📋 New Application Submitted",
    color: 0xf39c12, // Orange/gold
    fields,
    timestamp: new Date().toISOString(),
  };
}
