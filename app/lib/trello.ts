"use server";

/**
 * Trello Integration Module
 * Creates cards in Trello when forms are submitted
 */

// Trello card structure
export interface TrelloCardData {
  idList: string;
  name: string;
  desc: string;
  pos: string;
  idLabels: string[];
  key: string;
  token: string;
}

// Contact form data for Trello card
export interface ContactCardInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Waitlist form data for Trello card
export interface WaitlistCardInput {
  parentName: string;
  email: string;
  phone?: string;
  childName: string;
  childAge: number;
  programInterest: string;
  specialInterests?: string;
}

/**
 * Creates a Trello card via the Trello API
 * @param cardData - The card data to send to Trello
 * @returns true if successful, false otherwise
 */
export async function createTrelloCard(
  cardData: Omit<TrelloCardData, "key" | "token">,
): Promise<boolean> {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_API_TOKEN;

  // Graceful degradation if Trello is not configured
  if (!apiKey || !apiToken) {
    console.warn(
      "Trello API credentials not configured. Skipping Trello card creation.",
    );
    return false;
  }

  try {
    const response = await fetch("https://api.trello.com/1/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...cardData,
        key: apiKey,
        token: apiToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Trello API error: ${response.status} ${response.statusText}`,
        errorText,
      );
      return false;
    }

    const result = await response.json();
    console.log("Trello card created successfully:", result.url);
    return true;
  } catch (error) {
    console.error("Failed to create Trello card:", error);
    return false;
  }
}

/**
 * Formats contact form data into a Trello card structure
 * @param data - Contact form data
 * @returns Trello card data ready to be created
 */
export async function createContactCard(
  data: ContactCardInput,
): Promise<Omit<TrelloCardData, "key" | "token">> {
  const listId = process.env.TRELLO_LIST_ID || "";
  const contactLabelId = process.env.TRELLO_LABEL_CONTACT_ID || "";
  const notContactedLabelId = process.env.TRELLO_LABEL_NOT_CONTACTED_ID || "";

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const description = `
**Contact Form Submission**

📅 **Submitted:** ${timestamp}

👤 **Name:** ${data.name}
📧 **Email:** ${data.email}
${data.phone ? `📞 **Phone:** ${data.phone}` : ""}

**Subject:** ${data.subject}

---

**Message:**
${data.message}
`.trim();

  return {
    idList: listId,
    name: `Contact: ${data.subject}`,
    desc: description,
    pos: "top",
    idLabels: [contactLabelId, notContactedLabelId].filter(Boolean),
  };
}

/**
 * Formats waitlist form data into a Trello card structure
 * @param data - Waitlist form data
 * @returns Trello card data ready to be created
 */
export async function createWaitlistCard(
  data: WaitlistCardInput,
): Promise<Omit<TrelloCardData, "key" | "token">> {
  const listId = process.env.TRELLO_LIST_ID || "";
  const waitlistLabelId = process.env.TRELLO_LABEL_WAITLIST_ID || "";
  const notContactedLabelId = process.env.TRELLO_LABEL_NOT_CONTACTED_ID || "";

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const programMapping: { [key: string]: string } = {
    "summer-2026": "Summer 2026",
    "school-year-2026": "School Year 2026",
    both: "Both Programs",
    homeschool_drop_in: "Homeschool Drop-in",
  };

  const description = `
**Waitlist Submission**

📅 **Submitted:** ${timestamp}

👤 **Parent/Guardian:** ${data.parentName}
📧 **Email:** ${data.email}
${data.phone ? `📞 **Phone:** ${data.phone}` : ""}

👶 **Child Name:** ${data.childName}
🎂 **Child Age:** ${data.childAge}

📚 **Program Interest:** ${programMapping[data.programInterest] || data.programInterest}

${data.specialInterests ? `---\n\n**Special Interests/Learning Needs:**\n${data.specialInterests}` : ""}
`.trim();

  return {
    idList: listId,
    name: `Waitlist: ${data.childName} (Age ${data.childAge})`,
    desc: description,
    pos: "top",
    idLabels: [waitlistLabelId, notContactedLabelId].filter(Boolean),
  };
}
