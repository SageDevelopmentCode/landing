"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

// ATTORNEY REVIEW NOTES (before publishing):
// 1. FERPA — confirm whether a private microschool of this size is directly covered or only aspirationally following FERPA principles
// 2. Texas SDPA / Ed Code Ch. 32 — verify which provisions apply; may require additional disclosures
// 3. HIPAA — verify "not a covered entity" is accurate for this school's structure
// 4. Driver's license collection — review Texas Identity Theft Enforcement & Protection Act compliance
// 5. Digital signature validity — confirm Texas UETA compliance for enrollment waivers
// 6. Meta Pixel + COPPA — FTC guidance on behavioral advertising pixels on sites serving parents of under-13s
// 7. Data retention minimums — confirm exact TX regulatory minimums for private school records
// 8. Liability limitations — review enforceability under TX law for services involving minor children

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "who-we-are",
    title: "1. Who We Are",
    content: (
      <p>
        Sage Field Private School (&ldquo;Sage Field,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a private microschool
        located at 2760 Gattis School Rd, Round Rock, TX 78664. We operate a
        website at sagefield.co, a parent portal (web), and a companion mobile
        application (collectively, the &ldquo;Services&rdquo;). This Privacy
        Policy explains how we collect, use, share, and protect information when
        you interact with our Services.
        <br />
        <br />
        Questions? Contact us any time at{" "}
        <a
          href="mailto:sabrina@sagefield.co"
          className="text-primary hover:underline"
        >
          sabrina@sagefield.co
        </a>{" "}
        or by mail at the address above.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 font-heading">
            2a. Information You Give Us Directly
          </h3>
          <p className="mb-4">
            When you interact with Sage Field — whether through an interest
            form, a tour booking, an enrollment application, or your parent
            portal account — you may provide:
          </p>
          <div className="space-y-4">
            <div>
              <strong className="text-gray-800">
                Parent and Guardian Information:
              </strong>{" "}
              Full name, email address, cell phone, work phone, home address,
              profile photo, relationship to child, preferred contact method,
              custody status, and emergency contact details (both in-state and
              out-of-state contacts).
            </div>
            <div>
              <strong className="text-gray-800">
                Authorized Pickup Information:
              </strong>{" "}
              Names of persons authorized to pick up your child, along with
              driver&apos;s license numbers, license plate numbers, vehicle
              descriptions (make, model, color), and authorization effective
              dates. We collect this solely to keep your child safe during
              pickup.
            </div>
            <div>
              <strong className="text-gray-800">
                Child and Student Information:
              </strong>{" "}
              Your child&apos;s legal name, preferred name, date of birth,
              current age, grade level, home address, school history, homeschool
              status, and gender.
            </div>
            <div>
              <strong className="text-gray-800">
                Health and Medical Information:
              </strong>{" "}
              We collect detailed health information including medical
              conditions, allergies, current medications (name, dosage,
              frequency, condition treated, and expiration date), emergency
              medication plans and procedures, immunization records (uploaded
              documents), health insurance details (provider, policy number,
              group number), your child&apos;s physician name and phone number,
              preferred hospital, and notes about ongoing medical care. We also
              collect history flags related to seizures, asthma, anxiety,
              elopement, aggression, and self-harm. This information is used
              exclusively to keep your child safe while in our care.
            </div>
            <div>
              <strong className="text-gray-800">
                Behavioral and Developmental Information:
              </strong>{" "}
              Learning style, interests, strengths, current challenges,
              strategies that help your child regulate and focus, activities to
              avoid, special interests, and notes about whether an aide is
              needed. Sage Field staff may add professional observation notes to
              your child&apos;s file.
            </div>
            <div>
              <strong className="text-gray-800">
                Digital Signatures and Consents:
              </strong>{" "}
              Electronic signatures on enrollment contracts, liability waivers,
              health forms, community agreements, and photo/video release
              consent forms. We record the date and content of each signed
              document.
            </div>
            <div>
              <strong className="text-gray-800">Communications:</strong>{" "}
              Messages you send to or receive from Sage Field staff through the
              parent portal or app, including text and image attachments.
              Teacher posts on the parent feed, comments, and reactions are also
              stored.
            </div>
            <div>
              <strong className="text-gray-800">Attendance Records:</strong>{" "}
              Check-in and check-out timestamps for your child, along with any
              notes recorded at drop-off or pickup.
            </div>
            <div>
              <strong className="text-gray-800">Volunteer Information:</strong>{" "}
              Skills and experience, general availability, and preferred
              volunteer areas if you express interest in volunteering with Sage
              Field.
            </div>
            <div>
              <strong className="text-gray-800">
                Tour and Contact Inquiries:
              </strong>{" "}
              Name, email, phone, child name, child grade, number of children,
              referral source, and any notes submitted through our tour booking
              or contact forms.
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 font-heading">
            2b. Payment Information
          </h3>
          <p>
            We use Stripe, a third-party payment processor, to handle all credit
            card transactions. Sage Field does not store your full credit card
            number. We retain records of payment amounts, transaction IDs,
            billing contact details, payment type (registration, tuition,
            aftercare, fun Friday), and payment history for accounting and
            enrollment tracking. Stripe&apos;s use of your payment data is
            governed by Stripe&apos;s own Privacy Policy at stripe.com/privacy.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 font-heading">
            2c. Information We Collect Automatically
          </h3>
          <p className="mb-3">
            When you use our website or app, we automatically collect certain
            technical data:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-gray-800">
                Cookies and session data
              </strong>{" "}
              used to keep you logged in and maintain your preferences.
            </li>
            <li>
              <strong className="text-gray-800">
                User behavior analytics
              </strong>{" "}
              collected through PostHog, which tracks how pages and features are
              used to help us improve the experience. PostHog may collect device
              type, browser type, pages visited, and button interactions.
            </li>
            <li>
              <strong className="text-gray-800">Marketing data</strong>{" "}
              collected through Meta Pixel (Facebook) and Google Analytics,
              which help us understand how families discover Sage Field and
              improve our outreach. These tools may use cookies or similar
              {/* ATTORNEY REVIEW: Meta Pixel on a site serving parents of under-13s — see COPPA note at top of file */}
              tracking technologies.
            </li>
            <li>
              <strong className="text-gray-800">
                Vercel Analytics and Speed Insights
              </strong>{" "}
              for site performance monitoring.
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    content: (
      <div>
        <p className="mb-4">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            To enroll your child and manage their ongoing participation at Sage
            Field
          </li>
          <li>
            To keep your child safe — medical, allergy, emergency, and
            behavioral information is used by staff who work directly with your
            child
          </li>
          <li>
            To communicate with you about school updates, your child&apos;s
            progress, scheduling, and school events through the parent portal
            and app
          </li>
          <li>
            To process tuition payments and maintain financial records
          </li>
          <li>
            To operate and improve the website, parent portal, and mobile app
          </li>
          <li>
            To respond to tour bookings, interest forms, and general inquiries
          </li>
          <li>
            To comply with legal obligations, including applicable education,
            child safety, and data privacy laws
          </li>
          <li>
            To understand how families discover and use Sage Field (analytics
            and marketing outreach)
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "how-we-share",
    title: "4. How We Share Your Information",
    content: (
      <div className="space-y-4">
        <p>
          We do not sell your personal information. We do not share your data
          with third-party advertisers for their own marketing purposes. We
          share information only in these limited circumstances:
        </p>
        <div>
          <strong className="text-gray-800">Service Providers:</strong> We work
          with trusted technology partners who process data on our behalf under
          strict confidentiality terms. These include:
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>
              <strong>Secure database infrastructure</strong> — hosted in the
              United States
            </li>
            <li>
              <strong>Stripe</strong> — payment processing
            </li>
            <li>
              <strong>PostHog</strong> — user behavior analytics
            </li>
            <li>
              <strong>Meta / Facebook</strong> — Meta Pixel for conversion and
              ad audience analytics
            </li>
            <li>
              <strong>Google</strong> — Google Analytics and Search Console
            </li>
            <li>
              <strong>Vercel</strong> — website hosting and performance
              analytics
            </li>
          </ul>
        </div>
        <div>
          <strong className="text-gray-800">Within Our Team:</strong> Staff and
          teachers may access information relevant to their role — for example,
          a teacher will see a student&apos;s health and behavioral profile, but
          not unrelated family financial records.
        </div>
        <div>
          <strong className="text-gray-800">Legal Requirements:</strong> We may
          disclose information when required by law, court order, or to protect
          the safety of a child or others, including mandatory reporting
          obligations under Texas law.
        </div>
        <div>
          <strong className="text-gray-800">School Record Transfers:</strong> If
          you request records for transfer purposes, we will share them with you
          directly for your own use.
        </div>
      </div>
    ),
  },
  {
    id: "childrens-privacy",
    title: "5. Children's Privacy (COPPA)",
    content: (
      <div className="space-y-4">
        <p>
          We serve children ages 4–11, and we take the privacy of minors
          seriously. All student data is collected from parents or guardians —
          not directly from children. By enrolling your child and creating a
          parent portal account, you (as the parent or legal guardian) are
          providing consent for us to collect and use your child&apos;s
          information as described in this policy.
        </p>
        <p>
          We do not knowingly allow children under 13 to create accounts or
          directly submit personal information through our Services.
        </p>
        <p>
          If you believe we have inadvertently collected information directly
          from a child without verifiable parental consent, please contact us
          immediately at{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>{" "}
          and we will promptly delete it.
        </p>
      </div>
    ),
  },
  {
    id: "education-records",
    title: "6. Education Records (FERPA)",
    content: (
      <div className="space-y-4">
        {/* ATTORNEY REVIEW: Confirm whether direct FERPA applicability applies to a private microschool of this size */}
        <p>
          Sage Field maintains education records as part of our enrollment and
          program operations. We treat student education records with care
          consistent with the principles of the Family Educational Rights and
          Privacy Act (FERPA).
        </p>
        <p>This means:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Parents and guardians may request to review their child&apos;s
            education records on file with Sage Field by contacting{" "}
            <a
              href="mailto:sabrina@sagefield.co"
              className="text-primary hover:underline"
            >
              sabrina@sagefield.co
            </a>
            .
          </li>
          <li>
            We will not share student education records with third parties
            outside of the service providers listed in this policy without
            parent consent, except where required by law.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "health-information",
    title: "7. Health Information",
    content: (
      <div className="space-y-4">
        <p>
          {/* ATTORNEY REVIEW: Verify "not a covered entity under HIPAA" is accurate for this school's structure */}
          While Sage Field is not a covered entity under the Health Insurance
          Portability and Accountability Act (HIPAA), we treat all health and
          medical information we collect with the same seriousness and care.
          Health data is:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Accessible only to staff who need it to keep your child safe
          </li>
          <li>
            Never sold or shared with third parties for commercial purposes
          </li>
          <li>
            Stored securely in our encrypted database
          </li>
          <li>
            Retained only as long as your child is enrolled or as required to
            comply with applicable Texas law
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "photo-consent",
    title: "8. Photo and Video Consent",
    content: (
      <p>
        During enrollment, you will choose a consent level for photos and videos
        of your child:{" "}
        <strong className="text-gray-800">Full</strong> (school uses on website,
        social media, and marketing materials),{" "}
        <strong className="text-gray-800">Limited</strong> (internal school use
        only, no public sharing), or{" "}
        <strong className="text-gray-800">None</strong> (no photos or videos of
        your child taken or used). We honor these preferences at all times. If
        you wish to change your selection, contact us at{" "}
        <a
          href="mailto:sabrina@sagefield.co"
          className="text-primary hover:underline"
        >
          sabrina@sagefield.co
        </a>
        .
      </p>
    ),
  },
  {
    id: "data-retention",
    title: "9. Data Retention",
    content: (
      <p>
        We retain personal information for as long as your family has an active
        relationship with Sage Field, and for a reasonable period afterward for
        record-keeping and legal purposes. Health, medical, and emergency contact
        records for enrolled students are retained for the duration of enrollment
        {/* ATTORNEY REVIEW: Confirm exact TX regulatory minimums for private school record retention */}
        plus the minimum period required under Texas law. You may request
        deletion of your account data at any time — see Section 10 below.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "10. Your Rights",
    content: (
      <div className="space-y-4">
        <p>
          You have the following rights regarding your personal information:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-gray-800">Access:</strong> Request a copy of
            the personal information we hold about you or your child.
          </li>
          <li>
            <strong className="text-gray-800">Correction:</strong> Request
            corrections to inaccurate or outdated information.
          </li>
          <li>
            <strong className="text-gray-800">Deletion:</strong> Request
            deletion of your account and associated personal data, subject to
            any legal retention obligations.
          </li>
          <li>
            <strong className="text-gray-800">
              Opt-Out of Marketing Analytics:
            </strong>{" "}
            You may opt out of Meta Pixel tracking and Google Analytics through
            your browser settings or using the standard opt-out mechanisms
            provided by those platforms.
          </li>
        </ul>
        <p>
          To exercise any of these rights, email us at{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>
          . We will respond within 30 days.
        </p>
        <p>
          <strong className="text-gray-800">Texas Residents:</strong> Under
          Texas law, you may have additional rights regarding your personal data.
          For inquiries specific to Texas data privacy, please contact us at the
          address or email above.
        </p>
      </div>
    ),
  },
  {
    id: "data-security",
    title: "11. Data Security",
    content: (
      <div className="space-y-3">
        <p>
          We use industry-standard safeguards to protect your information,
          including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Encrypted transmission (HTTPS/TLS) for all data in transit</li>
          <li>Encrypted database storage</li>
          <li>
            Role-based access controls limiting which staff members can view
            sensitive data
          </li>
          <li>Regular review of our security practices</li>
        </ul>
        <p>
          No method of transmission over the internet is 100% secure. We cannot
          guarantee absolute security, but we are committed to protecting your
          family&apos;s data with care.
        </p>
      </div>
    ),
  },
  {
    id: "third-party-links",
    title: "12. Third-Party Links",
    content: (
      <p>
        Our website may contain links to external sites such as social media
        profiles. We are not responsible for the privacy practices of
        third-party sites. We encourage you to review their privacy policies
        before providing any personal information.
      </p>
    ),
  },
  {
    id: "changes",
    title: "13. Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. When we make
        material changes, we will update the &ldquo;Last Updated&rdquo; date at
        the top of this page and, where appropriate, notify enrolled families by
        email. Continued use of our Services after changes become effective
        constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "14. Contact Us",
    content: (
      <div className="space-y-1">
        <p className="font-semibold text-gray-800">
          Sage Field Private School
        </p>
        <p>2760 Gattis School Rd, Round Rock, TX 78664</p>
        <p>
          Email:{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>
        </p>
        <p>
          Phone:{" "}
          <a
            href="tel:+15126775872"
            className="text-primary hover:underline"
          >
            (512) 677-5872
          </a>
        </p>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-12 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" as const }}
          >
            <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
              Privacy Policy
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            className="text-lg text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            We take your family&apos;s privacy seriously. Here&apos;s exactly
            what we collect, why, and how we protect it.
          </motion.p>

          <motion.p
            className="text-sm text-gray-400 font-body mt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" as const }}
          >
            Last Updated: April 8, 2026
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-8 sm:px-12 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index < 3 ? index * 0.1 : 0,
                  ease: "easeOut" as const,
                }}
              >
                <h2 className="text-xl md:text-2xl font-bold mb-4 font-heading text-gray-800 border-b border-gray-200 pb-2">
                  {section.title}
                </h2>
                <div className="font-body text-gray-600 leading-relaxed">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <FloatingSMSButton />
    </div>
  );
}
