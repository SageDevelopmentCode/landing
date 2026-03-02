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
  embed: DiscordEmbed
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  // If no webhook URL is configured, log and return
  if (!webhookUrl) {
    console.warn("DISCORD_WEBHOOK_URL not configured. Skipping Discord notification.");
    return false;
  }

  try {
    const payload: DiscordWebhookPayload = {
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed with status ${response.status}:`,
        await response.text()
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
