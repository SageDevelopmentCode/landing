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
 * Creates a Discord embed for summer tuition payments
 */
export function createSummerTuitionEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  planType: "weekly" | "full";
  amountCents: number;
  weeks?: number[];
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  const planLabel =
    data.planType === "full"
      ? "Full Summer (12 Weeks)"
      : `Weekly — ${data.weeks?.length ?? 0} week${(data.weeks?.length ?? 0) !== 1 ? "s" : ""}${data.weeks && data.weeks.length > 0 ? ` (${data.weeks.join(", ")})` : ""}`;

  return {
    title: "☀️ Summer Tuition Paid",
    color: 0xe07a3a,
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Child", value: data.childName || "N/A", inline: true },
      { name: "Plan", value: planLabel, inline: true },
      { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for after care tuition payments
 */
export function createAftercareTuitionEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  planType: "monthly" | "daily";
  amountCents: number;
  selectedMonths?: string[];
  selectedDays?: string[];
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  const MONTH_LABELS: Record<string, string> = {
    may: "May 2026",
    jun: "June 2026",
    jul: "July 2026",
    aug: "August 2026",
  };
  const planLabel =
    data.planType === "monthly"
      ? `Monthly — ${data.selectedMonths?.map((k) => MONTH_LABELS[k] ?? k).join(", ") ?? ""}`
      : `Daily — ${data.selectedDays?.length ?? 0} day${(data.selectedDays?.length ?? 0) !== 1 ? "s" : ""}`;

  return {
    title: "🕒 After Care Tuition Paid",
    color: 0xe07a3a,
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Child", value: data.childName || "N/A", inline: true },
      { name: "Plan", value: planLabel, inline: true },
      { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for Homeschool Drop-In payments
 */
export function createHomeschoolDropInEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  program: string;
  tier: string;
  selectedDays?: string[];
  selectedWeeks?: number[];
  amountCents: number;
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  const PROGRAM_LABELS: Record<string, string> = {
    summer_26: "Summer 2026",
    school_year_26_27: "School Year 2026–2027",
  };
  const TIER_LABELS: Record<string, string> = {
    dropin: "Explorer Day Pass",
    "2day": "2 Days / Week",
    "3day": "3 Days / Week",
  };
  const programLabel = PROGRAM_LABELS[data.program] ?? data.program;
  const tierLabel = TIER_LABELS[data.tier] ?? data.tier;
  const daysLabel =
    data.selectedDays && data.selectedDays.length > 0
      ? data.selectedDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
      : "Day Pass";
  const weeksLabel =
    data.selectedWeeks && data.selectedWeeks.length > 0
      ? `Weeks ${data.selectedWeeks.join(", ")}`
      : "";

  const planValue = data.tier === "dropin"
    ? tierLabel
    : `${tierLabel} (${daysLabel})`;

  const fields = [
    { name: "Parent", value: data.parentName || "N/A", inline: true },
    { name: "Email", value: data.parentEmail || "N/A", inline: true },
    { name: "Child", value: data.childName || "N/A", inline: true },
    { name: "Program", value: programLabel, inline: true },
    { name: "Plan", value: planValue, inline: true },
    ...(weeksLabel ? [{ name: "Weeks", value: weeksLabel, inline: true }] : []),
    { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
  ];

  return {
    title: "🏡 Homeschool Drop-In Payment",
    color: 0x4a7c59,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for Fun Friday payments
 */
export function createFunFridayTuitionEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  planType: "monthly" | "dropin";
  amountCents: number;
  selectedMonths?: string[];
  selectedFridays?: string[];
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  const MONTH_LABELS: Record<string, string> = {
    may: "May 2026",
    jun: "June 2026",
    jul: "July 2026",
    aug: "August 2026",
  };
  const planLabel =
    data.planType === "monthly"
      ? `Monthly — ${data.selectedMonths?.map((k) => MONTH_LABELS[k] ?? k).join(", ") ?? ""}`
      : `Drop-in — ${data.selectedFridays?.length ?? 0} session${(data.selectedFridays?.length ?? 0) !== 1 ? "s" : ""}`;

  return {
    title: "🎉 Fun Friday Payment",
    color: 0x7c3aed,
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Child", value: data.childName || "N/A", inline: true },
      { name: "Plan", value: planLabel, inline: true },
      { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
    ],
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

/**
 * Creates a Discord embed for teacher clock-in events
 */
export function createTeacherClockInEmbed(data: {
  teacherName: string
  clockInAt: string
}): DiscordEmbed {
  const time = new Date(data.clockInAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const date = new Date(data.clockInAt).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  return {
    title: "🟢 Teacher Clocked In",
    color: 0x4a7c59,
    fields: [
      { name: "Teacher", value: data.teacherName, inline: true },
      { name: "Time", value: time, inline: true },
      { name: "Date", value: date, inline: false },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a Discord embed for teacher clock-out events
 */
export function createTeacherClockOutEmbed(data: {
  teacherName: string
  clockInAt: string
  clockOutAt: string
}): DiscordEmbed {
  const inTime = new Date(data.clockInAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const outTime = new Date(data.clockOutAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const date = new Date(data.clockInAt).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const diffMs = new Date(data.clockOutAt).getTime() - new Date(data.clockInAt).getTime()
  const totalMins = Math.round(diffMs / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`

  return {
    title: "🔴 Teacher Clocked Out",
    color: 0xe74c3c,
    fields: [
      { name: "Teacher", value: data.teacherName, inline: true },
      { name: "Duration", value: duration, inline: true },
      { name: "Date", value: date, inline: false },
      { name: "In", value: inTime, inline: true },
      { name: "Out", value: outTime, inline: true },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a Discord embed for parent help requests
 */
export function createHelpRequestEmbed(data: {
  parentName: string;
  parentEmail: string;
  description: string;
  attachmentCount: number;
  helpRequestId: string;
  pageUrl?: string | null;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Parent", value: data.parentName, inline: true },
    { name: "Email", value: data.parentEmail, inline: true },
    { name: "Attachments", value: String(data.attachmentCount), inline: true },
    ...(data.pageUrl ? [{ name: "Page", value: data.pageUrl, inline: false }] : []),
    {
      name: "Description",
      value:
        data.description.length > 1024
          ? data.description.substring(0, 1021) + "..."
          : data.description,
      inline: false,
    },
    { name: "Request ID", value: data.helpRequestId, inline: false },
  ];

  return {
    title: "🆘 New Help Request",
    color: 0xf29a8f, // Brand primary
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for info session RSVP submissions
 */
export function createInfoSessionRSVPEmbed(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  children: Array<{ name: string; age: string }>;
  programs: string[];
  hearAboutUs?: string;
  questions?: string;
}): DiscordEmbed {
  const programLabels: Record<string, string> = {
    "summer-2026": "Summer 2026",
    "school-year": "School Year 2026–2027",
    homeschool: "Homeschool Drop-In",
  };

  const programsFormatted =
    data.programs.map((p) => programLabels[p] ?? p).join(", ") || "None selected";

  const childrenFormatted =
    data.children.length > 0
      ? data.children.map((c) => `${c.name} (age ${c.age})`).join(", ")
      : "None listed";

  const fields: DiscordEmbedField[] = [
    { name: "Parent", value: `${data.firstName} ${data.lastName}`, inline: true },
    { name: "Email", value: data.email, inline: true },
    { name: "Phone", value: data.phone, inline: true },
    { name: "Programs Interested In", value: programsFormatted, inline: false },
    { name: "Children", value: childrenFormatted, inline: false },
    { name: "How They Heard", value: data.hearAboutUs || "Not provided", inline: true },
  ];

  if (data.questions) {
    fields.push({
      name: "Questions / Topics",
      value:
        data.questions.length > 1024
          ? data.questions.substring(0, 1021) + "..."
          : data.questions,
      inline: false,
    });
  }

  return {
    title: "📋 New Info Session RSVP",
    color: 0xa8c5a0, // Sage green
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for student check-in events
 */
export function createStudentCheckInEmbed(data: {
  studentName: string
  checkedInAt: string
  program?: string | null
  classroom?: string | null
}): DiscordEmbed {
  const time = new Date(data.checkedInAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const date = new Date(data.checkedInAt).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const fields: DiscordEmbedField[] = [
    { name: "Student", value: data.studentName, inline: true },
    { name: "Time", value: time, inline: true },
    { name: "Date", value: date, inline: false },
  ]
  if (data.classroom) fields.push({ name: "Classroom", value: data.classroom, inline: true })
  if (data.program) fields.push({ name: "Program", value: data.program, inline: true })
  return {
    title: "🟢 Student Checked In",
    color: 0x4a7c59,
    fields,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a Discord embed for student check-out events
 */
export function createStudentCheckOutEmbed(data: {
  studentName: string
  checkedInAt: string
  checkedOutAt: string
  program?: string | null
  classroom?: string | null
}): DiscordEmbed {
  const inTime = new Date(data.checkedInAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const outTime = new Date(data.checkedOutAt).toLocaleTimeString("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const date = new Date(data.checkedInAt).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const diffMs = new Date(data.checkedOutAt).getTime() - new Date(data.checkedInAt).getTime()
  const totalMins = Math.round(diffMs / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`
  const fields: DiscordEmbedField[] = [
    { name: "Student", value: data.studentName, inline: true },
    { name: "Duration", value: duration, inline: true },
    { name: "Date", value: date, inline: false },
    { name: "In", value: inTime, inline: true },
    { name: "Out", value: outTime, inline: true },
  ]
  if (data.classroom) fields.push({ name: "Classroom", value: data.classroom, inline: true })
  if (data.program) fields.push({ name: "Program", value: data.program, inline: true })
  return {
    title: "🔴 Student Checked Out",
    color: 0xe74c3c,
    fields,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Creates a Discord embed for the daily budget monthly summary report
 */
export function createBudgetSummaryEmbed(data: {
  month: string;
  year: number;
  categories: Array<{
    category: string;
    planned: number;
    actual: number;
    remaining: number;
    pct: number | null;
  }>;
  totals: {
    totalPlanned: number;
    totalActual: number;
    totalRemaining: number;
  };
}): DiscordEmbed {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const CATEGORY_EMOJI: Record<string, string> = {
    Tuition: "🎓",
    Donations: "🎁",
    "Teacher Pay": "👩‍🏫",
    "Staff Pay": "👥",
    "Contractor / 1099": "🔧",
    "Payroll Taxes": "📋",
    Rent: "🏠",
    Utilities: "💡",
    "Maintenance & Repairs": "🛠️",
    "Furniture & Equipment": "🪑",
    "Supplies & Materials": "📦",
    Curriculum: "📚",
    "Field Trips": "🚌",
    "Technology & Software": "💻",
    Insurance: "🛡️",
    Marketing: "📣",
    "Professional Services": "💼",
    Administrative: "📁",
    Savings: "🏦",
    Other: "📎",
  };

  const SECTIONS: Array<{ label: string; categories: string[] }> = [
    { label: "Personnel", categories: ["Teacher Pay", "Staff Pay", "Contractor / 1099", "Payroll Taxes"] },
    { label: "Facilities", categories: ["Rent", "Utilities", "Maintenance & Repairs", "Furniture & Equipment"] },
    { label: "Program", categories: ["Supplies & Materials", "Curriculum", "Field Trips", "Technology & Software"] },
    { label: "Operations", categories: ["Insurance", "Marketing", "Professional Services", "Administrative"] },
    { label: "Other", categories: ["Savings", "Other"] },
  ];

  const byCategory = Object.fromEntries(data.categories.map((r) => [r.category, r]));
  const overBudget = data.categories.filter((r) => r.pct !== null && r.pct > 100);

  const fields: DiscordEmbedField[] = [];

  for (const section of SECTIONS) {
    const rows = section.categories
      .map((cat) => byCategory[cat])
      .filter(Boolean);
    if (rows.length === 0) continue;

    const lines = rows.map((r) => {
      const emoji = CATEGORY_EMOJI[r.category] ?? "•";
      const bar = r.pct !== null ? `${r.pct}%` : "—";
      const flag = r.pct !== null && r.pct > 100 ? " ⚠️" : "";
      return `${emoji} **${r.category}**${flag}\n  └ ${fmt(r.actual)} spent of ${fmt(r.planned)} (${bar})`;
    });

    fields.push({
      name: `── ${section.label} ──`,
      value: lines.join("\n\n"),
      inline: false,
    });
  }

  const overallPct = data.totals.totalPlanned > 0
    ? Math.round((data.totals.totalActual / data.totals.totalPlanned) * 100)
    : 0;

  fields.push({
    name: "── Summary ──",
    value: [
      `💰 **Spent:** ${fmt(data.totals.totalActual)} (${overallPct}% of budget)`,
      `📋 **Budgeted:** ${fmt(data.totals.totalPlanned)}`,
      `✅ **Remaining:** ${fmt(data.totals.totalRemaining)}`,
    ].join("\n"),
    inline: false,
  });

  if (overBudget.length > 0) {
    fields.push({
      name: "⚠️ Over Budget",
      value: overBudget.map((r) => `• ${r.category} (${r.pct}%)`).join("\n"),
      inline: false,
    });
  }

  const isOverall = data.totals.totalActual > data.totals.totalPlanned;
  const color = isOverall ? 0xe74c3c : overBudget.length > 0 ? 0xe07a3a : 0x27ae60;

  return {
    title: `📊 Budget Report — ${data.month} ${data.year}`,
    color,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for volunteer interest submissions
 */
export function createVolunteerInterestEmbed(data: {
  parentName: string;
  skills: string;
  helpAreas: string[];
  availability: string[];
  notes?: string | null;
}): DiscordEmbed {
  const fields: DiscordEmbedField[] = [
    { name: "Parent", value: data.parentName, inline: true },
    {
      name: "Skills & Experience",
      value: data.skills.length > 1024 ? data.skills.substring(0, 1021) + "..." : data.skills,
      inline: false,
    },
    { name: "How They'd Like to Help", value: data.helpAreas.join(", "), inline: false },
    { name: "Availability", value: data.availability.join(", "), inline: false },
  ];

  if (data.notes) {
    fields.push({
      name: "Additional Notes",
      value: data.notes.length > 1024 ? data.notes.substring(0, 1021) + "..." : data.notes,
      inline: false,
    });
  }

  return {
    title: "🙋 New Volunteer Interest",
    color: 0x4a7c59,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for app runtime errors
 */
export function createAppErrorEmbed(data: {
  error: string;
  area: string;
  userId?: string | null;
  userEmail?: string | null;
}): DiscordEmbed {
  return {
    title: `🚨 App Error — ${data.area}`,
    color: 0xe74c3c,
    fields: [
      { name: "User ID", value: data.userId ?? "unknown", inline: true },
      { name: "Email", value: data.userEmail ?? "unknown", inline: true },
      { name: "Error", value: data.error.substring(0, 1024), inline: false },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for Mercury transaction webhook events
 */
export function createMercuryTransactionEmbed(data: {
  title: string;
  operationType: string;
  resourceId: string;
  occurredAt: string;
  transaction: Record<string, unknown> | null;
  mergePatch: Record<string, unknown>;
  previousValues: Record<string, unknown>;
}): DiscordEmbed {
  const fmt = (n: unknown) =>
    typeof n === "number"
      ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : null;

  const tx = data.transaction;
  const patch = data.mergePatch;
  const prev = data.previousValues;

  const date = new Date(data.occurredAt).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const counterparty =
    (tx?.counterpartyName as string | null) ??
    (tx?.counterpartyNickname as string | null) ??
    (patch.merchantName as string | null) ??
    (patch.counterpartyName as string | null) ??
    (patch.bankDescription as string | null) ??
    "Unknown";

  const amount = fmt(tx?.amount ?? patch.amount);
  const status = (tx?.status ?? patch.status) as string | undefined;
  const prevStatus = prev.status as string | undefined;
  const kind = (tx?.kind ?? patch.kind) as string | undefined;
  const note = (tx?.note ?? tx?.externalMemo) as string | null | undefined;
  const dashboardLink = tx?.dashboardLink as string | undefined;

  const statusValue = data.operationType === "update" && prevStatus && prevStatus !== status
    ? `${prevStatus} → ${status}`
    : status ?? "—";

  const fields: DiscordEmbedField[] = [
    { name: "Counterparty", value: counterparty, inline: true },
    { name: "Amount", value: amount ?? "—", inline: true },
    { name: "Status", value: statusValue, inline: true },
  ];

  if (kind && kind !== "other") {
    fields.push({ name: "Kind", value: kind, inline: true });
  }

  if (note) {
    fields.push({ name: "Note", value: note, inline: false });
  }

  if (dashboardLink) {
    fields.push({ name: "Link", value: dashboardLink, inline: false });
  }

  fields.push({ name: "Occurred At", value: date, inline: true });

  const isDebit =
    typeof (tx?.amount ?? patch.amount) === "number" &&
    ((tx?.amount ?? patch.amount) as number) < 0;

  return {
    title: data.title,
    color: isDebit ? 0xe74c3c : 0x27ae60,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for Mercury account balance updated webhook events
 */
export function createMercuryAccountBalanceEmbed(data: {
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  mergePatch: Record<string, unknown>;
  previousValues: Record<string, unknown>;
}): DiscordEmbed {
  const fmt = (n: unknown) =>
    typeof n === "number"
      ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "N/A";

  const date = new Date(data.occurredAt).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const accountTypeLabel =
    data.resourceType === "checkingAccount"
      ? "Checking"
      : data.resourceType === "savingsAccount"
        ? "Savings"
        : data.resourceType === "treasuryAccount"
          ? "Treasury"
          : data.resourceType === "creditAccount"
            ? "Credit"
            : data.resourceType;

  const fields: DiscordEmbedField[] = [
    { name: "Account", value: `${accountTypeLabel} (${data.resourceId.slice(0, 8)}...)`, inline: true },
    { name: "Updated At", value: date, inline: true },
  ];

  const available = data.mergePatch.availableBalance;
  const current = data.mergePatch.currentBalance;
  const inFlight = data.mergePatch.inFlightBalance;

  if (available !== undefined) {
    const prev = data.previousValues.availableBalance;
    fields.push({
      name: "Available Balance",
      value: prev !== undefined ? `${fmt(prev)} → ${fmt(available)}` : fmt(available),
      inline: true,
    });
  }
  if (current !== undefined) {
    const prev = data.previousValues.currentBalance;
    fields.push({
      name: "Current Balance",
      value: prev !== undefined ? `${fmt(prev)} → ${fmt(current)}` : fmt(current),
      inline: true,
    });
  }
  if (inFlight !== undefined) {
    fields.push({ name: "In-Flight Balance", value: fmt(inFlight), inline: true });
  }

  return {
    title: `🏦 ${accountTypeLabel} Account Balance Updated`,
    color: 0x5865f2,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for shadow day bookings
 */
export function createShadowDayBookingEmbed(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  childName: string;
  childGrade?: string | null;
  shadowDate: string;
  isNewAccount: boolean;
}): DiscordEmbed {
  return {
    title: "🌿 New Shadow Day Booked",
    color: 0x4a7c59,
    fields: [
      { name: "Parent", value: `${data.firstName} ${data.lastName}`, inline: true },
      { name: "Email", value: data.email, inline: true },
      { name: "Phone", value: data.phone || "Not provided", inline: true },
      { name: "Child", value: data.childName + (data.childGrade ? ` — ${data.childGrade}` : ""), inline: true },
      { name: "Shadow Date", value: data.shadowDate, inline: true },
      { name: "Account", value: data.isNewAccount ? "New account created" : "Existing account", inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for shadow day payment received
 */
export function createShadowDayPaymentEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  shadowDate: string;
  amountCents: number;
}): DiscordEmbed {
  return {
    title: "💳 Shadow Day Payment Received",
    color: 0x4a7c59,
    fields: [
      { name: "Parent", value: data.parentName, inline: true },
      { name: "Email", value: data.parentEmail, inline: true },
      { name: "Child", value: data.childName, inline: true },
      { name: "Shadow Date", value: data.shadowDate, inline: true },
      { name: "Amount Paid", value: `$${(data.amountCents / 100).toFixed(2)}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for campus tour booking submissions
 */
export function createTourBookingEmbed(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  childName: string;
  childGrade: string;
  numChildren: number;
  tourDate: string;
  tourTime: string;
  howDidYouHear: string;
  accommodations?: string;
}): DiscordEmbed {
  const referralLabels: Record<string, string> = {
    google: "Google",
    social_media: "Social Media",
    friend_family: "Friend / Family",
    flyer: "Flyer / Poster",
    other: "Other",
  };

  const fields: DiscordEmbedField[] = [
    { name: "Parent / Guardian", value: `${data.firstName} ${data.lastName}`, inline: true },
    { name: "Email", value: data.email, inline: true },
    { name: "Phone", value: data.phone || "Not provided", inline: true },
    { name: "Child", value: `${data.childName} — ${data.childGrade}`, inline: true },
    { name: "Children Attending", value: String(data.numChildren), inline: true },
    { name: "Tour Date", value: data.tourDate, inline: true },
    { name: "Tour Time", value: data.tourTime, inline: true },
    { name: "How They Heard", value: referralLabels[data.howDidYouHear] || data.howDidYouHear, inline: true },
  ];

  if (data.accommodations) {
    fields.push({
      name: "Notes / Accommodations",
      value: data.accommodations.length > 1024 ? data.accommodations.substring(0, 1021) + "..." : data.accommodations,
      inline: false,
    });
  }

  return {
    title: "🏫 New Campus Tour Booked",
    color: 0xa8c5a0, // Sage green
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for first week drop-off time selections
 */
export function createDropOffTimeEmbed(data: {
  parentName: string;
  parentEmail: string;
  slot: string;
  isUpdate: boolean;
}): DiscordEmbed {
  const SLOT_LABELS: Record<string, string> = {
    "8:15": "8:15 – 8:30 AM",
    "8:30": "8:30 – 8:45 AM",
    "8:45": "8:45 – 9:00 AM",
  };
  return {
    title: data.isUpdate ? "✏️ Drop-Off Time Updated" : "🚗 Drop-Off Time Selected",
    color: 0x4a7c59,
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Time Slot", value: SLOT_LABELS[data.slot] ?? data.slot, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}
