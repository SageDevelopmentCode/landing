'use client'

import { useState } from 'react'
import { Poppins } from 'next/font/google'
import { cssColors as colors, radius } from '../design-system'

const poppins = Poppins({
  weight: ['300', '400', '600', '700', '900'],
  subsets: ['latin'],
})

type FAQItem = {
  question: string
  answer: string
}

type FAQSection = {
  title: string
  badge: string
  items: FAQItem[]
}

const faqSections: FAQSection[] = [
  {
    title: 'Pricing',
    badge: '💰',
    items: [
      {
        question: 'How much does the Homeschool Drop-In cost for 1 day per week?',
        answer:
          'For 1x/week, day pass pricing applies — there is no weekly membership at 1 day. Summer: $95/day (2nd–4th Grade) or $100/day (Primary). School Year: $110/day (2nd–4th Grade) or $120/day (Primary).',
      },
      {
        question: 'What are the full Homeschool Drop-In rates?',
        answer:
          'Summer — 2-day/week: $170/wk (2nd–4th), $180/wk (Primary). 3-day/week: $240/wk (2nd–4th), $255/wk (Primary). Full-time 5 days: $350/wk (2nd–4th), $375/wk (Primary).\n\nSchool Year — 2-day/week: $520/mo (2nd–4th), $560/mo (Primary). 3-day/week: $720/mo (2nd–4th), $780/mo (Primary). Full-time: $1,095/mo (2nd–4th), $1,195/mo (Primary).',
      },
      {
        question: 'What does Summer 2026 full enrollment cost?',
        answer:
          '$350/week (2nd–4th Grade) or $375/week (Primary). Commit to the full 12 weeks and get a 10% discount: $3,780 (2nd–4th) or $4,050 (Primary). One-time registration fee: $75.',
      },
      {
        question: 'What does the School Year 2026–2027 cost?',
        answer:
          '$1,095/month (2nd–4th Grade) or $1,195/month (Primary). Fees: $500 first-time registration, $300 re-registration, $300 annual supply fee.',
      },
      {
        question: 'Is there a registration or enrollment fee?',
        answer:
          'Yes. Summer: $75 one-time registration fee. School Year: $500 first-time registration, $300 re-registration, $300 annual supply fee.',
      },
      {
        question: 'Is there an aftercare option? What does it cost?',
        answer:
          'Yes — After Care runs 3:00pm–6:00pm. Drop-in: $35/day. Monthly for enrolled students: $375/month. After Care Only (non-enrolled families): $475/month.',
      },
      {
        question: 'What is Field Day Friday and what does it cost?',
        answer:
          'Field Day Fridays are optional Fridays from 9:00am–1:00pm with outdoor adventures and activities. Package of 4 sessions: $200/month ($50/session, expires monthly). Drop-in per session: $60.',
      },
    ],
  },
  {
    title: 'Curriculum & Academics',
    badge: '📚',
    items: [
      {
        question: 'What curriculum does Sage Field use?',
        answer:
          "We blend Montessori, Waldorf, and Reggio Emilia methods with TEKS-aligned academics. There's no single packaged curriculum — our teachers design lessons that draw from all three philosophies and align to Texas state academic standards.",
      },
      {
        question: 'What subjects are taught?',
        answer:
          'Literacy, numeracy, science, nature study, art, music, movement, and social-emotional learning. Academics are woven throughout the day rather than delivered as isolated subjects.',
      },
      {
        question: 'How are academics delivered?',
        answer:
          'Morning blocks of ~15 minutes each for reading/English, math, and writing. Children are grouped by ability and interest, not grade level. Afternoons focus on exploration, projects, art, nature, and movement.',
      },
      {
        question: 'Will my child keep up with grade-level expectations?',
        answer:
          'Yes — our curriculum is TEKS-aligned. Because we teach to ability rather than age or grade label, many children move ahead of grade-level expectations.',
      },
      {
        question: 'Do parents need to supplement at home?',
        answer:
          'No. Sage Field is a full drop-off program. Families do not need to provide or supplement any academic curriculum at home unless they personally choose to.',
      },
    ],
  },
  {
    title: 'Daily Schedule',
    badge: '🗓️',
    items: [
      {
        question: 'What does a typical day look like?',
        answer:
          'Mornings (9am–noon): focused academic blocks in literacy, math, and writing — short, engaging, ability-grouped. Afternoons (noon–3pm): nature exploration, science, art, movement, sports-style games, and social-emotional learning. The day is designed to feel calm, connected, and full of curiosity.',
      },
      {
        question: 'What are the school hours?',
        answer:
          '9:00am–3:00pm, Monday through Thursday. Optional After Care is available from 3:00pm–6:00pm.',
      },
      {
        question: 'What happens on Fridays?',
        answer:
          'Fridays are optional Field Days (9am–1pm) available as an add-on. They are not part of the core Mon–Thu program.',
      },
    ],
  },
  {
    title: 'Discipline & Behavior',
    badge: '🤝',
    items: [
      {
        question: 'What is your discipline approach?',
        answer:
          "We prioritize regulation, connection, and collaborative problem-solving — no punitive or shame-based discipline. We teach children to notice their own bodies, respect limits, and consider others' safety. The phrase we use is 'try risky things safely.'",
      },
      {
        question: 'What happens if my child struggles with behavior?',
        answer:
          'We work with the child and family first. If behavior repeatedly endangers the child, others, or the environment, we issue a formal written warning. If unsafe behavior continues, enrollment may end to protect the wider community.',
      },
      {
        question: 'Do you support neurodivergent children?',
        answer:
          "Yes — our small class size, clear rhythms, and relationship-based environment work well for many neurodivergent and high-sensitivity children. We are not a therapeutic program or medical provider. For very high-support needs, families may need to provide a 1:1 aide. In some cases we may determine Sage Field isn't the right fit to keep everyone safe.",
      },
    ],
  },
  {
    title: 'Philosophy of Education',
    badge: '🌿',
    items: [
      {
        question: 'What is your educational philosophy?',
        answer:
          "We blend Montessori (child-led, hands-on), Waldorf (arts, rhythm, holistic development), and Reggio Emilia (project-based, environment as teacher) — all grounded in TEKS-aligned academics. Our goal is wisdom over knowledge: helping children connect ideas to real experiences, build empathy, and make thoughtful choices.",
      },
      {
        question: 'What does "Sage Field" mean?',
        answer:
          'Sage represents wisdom — the understanding that comes from curiosity, reflection, and experience. Field is the open ground where growth happens. We see every child as a seed of potential to be nurtured into their fullest, wisest self.',
      },
      {
        question: 'Why mixed-age groups?',
        answer:
          'Mixed ages let children move at their own pace. Older children reinforce learning by mentoring; younger children are inspired to stretch. It mirrors real-world social dynamics and builds genuine collaboration skills.',
      },
      {
        question: 'How big are the classes?',
        answer:
          '~10 children per class with 2 adults. This ratio means truly individualized attention — teachers know every child well.',
      },
    ],
  },
  {
    title: 'Enrollment',
    badge: '📝',
    items: [
      {
        question: 'How do we enroll?',
        answer:
          "Complete the application at sagefieldschool.com/apply. We'll connect with your family to confirm a good mutual fit, then finalize enrollment with a signed Enrollment Agreement and registration fee.",
      },
      {
        question: 'What is the commitment?',
        answer:
          'Summer: pay per week, or commit to the full 12 weeks for a 10% discount. School Year: 6-month commitment. Homeschool Drop-In: no long-term commitment — pay per day or monthly.',
      },
      {
        question: 'When does enrollment close?',
        answer:
          'Enrollment is currently open for Summer 2026 and School Year 2026–2027. We keep classes at ~10 children, so spots fill quickly.',
      },
    ],
  },
]

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span
          className={poppins.className}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: colors.textPrimary,
            lineHeight: 1.4,
          }}
        >
          {item.question}
        </span>
        <span
          style={{
            flexShrink: 0,
            fontSize: '16px',
            color: colors.textTertiary,
            marginTop: '1px',
            transition: 'transform 150ms ease-out',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className={poppins.className}
          style={{
            fontSize: '13px',
            color: colors.textSecondary,
            lineHeight: 1.65,
            paddingBottom: '14px',
            whiteSpace: 'pre-line',
          }}
        >
          {item.answer}
        </div>
      )}
    </div>
  )
}

export function InfoSessionFAQView() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={poppins.className}
          style={{
            fontSize: '22px',
            fontWeight: 900,
            color: colors.textPrimary,
            marginBottom: '6px',
          }}
        >
          Session FAQ — April 18
        </h1>
        <p style={{ fontSize: '13px', color: colors.textSecondary, fontFamily: 'inherit' }}>
          Reference answers for common parent questions. Based on live website content.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {faqSections.map((section) => (
          <div
            key={section.title}
            style={{
              backgroundColor: 'white',
              borderRadius: radius.lg,
              border: `1px solid ${colors.border}`,
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{section.badge}</span>
              <h2
                className={poppins.className}
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: 0,
                }}
              >
                {section.title}
              </h2>
            </div>

            <div>
              {section.items.map((item) => (
                <AccordionItem key={item.question} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
