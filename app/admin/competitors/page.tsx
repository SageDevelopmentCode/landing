"use client";

import { useState } from "react";
import { Merriweather } from "next/font/google";
import { ExternalLink } from "lucide-react";
import { cssColors as colors, radius, cssShadows as shadows, spacing } from "../design-system";

const merriweather = Merriweather({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
});

type SchoolId = "good-earth" | "acres-grove" | "inside-outside";

const schools: { id: SchoolId; name: string; location: string }[] = [
  {
    id: "good-earth",
    name: "Good Earth Farm School",
    location: "Sebastopol, CA",
  },
  {
    id: "acres-grove",
    name: "Acres Grove Nature School",
    location: "Round Rock, TX",
  },
  {
    id: "inside-outside",
    name: "The Inside Outside School",
    location: "Pflugerville, TX",
  },
];

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
        padding: spacing.lg,
        marginBottom: spacing.md,
      }}
    >
      <h3
        className={merriweather.className}
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: colors.mistyForest,
          marginBottom: spacing.sm,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Tag({
  label,
  color = colors.pastelSage,
  textColor = colors.mistyForest,
}: {
  label: string;
  color?: string;
  textColor?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: color,
        color: textColor,
        borderRadius: radius.full,
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        marginRight: "6px",
        marginBottom: "6px",
      }}
    >
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "8px",
        fontSize: "13px",
      }}
    >
      <span
        style={{
          color: colors.textSecondary,
          minWidth: "160px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

const goodEarthPrograms = [
  {
    name: "Young Sprouts",
    age: "2–3 yrs",
    schedule: "2 days/week",
    tuition: "$525–$575/mo",
  },
  {
    name: "Little Seedlings",
    age: "2.5–4 yrs",
    schedule: "3 days/week",
    tuition: "$735–$815/mo",
  },
  {
    name: "Fledgling Forest",
    age: "3–5 yrs",
    schedule: "3 days/week",
    tuition: "$735–$815/mo",
  },
  {
    name: "Growing Roots",
    age: "3–5 yrs",
    schedule: "4 days/week",
    tuition: "$925–$1,025/mo",
  },
  {
    name: "Full Week Forest",
    age: "3–5 yrs",
    schedule: "5 days/week",
    tuition: "$1,100–$1,220/mo",
  },
  {
    name: "Extended Day",
    age: "3–5 yrs",
    schedule: "After-program care",
    tuition: "$215–$325/mo",
  },
  {
    name: "Summer Camp",
    age: "3–6 yrs",
    schedule: "Seasonal",
    tuition: "$275–$375/wk",
  },
];

const goodEarthPages = [
  {
    name: "Home",
    url: "https://goodearthfarmschool.com",
    sageStatus: "has" as const,
    sageNote: "Hero + welcome sections cover this well",
  },
  {
    name: "About / Philosophy",
    url: "https://goodearthfarmschool.com/about",
    sageStatus: "has" as const,
    sageNote: "WelcomeSection + EducationalPhilosophySection",
  },
  {
    name: "Programs",
    url: "https://goodearthfarmschool.com/programs",
    sageStatus: "has" as const,
    sageNote: "WhatWeOfferSection covers programs",
  },
  {
    name: "Tuition & Fees",
    url: "https://goodearthfarmschool.com/tuition",
    sageStatus: "missing" as const,
    sageNote:
      "No dedicated pricing page — add a Tuition page with full breakdown",
  },
  {
    name: "Enrollment / Apply",
    url: "https://goodearthfarmschool.com/enrollment",
    sageStatus: "partial" as const,
    sageNote: "Only a popup dialog — consider a dedicated /enroll page",
  },
  {
    name: "Calendar",
    url: "https://goodearthfarmschool.com/calendar",
    sageStatus: "missing" as const,
    sageNote: "No school calendar — families need to know important dates",
  },
  {
    name: "School Store / Shop",
    url: "https://goodearthfarmschool.com/store",
    sageStatus: "missing" as const,
    sageNote: "Good for community identity — low priority for now",
  },
  {
    name: "Testimonials",
    url: "https://goodearthfarmschool.com/testimonials",
    sageStatus: "missing" as const,
    sageNote: "No social proof section — high-converting page to add",
  },
  {
    name: "Virtual Tour",
    url: "https://goodearthfarmschool.com/virtual-tour",
    sageStatus: "missing" as const,
    sageNote: "Video/photo tour builds trust before visit — consider adding",
  },
  {
    name: "Contact",
    url: "https://goodearthfarmschool.com/contact",
    sageStatus: "has" as const,
    sageNote: "ContactUsSection covers this",
  },
  {
    name: "Parent Resources (login)",
    url: "https://goodearthfarmschool.com/parent-resources",
    sageStatus: "missing" as const,
    sageNote: "Admin portal exists but no parent-facing portal",
  },
  {
    name: "Blog",
    url: "https://goodearthfarmschool.com/blog",
    sageStatus: "missing" as const,
    sageNote:
      "Neither school has active blog — huge SEO opportunity for Sagefield to lead",
  },
];

const goodEarthStrengths = [
  "Working farm campus — rare differentiator in the region",
  "Waldorf-aligned philosophy with deep nature immersion",
  "Low staff turnover — multiple teachers with 10+ years",
  "Organic, seasonal meals prepared on-site",
  "20+ years of operation — established community trust",
  "100% parent recommendation on Facebook (15 reviews)",
  "School store/merch builds community identity",
];

const goodEarthWeaknesses = [
  "No blog activity since 2017 — missed content marketing opportunity",
  "Limited teacher bios — families can't connect with staff before enrollment",
  "No documented support for children with special needs",
  "Hard enrollment cap — turns away families with no referral path",
  "Website feels dated despite content quality",
  "No email newsletter or lead nurture system visible",
];

function GoodEarthAnalysis() {
  return (
    <div>
      <SectionCard title="Overview">
        <Row label="Full Name" value="Good Earth Farm School" />
        <Row label="Location" value="Sebastopol, CA (Sonoma County)" />
        <Row label="Founded" value="~2002 (20+ years operating)" />
        <Row
          label="Hours"
          value="Mon–Fri, 8:30am–12:30pm (extended care available)"
        />
        <Row label="Website" value="goodearthfarmschool.com" />
        <Row label="Phone" value="(707) 823-xxxx" />
      </SectionCard>

      <SectionCard title="Programs & Pricing">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {["Program", "Age", "Schedule", "Tuition"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px 8px 0",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goodEarthPrograms.map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textPrimary,
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.age}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.schedule}
                  </td>
                  <td
                    style={{
                      padding: "8px 0 8px 0",
                      color: colors.mistyForest,
                      fontWeight: 600,
                    }}
                  >
                    {p.tuition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Enrollment Status">
        <div
          style={{
            backgroundColor: colors.warning,
            borderRadius: radius.md,
            padding: "12px 16px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⏳</span>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: colors.warningText,
              }}
            >
              18-Month Waitlist
            </p>
            <p
              style={{
                fontSize: "12px",
                color: colors.warningText,
                marginTop: "2px",
              }}
            >
              Near 100% capacity year-round. Families routinely wait 1.5+ years
              for a spot.
            </p>
          </div>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          Applications open in October for the following fall. Siblings receive
          priority. Limited openings appear mid-year when families relocate. No
          public waitlist numbers are shared.
        </p>
      </SectionCard>

      <SectionCard title="Website Pages">
        <p
          style={{
            fontSize: "12px",
            color: colors.textSecondary,
            marginBottom: "12px",
          }}
        >
          Pages Good Earth has — compared against Sagefield&apos;s current site:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {["Page", "Good Earth", "Sagefield", "Sagefield Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 12px 8px 0",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {goodEarthPages.map((page, i) => {
                const badgeBg =
                  page.sageStatus === "has"
                    ? colors.success
                    : page.sageStatus === "partial"
                      ? colors.warning
                      : colors.error;
                const badgeText =
                  page.sageStatus === "has"
                    ? colors.successText
                    : page.sageStatus === "partial"
                      ? colors.warningText
                      : colors.errorText;
                const badgeLabel =
                  page.sageStatus === "has"
                    ? "Has it"
                    : page.sageStatus === "partial"
                      ? "Partial"
                      : "Missing";
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                  >
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: colors.mistyForest,
                          textDecoration: "none",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "none")
                        }
                      >
                        {page.name}
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                      </a>
                    </td>
                    <td
                      style={{
                        padding: "9px 12px 9px 0",
                        color: colors.successText,
                        fontWeight: 600,
                      }}
                    >
                      ✅
                    </td>
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: badgeBg,
                          color: badgeText,
                          borderRadius: radius.full,
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "9px 0 9px 0",
                        color: colors.textSecondary,
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {page.sageNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.md,
        }}
      >
        <SectionCard title="Strengths">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {goodEarthStrengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.mistyForest, flexShrink: 0 }}>
                  ✓
                </span>
                <span style={{ color: colors.textPrimary }}>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Weaknesses">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {goodEarthWeaknesses.map((w, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.errorText, flexShrink: 0 }}>
                  ✗
                </span>
                <span style={{ color: colors.textPrimary }}>{w}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Social Media Presence">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: spacing.sm,
          }}
        >
          {[
            {
              platform: "Instagram",
              detail1: "1,383 followers",
              detail2: "2,348 posts",
              icon: "📸",
            },
            {
              platform: "Facebook",
              detail1: "100% recommended",
              detail2: "15 reviews",
              icon: "👍",
            },
            {
              platform: "Yelp",
              detail1: "19 reviews",
              detail2: "~4.5 avg",
              icon: "⭐",
            },
          ].map((s) => (
            <div
              key={s.platform}
              style={{
                backgroundColor: colors.warmLinen,
                borderRadius: radius.md,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                {s.icon}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: "4px",
                }}
              >
                {s.platform}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail1}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail2}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Marketing Strategy">
        <div
          style={{ display: "flex", flexWrap: "wrap", marginBottom: "12px" }}
        >
          {[
            "Word-of-mouth primary",
            "Monthly open houses",
            "Virtual tours offered",
            "School store / merch",
            "Parent testimonials",
            "Social media (Instagram + Facebook)",
          ].map((m) => (
            <Tag
              key={m}
              label={m}
              color={colors.pastelSage}
              textColor={colors.mistyForest}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          No paid advertising detected. Relies heavily on community reputation
          built over 20 years. Email marketing is not publicly visible — no
          newsletter signup found on site. Blog has not been updated since 2017
          despite strong SEO opportunity.
        </p>
      </SectionCard>

      <SectionCard title="Partnership Opportunity">
        <div
          style={{
            backgroundColor: colors.success,
            borderRadius: radius.md,
            padding: "14px 16px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: colors.successText,
              marginBottom: "4px",
            }}
          >
            High-Value Partnership Target
          </p>
          <p
            style={{
              fontSize: "13px",
              color: colors.successText,
              lineHeight: 1.6,
            }}
          >
            An 18-month waitlist means hundreds of families annually cannot
            enroll. These families are pre-qualified — they already value
            outdoor-based, Waldorf-aligned early childhood education.
            Sagefield&apos;s aligned philosophy makes a referral partnership
            natural and credible.
          </p>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: colors.textPrimary,
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            <strong>Strategy:</strong> Reach out to the school director directly
            (not email form) — frame as a collaborative resource for families
            they cannot serve, not as competition.
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Offer:</strong> Formal referral arrangement — they send
            waitlisted families to Sagefield, we acknowledge Good Earth as the
            gold standard in the region.
          </p>
          <p>
            <strong>Talking points:</strong> Same philosophy, different
            geography/capacity. We fill a gap they genuinely cannot fill.
            Parents win, both schools win.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

const acresGrovePrograms = [
  { name: "Infant", age: "Infants", classSize: "8", ratio: "4:1" },
  {
    name: "Toddler",
    age: "Toddlers",
    classSize: "14 per class (×2)",
    ratio: "7:1",
  },
  {
    name: "Primary",
    age: "3–6 yrs",
    classSize: "16 per class (×3)",
    ratio: "8:1",
  },
  { name: "Lower Elementary", age: "~6–9 yrs", classSize: "18", ratio: "9:1" },
];

const acresGrovePages = [
  {
    name: "Home",
    url: "https://acresgrove.com",
    acresStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "Hero + welcome sections cover this well",
  },
  {
    name: "About / Our Mission",
    url: "https://acresgrove.com/about",
    acresStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "WelcomeSection + EducationalPhilosophySection",
  },
  {
    name: "Programs / Classrooms",
    url: "https://acresgrove.com/programs",
    acresStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "WhatWeOfferSection covers programs",
  },
  {
    name: "Tuition & Fees",
    url: "https://acresgrove.com/tuition",
    acresStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "Both schools are missing this — high priority to add",
  },
  {
    name: "Enrollment / Apply",
    url: "https://acresgrove.com/enrollment",
    acresStatus: "partial" as const,
    sageStatus: "partial" as const,
    sageNote: "Only a popup dialog — consider a dedicated /enroll page",
  },
  {
    name: "Academic Calendar",
    url: "https://acresgrove.com/calendar",
    acresStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Families need to know important dates — add this",
  },
  {
    name: "School Store / Shop",
    url: "https://acresgrove.com/store",
    acresStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Community identity builder — low priority for now",
  },
  {
    name: "Testimonials",
    url: "https://acresgrove.com/testimonials",
    acresStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "Both schools are missing this — high-converting page to add",
  },
  {
    name: "Virtual Tour",
    url: "https://acresgrove.com/virtual-tour",
    acresStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "Video/photo tour builds trust before visit",
  },
  {
    name: "Contact",
    url: "https://acresgrove.com/contact",
    acresStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "ContactUsSection covers this",
  },
  {
    name: "Parent Documents / Resources",
    url: "https://acresgrove.com/parent-resources",
    acresStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Families need this — add a parent resources section",
  },
  {
    name: "Careers",
    url: "https://acresgrove.com/careers",
    acresStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Helps with staffing as we grow",
  },
  {
    name: "Blog",
    url: "https://acresgrove.com/blog",
    acresStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote:
      "Neither school has this — huge SEO opportunity for Sagefield to lead",
  },
];

const acresGroveStrengths = [
  "$1.85M in funding raised — professional infrastructure from day one",
  "2 acres with 50+ mature oak trees — rare, stunning natural campus",
  "Industry-leading student-to-teacher ratios (4:1 infant → 9:1 lower elementary)",
  "Full-day program (7:30 AM – 5 PM) — working-family friendly",
  "Serves infant through lower elementary — broadest age range under one philosophy",
  'Jr. Master Gardener program — credentialed enrichment, not just "outdoor play"',
  "Strong employee benefits (401k, medical/dental/vision, 50% tuition discount) — attracts quality staff",
];

const acresGroveWeaknesses = [
  "Only 9 months old — no established reputation or long-term parent testimonials",
  "Tuition not publicly listed — creates friction and loses interest before first contact",
  "Fewer than 5 public parent reviews total — trust gap for new enrolling families",
  '"Montessori-inspired" with no AMS/AMI accreditation — credibility gap vs 53+ certified competitors in Round Rock',
  "Employee reviews flag unclear onboarding and one termination via email — early staff culture risk",
  "Low social media presence (329 Facebook likes) for a school with $1.85M in funding",
];

const insideOutsidePrograms = [
  {
    name: "Primary Class",
    age: "K–1st grade",
    schedule: "Mon–Fri, thematic + nature Fridays",
    tuition: "$10,500/yr",
  },
  {
    name: "Intermediate Class",
    age: "2nd–3rd grade",
    schedule: "Mon–Fri, thematic + nature Fridays",
    tuition: "$10,500/yr",
  },
  {
    name: "Upper Class",
    age: "4th–6th grade",
    schedule: "Mon–Fri, thematic + community stewardship Fri",
    tuition: "$10,500/yr",
  },
  {
    name: "Summer Camp",
    age: "Ages 5–12",
    schedule: "Seasonal",
    tuition: "Not listed",
  },
];

const insideOutsidePages = [
  {
    name: "Home",
    url: "https://insideoutsideschool.org",
    iosStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "Hero + welcome sections cover this well",
  },
  {
    name: "About / Philosophy",
    url: "https://insideoutsideschool.org/about",
    iosStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "WelcomeSection + EducationalPhilosophySection",
  },
  {
    name: "Programs / Academics",
    url: "https://insideoutsideschool.org/programs",
    iosStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "WhatWeOfferSection covers programs",
  },
  {
    name: "Tuition & Fees",
    url: "https://insideoutsideschool.org/tuition",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Inside Outside leads here — Sagefield needs this urgently",
  },
  {
    name: "Enrollment / Apply",
    url: "https://insideoutsideschool.org/enrollment",
    iosStatus: "has" as const,
    sageStatus: "partial" as const,
    sageNote: "Only a popup dialog — consider a dedicated /enroll page",
  },
  {
    name: "Daily Schedule",
    url: "https://insideoutsideschool.org/schedule",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Builds transparency and answers parent FAQs",
  },
  {
    name: "Academic Calendar",
    url: "https://insideoutsideschool.org/calendar",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Families need to know important dates",
  },
  {
    name: "Blog",
    url: "https://insideoutsideschool.org/blog",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Sagefield should lead here — SEO goldmine",
  },
  {
    name: "Testimonials",
    url: "https://insideoutsideschool.org/testimonials",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "High-converting — add parent quotes",
  },
  {
    name: "Meet the Staff",
    url: "https://insideoutsideschool.org/staff",
    iosStatus: "has" as const,
    sageStatus: "missing" as const,
    sageNote: "Trust builder before families even tour",
  },
  {
    name: "Virtual Tour",
    url: "https://insideoutsideschool.org/tour",
    iosStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "Both lack this",
  },
  {
    name: "School Store / Shop",
    url: "https://insideoutsideschool.org/store",
    iosStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "—",
  },
  {
    name: "Parent Resources",
    url: "https://insideoutsideschool.org/parent-resources",
    iosStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "—",
  },
  {
    name: "Contact",
    url: "https://insideoutsideschool.org/contact",
    iosStatus: "has" as const,
    sageStatus: "has" as const,
    sageNote: "ContactUsSection covers this",
  },
  {
    name: "Careers",
    url: "https://insideoutsideschool.org/careers",
    iosStatus: "missing" as const,
    sageStatus: "missing" as const,
    sageNote: "—",
  },
];

const insideOutsideStrengths = [
  "7+ acres on Gilleland Creek with farm animals — rarest campus setting of any local competitor",
  "Tuition publicly listed ($10,500/yr) — full transparency that builds parent trust before first contact",
  "40 years of experience led by founder-director Deborah — deepest credibility of any competitor researched",
  "Active blog with educational content — the only competitor actively using content marketing for SEO",
  'Dedicated "Parents Say..." testimonials page + 100% Facebook recommendation rate — strongest social proof of any competitor',
  'Unique "Seven Dimensions of Human Greatness" framework — distinctive, memorable philosophy families can rally around',
  "No grades, no standardized testing — rare, principled stance that resonates with the right families",
  "Multi-age classrooms K–6 — students build community continuity across years",
];

const insideOutsideWeaknesses = [
  "No Instagram — Facebook only; invisible to younger parents who primarily use Instagram",
  "Hours are 8 AM – 4 PM with no extended care — excludes dual-income working families needing full-day coverage",
  "No class size or student-teacher ratio published — families can't comparison-shop on these key factors",
  "Founding year not published anywhere — misses an opportunity to establish tenure and credibility",
  "Summer camp pricing not listed — friction point that loses warm-lead families before first contact",
  "Small staff with two new hires in fall 2024 (Amylia and Rebecca) — early continuity risk if founder-director Deborah retires",
];

function AcresGroveAnalysis() {
  return (
    <div>
      <SectionCard title="Overview">
        <Row label="Full Name" value="Acres Grove Nature School" />
        <Row label="Location" value="13 Lake Drive, Round Rock, TX 78665" />
        <Row
          label="Founded"
          value="June 2024 (~9 months old as of March 2026)"
        />
        <Row label="Owner / Director" value="Lauren Horn" />
        <Row
          label="Hours"
          value="Mon–Fri, 7:30 AM – 5:00 PM (educational program starts 9 AM)"
        />
        <Row label="Website" value="acresgrove.com" />
        <Row label="Phone" value="(512) 381-1940" />
        <Row label="Funding Raised" value="$1.85M" />
      </SectionCard>

      <SectionCard title="Programs & Ratios">
        <p
          style={{
            fontSize: "12px",
            color: colors.textSecondary,
            marginBottom: "12px",
          }}
        >
          Tuition is not publicly listed — contact required for pricing.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {[
                  "Program",
                  "Age Range",
                  "Class Size",
                  "Student-Teacher Ratio",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px 8px 0",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {acresGrovePrograms.map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textPrimary,
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.age}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.classSize}
                  </td>
                  <td
                    style={{
                      padding: "8px 0 8px 0",
                      color: colors.mistyForest,
                      fontWeight: 600,
                    }}
                  >
                    {p.ratio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Enrollment Status">
        <div
          style={{
            backgroundColor: colors.info,
            borderRadius: radius.md,
            padding: "12px 16px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🌱</span>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: colors.infoText,
              }}
            >
              Limited Spots Available
            </p>
            <p
              style={{
                fontSize: "12px",
                color: colors.infoText,
                marginTop: "2px",
              }}
            >
              New school actively filling seats — growth phase with immediate
              availability.
            </p>
          </div>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          Opened June 2024 and still building enrollment across all programs.
          Families can typically enroll now without a waitlist. A referral bonus
          program ($200) and sibling discounts (10%) are in place to accelerate
          word-of-mouth growth.
        </p>
      </SectionCard>

      <SectionCard title="Website Pages">
        <p
          style={{
            fontSize: "12px",
            color: colors.textSecondary,
            marginBottom: "12px",
          }}
        >
          Pages Acres Grove has — compared against Sagefield&apos;s current
          site:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {["Page", "Acres Grove", "Sagefield", "Sagefield Action"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "6px 12px 8px 0",
                        color: colors.textSecondary,
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {acresGrovePages.map((page, i) => {
                const acresBadge =
                  page.acresStatus === "has"
                    ? "✅"
                    : page.acresStatus === "partial"
                      ? "🟡"
                      : "❌";
                const sageBadgeBg =
                  page.sageStatus === "has"
                    ? colors.success
                    : page.sageStatus === "partial"
                      ? colors.warning
                      : colors.error;
                const sageBadgeText =
                  page.sageStatus === "has"
                    ? colors.successText
                    : page.sageStatus === "partial"
                      ? colors.warningText
                      : colors.errorText;
                const sageBadgeLabel =
                  page.sageStatus === "has"
                    ? "Has it"
                    : page.sageStatus === "partial"
                      ? "Partial"
                      : "Missing";
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                  >
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: colors.mistyForest,
                          textDecoration: "none",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "none")
                        }
                      >
                        {page.name}
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                      </a>
                    </td>
                    <td style={{ padding: "9px 12px 9px 0", fontSize: "16px" }}>
                      {acresBadge}
                    </td>
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: sageBadgeBg,
                          color: sageBadgeText,
                          borderRadius: radius.full,
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sageBadgeLabel}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "9px 0 9px 0",
                        color: colors.textSecondary,
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {page.sageNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.md,
        }}
      >
        <SectionCard title="Strengths">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {acresGroveStrengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.mistyForest, flexShrink: 0 }}>
                  ✓
                </span>
                <span style={{ color: colors.textPrimary }}>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Weaknesses">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {acresGroveWeaknesses.map((w, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.errorText, flexShrink: 0 }}>
                  ✗
                </span>
                <span style={{ color: colors.textPrimary }}>{w}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Social Media Presence">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: spacing.sm,
          }}
        >
          {[
            {
              platform: "Instagram",
              detail1: "@acresgrovenatureschool",
              detail2: "Follower count not public",
              icon: "📸",
            },
            {
              platform: "Facebook",
              detail1: "~329 likes",
              detail2: "3 reviews (new school)",
              icon: "👍",
            },
            {
              platform: "LinkedIn",
              detail1: "66 followers",
              detail2: "Active for hiring",
              icon: "💼",
            },
          ].map((s) => (
            <div
              key={s.platform}
              style={{
                backgroundColor: colors.warmLinen,
                borderRadius: radius.md,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                {s.icon}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: "4px",
                }}
              >
                {s.platform}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail1}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail2}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Marketing Strategy">
        <div
          style={{ display: "flex", flexWrap: "wrap", marginBottom: "12px" }}
        >
          {[
            "Word-of-mouth building",
            "Referral bonus program ($200)",
            "Sibling discounts (10%)",
            "Annual prepayment discount",
            "Tour-first approach",
            "LinkedIn for hiring",
          ].map((m) => (
            <Tag
              key={m}
              label={m}
              color={colors.pastelSage}
              textColor={colors.mistyForest}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          No paid advertising detected. Actively building word-of-mouth with
          referral and sibling incentives. Tuition is hidden behind a contact
          form — likely a deliberate tour-first sales strategy. LinkedIn is used
          primarily for hiring, not parent outreach. Social media volume is low
          relative to their $1.85M funding, suggesting marketing investment is
          still early-stage.
        </p>
      </SectionCard>

      <SectionCard title="Partnership Opportunity">
        <div
          style={{
            backgroundColor: colors.success,
            borderRadius: radius.md,
            padding: "14px 16px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: colors.successText,
              marginBottom: "4px",
            }}
          >
            Mission-Aligned Partnership Target
          </p>
          <p
            style={{
              fontSize: "13px",
              color: colors.successText,
              lineHeight: 1.6,
            }}
          >
            Both schools are new, nature-based, and actively building
            enrollment. Acres Grove serves Round Rock; Sagefield serves a
            different area. A partnership framed around shared expertise — not
            competition — builds goodwill before either school reaches capacity.
          </p>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: colors.textPrimary,
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            <strong>Strategy:</strong> Reach out to Lauren Horn directly — frame
            as a collaborative resource for families outside each other&apos;s
            service area, not as competition.
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Offer:</strong> Cross-refer families who live closer to the
            other school, co-host nature education events, and share curriculum
            resources. They&apos;re not saturated — they&apos;re actively
            filling seats.
          </p>
          <p>
            <strong>Talking points:</strong> Same philosophy, complementary
            geography. A relationship now builds goodwill before either school
            is at capacity. Parents win, both schools win.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function InsideOutsideAnalysis() {
  return (
    <div>
      <SectionCard title="Overview">
        <Row label="Full Name" value="The Inside Outside School" />
        <Row
          label="Location"
          value="5530 Killingsworth Lane, Pflugerville, TX 78660"
        />
        <Row
          label="Campus"
          value="7+ acres of wooded land on Gilleland Creek with farm animals (donkey, goats, chickens)"
        />
        <Row
          label="Director / Founder"
          value="Deborah — B.S. Education (North Texas State), M.S. Curriculum & Instruction (Texas State), 40 years teaching experience"
        />
        <Row
          label="Hours"
          value="Mon–Fri, 8:00 AM – 4:00 PM (no extended care)"
        />
        <Row label="Website" value="insideoutsideschool.org" />
        <Row label="Phone" value="(512) 251-1109" />
      </SectionCard>

      <SectionCard title="Programs & Pricing">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {["Program", "Age Range", "Schedule", "Tuition"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px 8px 0",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insideOutsidePrograms.map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textPrimary,
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.age}
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      color: colors.textSecondary,
                    }}
                  >
                    {p.schedule}
                  </td>
                  <td
                    style={{
                      padding: "8px 0 8px 0",
                      color: colors.mistyForest,
                      fontWeight: 600,
                    }}
                  >
                    {p.tuition}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Enrollment Status">
        <div
          style={{
            backgroundColor: colors.success,
            borderRadius: radius.md,
            padding: "12px 16px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>🌳</span>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: colors.successText,
              }}
            >
              Open & Actively Enrolling
            </p>
            <p
              style={{
                fontSize: "12px",
                color: colors.successText,
                marginTop: "2px",
              }}
            >
              Established school with strong reputation — families contact
              directly to inquire about available spots.
            </p>
          </div>
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          Contact admissions director Cristine
          (cristine@insideoutsideschool.org) for enrollment inquiries. Tuition
          is publicly posted at $10,500/yr for all three K–6 programs. Summer
          camp availability is seasonal.
        </p>
      </SectionCard>

      <SectionCard title="Website Pages">
        <p
          style={{
            fontSize: "12px",
            color: colors.textSecondary,
            marginBottom: "12px",
          }}
        >
          Pages Inside Outside has — compared against Sagefield&apos;s current
          site:
        </p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {[
                  "Page",
                  "Inside Outside",
                  "Sagefield",
                  "Sagefield Action",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 12px 8px 0",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {insideOutsidePages.map((page, i) => {
                const iosBadge = page.iosStatus === "has" ? "✅" : "❌";
                const sageBadgeBg =
                  page.sageStatus === "has"
                    ? colors.success
                    : page.sageStatus === "partial"
                      ? colors.warning
                      : colors.error;
                const sageBadgeText =
                  page.sageStatus === "has"
                    ? colors.successText
                    : page.sageStatus === "partial"
                      ? colors.warningText
                      : colors.errorText;
                const sageBadgeLabel =
                  page.sageStatus === "has"
                    ? "Has it"
                    : page.sageStatus === "partial"
                      ? "Partial"
                      : "Missing";
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                  >
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: colors.mistyForest,
                          textDecoration: "none",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLAnchorElement
                          ).style.textDecoration = "none")
                        }
                      >
                        {page.name}
                        <ExternalLink size={12} style={{ flexShrink: 0 }} />
                      </a>
                    </td>
                    <td style={{ padding: "9px 12px 9px 0", fontSize: "16px" }}>
                      {iosBadge}
                    </td>
                    <td style={{ padding: "9px 12px 9px 0" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: sageBadgeBg,
                          color: sageBadgeText,
                          borderRadius: radius.full,
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sageBadgeLabel}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "9px 0 9px 0",
                        color: colors.textSecondary,
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {page.sageNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.md,
        }}
      >
        <SectionCard title="Strengths">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {insideOutsideStrengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.mistyForest, flexShrink: 0 }}>
                  ✓
                </span>
                <span style={{ color: colors.textPrimary }}>{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Weaknesses">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {insideOutsideWeaknesses.map((w, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: colors.errorText, flexShrink: 0 }}>
                  ✗
                </span>
                <span style={{ color: colors.textPrimary }}>{w}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Social Media Presence">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: spacing.sm,
          }}
        >
          {[
            {
              platform: "Facebook",
              detail1: "~835 likes",
              detail2: "100% recommendation rate · 204 check-ins",
              icon: "👍",
            },
            {
              platform: "Yelp",
              detail1: "13 reviews",
              detail2: "~4.7+ avg rating",
              icon: "⭐",
            },
            {
              platform: "Instagram",
              detail1: "No account",
              detail2: "Significant gap Sagefield can exploit",
              icon: "📸",
            },
          ].map((s) => (
            <div
              key={s.platform}
              style={{
                backgroundColor: colors.warmLinen,
                borderRadius: radius.md,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                {s.icon}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: "4px",
                }}
              >
                {s.platform}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail1}
              </p>
              <p style={{ fontSize: "12px", color: colors.textSecondary }}>
                {s.detail2}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Marketing Strategy">
        <div
          style={{ display: "flex", flexWrap: "wrap", marginBottom: "12px" }}
        >
          {[
            "Tour-first approach",
            "Blog / content marketing",
            "Testimonials page",
            "Word-of-mouth",
            "Facebook only",
            "Alt Ed Austin directory",
            "Open houses / orientation events",
          ].map((m) => (
            <Tag
              key={m}
              label={m}
              color={colors.pastelSage}
              textColor={colors.mistyForest}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.6,
          }}
        >
          No paid advertising detected. Relies on a 40-year community
          reputation, an active blog, and a dedicated testimonials page.
          Facebook-only social presence limits reach to parents 35+. Listed in
          Alt Ed Austin directory — a curated resource families already trust
          when searching for alternative education options.
        </p>
      </SectionCard>

      <SectionCard title="Partnership Opportunity">
        <div
          style={{
            backgroundColor: colors.success,
            borderRadius: radius.md,
            padding: "14px 16px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: colors.successText,
              marginBottom: "4px",
            }}
          >
            Zero-Overlap Referral Target
          </p>
          <p
            style={{
              fontSize: "13px",
              color: colors.successText,
              lineHeight: 1.6,
            }}
          >
            Inside Outside serves K–6 only — no infant, toddler, or Pre-K
            programs. Families with a child at Inside Outside who have a new
            baby or toddler have no in-network option for early childhood
            outdoor-based education. Sagefield is that option.
          </p>
        </div>
        <div
          style={{
            fontSize: "13px",
            color: colors.textPrimary,
            lineHeight: 1.7,
          }}
        >
          <p style={{ marginBottom: "8px" }}>
            <strong>Strategy:</strong> Reach out to director Deborah or
            admissions director Cristine directly — frame as a resource for
            their families who have younger children, not as competition.
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Offer:</strong> A formal referral relationship that gives
            Inside Outside families a trusted early childhood option that shares
            their philosophy — no competitive overlap at any age.
          </p>
          <p>
            <strong>Talking points:</strong> Same nature-based, progressive
            values. Inside Outside families who enroll at Sagefield may
            transition into Inside Outside for K and beyond — a pipeline that
            benefits both schools.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function PlaceholderAnalysis({ name }: { name: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "320px",
        backgroundColor: "white",
        borderRadius: radius.lg,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.border}`,
        padding: spacing.xl,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔭</div>
      <h3
        className={merriweather.className}
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: "8px",
        }}
      >
        {name}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: colors.textSecondary,
          maxWidth: "320px",
          lineHeight: 1.6,
        }}
      >
        Analysis coming soon. Scrape data and fill in this tab when ready.
      </p>
      <div
        style={{
          marginTop: "20px",
          backgroundColor: colors.warmLinen,
          borderRadius: radius.md,
          padding: "8px 16px",
          fontSize: "12px",
          color: colors.textSecondary,
          border: `1px solid ${colors.border}`,
        }}
      >
        Placeholder — no data yet
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  const [activeSchool, setActiveSchool] = useState<SchoolId>("good-earth");

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "100vh" }}>
      {/* Sub-sidebar */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: colors.warmLinen,
          borderRight: `1px solid ${colors.border}`,
          padding: "24px 12px",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <p
          className={merriweather.className}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: colors.textTertiary,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "12px",
            paddingLeft: "8px",
          }}
        >
          Schools
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {schools.map((school) => {
            const active = activeSchool === school.id;
            return (
              <button
                key={school.id}
                onClick={() => setActiveSchool(school.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: radius.md,
                  border: "none",
                  backgroundColor: active ? colors.pastelSage : "transparent",
                  color: active ? colors.mistyForest : colors.textSecondary,
                  fontWeight: active ? 600 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 150ms ease-out",
                  lineHeight: 1.3,
                }}
              >
                <span style={{ display: "block" }}>{school.name}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 400,
                    color: active ? colors.mistyForest : colors.textTertiary,
                    marginTop: "2px",
                  }}
                >
                  {school.location}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px",
          backgroundColor: colors.softCloud,
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            className={merriweather.className}
            style={{
              fontSize: "22px",
              fontWeight: 900,
              color: colors.textPrimary,
              marginBottom: "6px",
            }}
          >
            {schools.find((s) => s.id === activeSchool)?.name}
          </h1>
          <p style={{ fontSize: "13px", color: colors.textSecondary }}>
            Competitor & partnership analysis ·{" "}
            {schools.find((s) => s.id === activeSchool)?.location}
          </p>
        </div>

        {activeSchool === "good-earth" && <GoodEarthAnalysis />}
        {activeSchool === "acres-grove" && <AcresGroveAnalysis />}
        {activeSchool === "inside-outside" && <InsideOutsideAnalysis />}
      </main>
    </div>
  );
}
