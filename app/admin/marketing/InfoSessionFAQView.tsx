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
          'Yes — After Care runs 3:00pm–6:00pm. Drop-in: $35/day. Monthly for enrolled students: $375/month (~$23/day). After Care Only (non-enrolled families): $475/month (~$10/hour).',
      },
      {
        question: 'What is Field Day Friday and what does it cost?',
        answer:
          'Field Day Fridays are optional Fridays from 9:00am–1:00pm with outdoor adventures and activities. Package of 4 sessions: $200/month ($50/session, expires monthly). Drop-in per session: $60.',
      },
      {
        question: 'What happens if we need to withdraw mid-term?',
        answer:
          "Withdrawing mid-term does not automatically release outstanding tuition obligations — the terms in the signed Enrollment Agreement govern what is owed. Registration and materials fees are non-refundable. If there's a billing dispute, contact sabrina@sagefield.co before initiating a chargeback.",
      },
      {
        question: 'How is payment processed?',
        answer:
          'Payments are processed through Stripe. A payment method stays on file and is charged according to the enrollment plan. Failed payments trigger a notification; unresolved balances may suspend portal access and affect enrollment status.',
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
      {
        question: 'What does "ability-based grouping" actually mean in practice?',
        answer:
          "Children are assessed on where they are in literacy and numeracy, then grouped with peers at a similar level — regardless of age or grade. A 6-year-old who reads at a 3rd-grade level works alongside older children in reading. A 9-year-old who needs more support in math isn't left behind or singled out. Groups shift as children grow.",
      },
      {
        question: 'What does the summer academic block look like specifically?',
        answer:
          'Each morning has three ~15-minute academic blocks: one for ELA/reading, one for math, one for writing/journaling. These are short and targeted by design — kids stay engaged because the blocks end before attention fades. The rest of the day is activity-based and theme-driven.',
      },
      {
        question: "What are the summer 2026 weekly themes?",
        answer:
          "Week 1 (May 26–29): Welcome to Camp · Week 2 (Jun 1–4): Mystery Camp Escape Challenge · Week 3 (Jun 8–11): Beach Day Bash · Week 4 (Jun 15–18): Scientist & Space Engineering Lab · Week 5 (Jun 22–25): Safari Escape · Week 6 (Jun 29–Jul 2): Splash Into Summer · Week 7 (Jul 6–9): Dino Hunt · Week 8 (Jul 13–16): Pirate Adventure · Week 9 (Jul 20–23): You Are a Superhero! · Week 10 (Jul 27–30): Space Explorers: Mission to the Stars · Week 11 (Aug 3–6): Down on the Farm · Week 12 (Aug 10–13): Finale of Camp.",
      },
      {
        question: 'Does Sage Field give grades, report cards, or transcripts?',
        answer:
          'No — we are a private microschool operating under Texas private school law, not a traditionally accredited institution. We provide descriptive, portfolio-based feedback on each child\'s growth. Families manage any additional records they personally want to keep.',
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
        question: 'What is the exact daily schedule for Summer 2026?',
        answer:
          '8:30–9:00 AM: Check-In & Free Play\n9:00–9:15 AM: Good Citizenship Meeting\n9:15–9:30 AM: ELA/Reading Block\n9:30–9:45 AM: Math Block\n9:45–10:15 AM: Morning Snack Break\n10:15–10:45 AM: Daily Themed Activity\n10:45–11:15 AM: Art\n11:15–11:30 AM: Music\n11:30 AM–12:15 PM: Lunch\n12:15–1:15 PM: Water Play\n1:15–1:45 PM: Journaling & Reflection\n1:45–2:30 PM: Homesteading\n2:30–3:30 PM: Outdoor Exploration & Dismissal',
      },
      {
        question: 'What are the school hours?',
        answer:
          '9:00am–3:00pm, Monday through Thursday (doors open at 8:30am). Optional After Care is available from 3:00pm–6:00pm.',
      },
      {
        question: 'What happens on Fridays?',
        answer:
          'Fridays are optional Field Days (9am–1pm) available as an add-on. They are not part of the core Mon–Thu program. Each Friday is a unique outdoor/nature experience — themes change weekly.',
      },
      {
        question: 'What does drop-off and pick-up look like?',
        answer:
          'Doors open at 8:30am for check-in and free play. The structured day begins at 9:00am. Dismissal is at 3:30pm (end of outdoor exploration block). After Care extends to 6:00pm for families who need it.',
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
      {
        question: 'What specific behaviors can Sage Field NOT accommodate?',
        answer:
          "We cannot safely accommodate ongoing elopement/running away, significant medical fragility requiring clinical intervention, or repeated violent outbursts toward others. These are the clear lines — not because we don't care, but because keeping the whole community safe is the priority.",
      },
      {
        question: 'Do you handle medications or medical needs?',
        answer:
          "We do not administer routine or over-the-counter medications. The only exception is life-saving emergency medications (EpiPens, rescue inhalers) provided and documented by parents — staff may assist in good faith during emergencies. Families send all snacks and lunches from home; no food sharing except between siblings/household members.",
      },
      {
        question: "What's the process before a child is disenrolled for behavior?",
        answer:
          'We always work with the child and family first — regulation, connection, problem-solving. If unsafe behavior is repeated, we issue a formal written warning. Only if that doesn\'t resolve the situation do we consider ending enrollment. It is never a first response.',
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
      {
        question: 'Who are the teachers and what are their qualifications?',
        answer:
          "Sabrina Grace Obnamia (Lead Teacher & Director) — B.S. in Elementary Education with a concentration in Early Childhood Development from Biola University, plus a Teaching Credential. Her experience spans special education, preschool, homeschooling, tutoring, traditional schooling, and nature school guiding in the U.S. and internationally.\n\nPaige Wood (Primary Lead Teacher) — experienced in Montessori-style education and outdoor learning.\n\nZelinda Melo (Teacher Aide) — focused on nurturing, safe, and encouraging environments.\n\nNicole Elias & Taylor Elias (Summer Program Coordinators) — education backgrounds with focus on child development, outdoor learning, and nature-inspired curriculum.",
      },
      {
        question: 'What does Montessori vs. Waldorf vs. Reggio Emilia actually look like in the classroom?',
        answer:
          "Montessori: children choose activities from curated materials, work at their own pace, and build independence. Waldorf: rhythm and routine matter — art, music, and storytelling are woven through academics, not treated as extras. Reggio Emilia: the environment itself is a teacher; projects emerge from children's questions and curiosity rather than a fixed syllabus. We pull from all three based on what each moment calls for.",
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
      {
        question: 'What does the application and enrollment process look like step by step?',
        answer:
          '1. Complete the online application at sagefieldschool.com/apply (choose Summer, School Year, or Homeschool Drop-In).\n2. We schedule a mutual-fit conversation to make sure Sage Field is the right environment for your child.\n3. If we offer a spot, you sign the Enrollment Agreement, complete risk/medical/media consent forms, and pay the registration fee.\n4. Your child\'s spot is held once all three steps are complete.',
      },
      {
        question: 'What is the School Year 2026–2027 commitment, and what happens after March 2027?',
        answer:
          "The School Year is a 6-month commitment running August 17, 2026 – March 2027. What happens beyond March 2027 has not yet been announced on the site — families interested in continuing should ask directly at the session.",
      },
      {
        question: 'Can a homeschool drop-in child join a class mid-week alongside full-enrolled students?',
        answer:
          'Yes — drop-in children join the same class as enrolled students. Every drop-in child gets access to all enrichments (art, music, movement, science, SEL) on the days they attend. They are part of the same community, not a separate track.',
      },
      {
        question: 'Where is Sage Field located?',
        answer:
          '2760 Gattis School Rd, Round Rock, TX 78664. Contact: sabrina@sagefield.co or (512) 677-5872.',
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
