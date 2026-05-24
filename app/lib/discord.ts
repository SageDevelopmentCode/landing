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
  description?: string;
  color: number;
  fields: DiscordEmbedField[];
  timestamp: string;
}

interface DiscordWebhookPayload {
  content?: string;
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
  content?: string,
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
      ...(content ? { content } : {}),
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

  const overallPct = data.totals.totalPlanned > 0
    ? Math.round((data.totals.totalActual / data.totals.totalPlanned) * 100)
    : 0;

  const isOverall = data.totals.totalActual > data.totals.totalPlanned;

  const description = isOverall
    ? `You're over budget by **${fmt(data.totals.totalActual - data.totals.totalPlanned)}** this month. Spent **${fmt(data.totals.totalActual)}** of **${fmt(data.totals.totalPlanned)}** budgeted.`
    : `You have **${fmt(data.totals.totalRemaining)}** left this month — **${fmt(data.totals.totalActual)}** spent of **${fmt(data.totals.totalPlanned)}** budgeted (${overallPct}% used).`;

  const savingsEntry = data.categories.find((r) => r.category === "Savings");
  const nonSavings = data.categories.filter((r) => r.category !== "Savings");

  const overBudget = nonSavings.filter((r) => r.pct !== null && r.pct > 100);
  const runningLow = nonSavings.filter((r) => r.pct !== null && r.pct >= 80 && r.pct <= 100);
  const onTrack = nonSavings.filter((r) => r.pct === null || r.pct < 80);

  // Savings goes into runningLow/onTrack buckets normally, or gets a win line if over-planned
  const savingsIsWin = savingsEntry && savingsEntry.pct !== null && savingsEntry.pct > 100;
  if (savingsEntry && !savingsIsWin) {
    if (savingsEntry.pct !== null && savingsEntry.pct >= 80) {
      runningLow.push(savingsEntry);
    } else {
      onTrack.push(savingsEntry);
    }
  }

  const spacer: DiscordEmbedField = { name: "​", value: "​", inline: false };
  const fields: DiscordEmbedField[] = [];

  if (overBudget.length > 0) {
    fields.push({
      name: "⚠️ Over Budget",
      value: overBudget.map((r) => {
        const emoji = CATEGORY_EMOJI[r.category] ?? "•";
        const overage = r.actual - r.planned;
        return `${emoji} **${r.category}** — you're ${fmt(overage)} over (spent ${fmt(r.actual)}, had ${fmt(r.planned)})`;
      }).join("\n"),
      inline: false,
    });
    fields.push(spacer);
  }

  if (runningLow.length > 0) {
    fields.push({
      name: "🔶 Running Low",
      value: runningLow.map((r) => {
        const emoji = CATEGORY_EMOJI[r.category] ?? "•";
        return `${emoji} **${r.category}** — ${fmt(r.remaining)} left (${r.pct}% used)`;
      }).join("\n"),
      inline: false,
    });
    fields.push(spacer);
  }

  const onTrackLines = onTrack.map((r) => {
    const emoji = CATEGORY_EMOJI[r.category] ?? "•";
    return r.pct === null
      ? `${emoji} **${r.category}** — ${fmt(r.actual)} spent (no budget set)`
      : `${emoji} **${r.category}** — ${fmt(r.remaining)} left`;
  });
  if (savingsIsWin && savingsEntry) {
    const overage = savingsEntry.actual - savingsEntry.planned;
    onTrackLines.push(`🏦 **Savings** — you saved ${fmt(savingsEntry.actual)}, ${fmt(overage)} more than planned! 🎉`);
  }
  if (onTrackLines.length > 0) {
    fields.push({
      name: "✅ On Track",
      value: onTrackLines.join("\n"),
      inline: false,
    });
    fields.push(spacer);
  }

  const color = isOverall ? 0xe74c3c : overBudget.length > 0 ? 0xe07a3a : 0x27ae60;

  return {
    title: `📊 Budget Report — ${data.month} ${data.year}`,
    description,
    color,
    fields,
    timestamp: new Date().toISOString(),
  };
}

const REVENUE_SOURCE_LABELS: Record<string, string> = {
  tuition: "Tuition",
  aftercare: "After Care",
  aftercare_tuition: "After Care",
  fun_friday: "Field Day Friday",
  fun_friday_tuition: "Field Day Friday",
  summer: "Summer Tuition",
  summer_tuition: "Summer Tuition",
  registration_fee: "Registration Fee",
  homeschool_dropin: "Homeschool Drop-In",
  supply_fee: "Supply Fee",
  late_fee: "Late Fee",
  donation: "Donation",
  fundraiser: "Fundraiser",
  grant: "Grant / Sponsorship",
  field_trip_fee: "Field Trip Fee",
  uniform_fee: "Uniform / Spirit Wear",
  extended_care: "Extended Care (Drop-in)",
  event: "Event / Workshop",
  custom_tuition: "Custom Tuition",
  shadow_day_fee: "Shadow Day Fee",
  other: "Other",
};

/**
 * Creates a Discord embed for the monthly revenue report
 */
export function createRevenueReportEmbed(data: {
  month: string;
  year: number;
  totalRevenue: number;
  netProfit: number;
  byType: Array<{ type: string; amount: number; pct: number }>;
}): DiscordEmbed {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const isProfit = data.netProfit >= 0;
  const profitLine = isProfit
    ? `Net Profit: **+${fmt(data.netProfit)}** 🟢`
    : `Net Loss: **${fmt(data.netProfit)}** 🔴`;

  const byTypeValue = data.byType.length > 0
    ? data.byType
        .map((r) => {
          const label = REVENUE_SOURCE_LABELS[r.type] ?? r.type;
          return `• **${label}** — ${fmt(r.amount)} (${r.pct}%)`;
        })
        .join("\n")
    : "No revenue recorded this month.";

  return {
    title: `💰 Revenue Report — ${data.month} ${data.year}`,
    description: `Total Revenue: **${fmt(data.totalRevenue)}**\n${profitLine}`,
    color: isProfit ? 0x27ae60 : 0xe74c3c,
    fields: [
      { name: "📊 By Type", value: byTypeValue, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed reminding how many days until rent is due (last day of current month)
 */
export function createRentReminderEmbed(): { embed: DiscordEmbed; content?: string } {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dueDateStr = lastDay.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const isDueToday = daysLeft === 0;
  const color = isDueToday || daysLeft <= 3 ? 0xe74c3c : daysLeft <= 7 ? 0xe07a3a : 0x27ae60;
  const urgency = isDueToday ? "🚨 Rent is due TODAY!" : daysLeft <= 3 ? "🔴 Due very soon!" : daysLeft <= 7 ? "🟠 Coming up soon." : "🟢 Plenty of time.";
  const description = isDueToday
    ? `Rent is due **today** (${dueDateStr}).\n${urgency}`
    : `Rent is due on **${dueDateStr}** — that's **${daysLeft} day${daysLeft !== 1 ? "s" : ""} away**.\n${urgency}`;

  return {
    embed: {
      title: "🏠 Rent Reminder",
      description,
      color,
      fields: [],
      timestamp: new Date().toISOString(),
    },
    content: isDueToday ? "@everyone" : undefined,
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
 * Creates a Discord embed for paystub submissions
 */
export function createPaystubSubmittedEmbed(data: {
  teacherName: string
  teacherEmail: string
  periodStart: string
  periodEnd: string
  totalHours: number
  hourlyRate: number
  grossPay: number
}): DiscordEmbed {
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" })
  return {
    title: "📝 Paystub Submitted",
    color: 0x5865f2,
    fields: [
      { name: "Teacher", value: data.teacherName || "N/A", inline: true },
      { name: "Email", value: data.teacherEmail || "N/A", inline: true },
      { name: "Pay Period", value: `${data.periodStart} – ${data.periodEnd}`, inline: false },
      { name: "Total Hours", value: String(data.totalHours), inline: true },
      { name: "Hourly Rate", value: fmt(data.hourlyRate), inline: true },
      { name: "Gross Pay", value: fmt(data.grossPay), inline: true },
    ],
    timestamp: new Date().toISOString(),
  }
}

export function createSpecialRequestEmbed(data: {
  studentName: string;
  category: string;
  noteText: string;
}): DiscordEmbed {
  return {
    title: "📋 Special Request Created",
    color: 0xf59e0b,
    fields: [
      { name: "Student", value: data.studentName, inline: true },
      { name: "Category", value: data.category, inline: true },
      { name: "Note", value: data.noteText, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for aftercare check-in / pickup time updates
 */
export function createAftercareEmbed(data: {
  studentName: string;
  date: string;
  event: "checked_in" | "checked_out" | "pickup_time_set";
  pickupTime?: string | null;
  pickedUpByName?: string | null;
  paidForDay?: boolean;
}): DiscordEmbed {
  const EVENT_META = {
    checked_in:      { title: "🟢 Student Added to Aftercare", color: 0x4a7c59 },
    checked_out:     { title: "🔴 Student Removed from Aftercare", color: 0xe74c3c },
    pickup_time_set: { title: "🚗 Aftercare Pickup Recorded", color: 0xe07a3a },
  };
  const { title, color } = EVENT_META[data.event];

  const fields: DiscordEmbedField[] = [
    { name: "Student", value: data.studentName, inline: true },
    { name: "Date", value: data.date, inline: true },
  ];

  if (data.event === "checked_in" || data.event === "checked_out") {
    fields.push({ name: "Paid", value: data.paidForDay ? "✅ Yes" : "❌ No", inline: true });
  }

  if (data.event === "pickup_time_set" && data.pickupTime) {
    const [h, m] = data.pickupTime.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    fields.push({ name: "Pickup Time", value: `${h12}:${String(m).padStart(2, "0")} ${ampm}`, inline: true });
    if (data.pickedUpByName) {
      fields.push({ name: "Picked Up By", value: data.pickedUpByName, inline: true });
    }
  }

  return { title, color, fields, timestamp: new Date().toISOString() };
}

/**
 * Creates a Discord embed for OTP verification code sends
 */
export function createOtpSentEmbed(data: {
  email: string;
  context: 'login' | 'signup';
}): DiscordEmbed {
  return {
    title: "🔐 Verification Code Sent",
    color: 0x5865f2,
    fields: [
      { name: "Email", value: data.email, inline: true },
      { name: "Type", value: data.context === 'signup' ? "New signup" : "Login attempt", inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for summer week commitment notes
 */
export function createSummerCommitmentNoteEmbed(data: {
  parentEmail: string;
  childName: string;
  note: string;
}): DiscordEmbed {
  return {
    title: "📝 Summer Week Commitment Note",
    color: 0xe07a3a,
    fields: [
      { name: "Parent", value: data.parentEmail, inline: true },
      { name: "Child", value: data.childName, inline: true },
      {
        name: "Note",
        value: data.note.length > 1024 ? data.note.substring(0, 1021) + "..." : data.note,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

export function createHomeschoolDayCommitmentNoteEmbed(data: {
  parentEmail: string;
  childName: string;
  note: string;
}): DiscordEmbed {
  return {
    title: "📝 Homeschool Day Commitment Note",
    color: 0x4a7c59,
    fields: [
      { name: "Parent", value: data.parentEmail, inline: true },
      { name: "Child", value: data.childName, inline: true },
      {
        name: "Note",
        value: data.note.length > 1024 ? data.note.substring(0, 1021) + "..." : data.note,
        inline: false,
      },
    ],
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

/**
 * Creates a Discord embed for parent portal feedback submissions
 */
export function createParentFeedbackEmbed(data: {
  parentName: string;
  parentEmail: string;
  rating: number;
  categories: string[];
  message?: string | null;
  allowFollowUp: boolean;
  feedbackId: string;
}): DiscordEmbed {
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  const stars = "⭐".repeat(data.rating);
  const fields: DiscordEmbedField[] = [
    { name: "Parent", value: data.parentName, inline: true },
    { name: "Email", value: data.parentEmail, inline: true },
    { name: "Rating", value: `${stars} — ${LABELS[data.rating]}`, inline: true },
    {
      name: "Areas",
      value: data.categories.length ? data.categories.join(" · ") : "None selected",
      inline: false,
    },
    { name: "Follow-up OK", value: data.allowFollowUp ? "Yes" : "No", inline: true },
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
  fields.push({ name: "Feedback ID", value: data.feedbackId, inline: false });
  return {
    title: "✨ New Parent Feedback",
    color: 0x4a7c59,
    fields,
    timestamp: new Date().toISOString(),
  };
}

export function createCustomTuitionEmbed(data: {
  parentName: string;
  parentEmail: string;
  childName: string;
  label: string;
  tuitionCode: string;
  amountCents: number;
}): DiscordEmbed {
  const amountDollars = (data.amountCents / 100).toFixed(2);
  return {
    title: "🏷️ Custom Tuition Paid",
    color: 0x0d9488,
    fields: [
      { name: "Parent", value: data.parentName || "N/A", inline: true },
      { name: "Email", value: data.parentEmail || "N/A", inline: true },
      { name: "Child", value: data.childName || "N/A", inline: true },
      { name: "Code", value: data.tuitionCode, inline: true },
      { name: "Label", value: data.label, inline: true },
      { name: "Amount Paid", value: `$${amountDollars}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for tuition flow feedback submissions
 */
export function createTuitionFeedbackEmbed(data: {
  parentName: string;
  parentEmail: string;
  rating: number;
  message?: string | null;
  feedbackId: string;
}): DiscordEmbed {
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  const stars = "⭐".repeat(data.rating);
  const fields: DiscordEmbedField[] = [
    { name: "Parent", value: data.parentName, inline: true },
    { name: "Email", value: data.parentEmail, inline: true },
    { name: "Rating", value: `${stars} — ${LABELS[data.rating]}`, inline: true },
  ];
  if (data.message) {
    fields.push({
      name: "Feedback",
      value: data.message.length > 1024 ? data.message.substring(0, 1021) + "..." : data.message,
      inline: false,
    });
  }
  fields.push({ name: "Feedback ID", value: data.feedbackId, inline: false });
  return {
    title: "💳 Tuition Flow Feedback",
    color: 0x4a7c59,
    fields,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a Discord embed for care log entries (sunscreen / bug spray)
 */
export function createCareLogEmbed(data: {
  teacherName: string
  studentNames: string[]
  activity: 'sunscreen' | 'bug_spray'
  date: string
}): DiscordEmbed {
  const activityLabel = data.activity === 'sunscreen' ? '🧴 Sunscreen' : '🦟 Bug Spray'
  const studentList = data.studentNames.join(', ')
  return {
    title: `${activityLabel} Applied`,
    color: 0x4a7c59,
    fields: [
      { name: 'Teacher', value: data.teacherName, inline: true },
      { name: 'Activity', value: activityLabel, inline: true },
      { name: 'Date', value: data.date, inline: true },
      {
        name: `Students (${data.studentNames.length})`,
        value: studentList.length > 1024 ? studentList.substring(0, 1021) + '...' : studentList,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  }
}
