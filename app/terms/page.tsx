"use client";

import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";

// ATTORNEY REVIEW NOTES (before publishing):
// 1. Limitation of Liability and Indemnification — review enforceability under TX law for services involving minor children
// 2. Digital signature validity — confirm Texas UETA compliance for enrollment contracts and waivers
// 3. Governing law and venue — confirm Williamson County is the correct venue for this entity
// 4. Payment Terms / tuition commitment language — align precisely with Enrollment Agreement terms before publishing

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <p>
        By accessing or using the Sage Field Private School website at
        sagefield.co, the parent portal, or the Sage Field mobile application
        (collectively, the &ldquo;Services&rdquo;), you agree to be bound by
        these Terms of Use (&ldquo;Terms&rdquo;). If you do not agree, please do
        not use the Services.
        <br />
        <br />
        These Terms apply to all users, including prospective families, enrolled
        families, school staff, volunteers, and anyone who browses our website.
      </p>
    ),
  },
  {
    id: "who-we-are",
    title: "2. Who We Are",
    content: (
      <p>
        Sage Field Private School is a private microschool located at 2760
        Gattis School Rd, Round Rock, TX 78664, operating under Texas law. Our
        website and app are operated to support enrollment, school operations,
        and communication with our school community.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "3. Eligibility",
    content: (
      <div className="space-y-3">
        <p>
          The parent portal and mobile app are intended for use by:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Parents and guardians of enrolled or prospectively enrolled students
          </li>
          <li>Sage Field staff and teachers in their official capacity</li>
        </ul>
        <p>
          By creating an account, you represent that you are at least 18 years
          old and are the parent, legal guardian, or authorized representative
          of the student whose information you are providing.
        </p>
      </div>
    ),
  },
  {
    id: "account-responsibilities",
    title: "4. Account Responsibilities",
    content: (
      <div className="space-y-3">
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Provide accurate, current, and complete information when creating an
            account or enrolling a student
          </li>
          <li>
            Promptly update your information if it changes — particularly
            emergency contacts, health updates, and authorized pickup persons
          </li>
          <li>
            Notify us immediately at{" "}
            <a
              href="mailto:sabrina@sagefield.co"
              className="text-primary hover:underline"
            >
              sabrina@sagefield.co
            </a>{" "}
            if you suspect unauthorized access to your account
          </li>
          <li>
            Not share your login credentials with anyone other than a co-parent
            or co-guardian who is also a registered account holder
          </li>
        </ul>
        <p>
          Sage Field is not liable for any loss resulting from unauthorized
          account access that occurs because you failed to keep your credentials
          secure.
        </p>
      </div>
    ),
  },
  {
    id: "portal-use",
    title: "5. Parent Portal and Mobile App Use",
    content: (
      <div className="space-y-4">
        <p>
          The parent portal and mobile application are provided to support your
          child&apos;s enrollment and your communication with Sage Field staff.
          Acceptable uses include:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Viewing your child&apos;s attendance, progress updates, and teacher
            notes
          </li>
          <li>Messaging school staff about your child&apos;s care and education</li>
          <li>Submitting and updating enrollment and health forms</li>
          <li>Reviewing and paying tuition invoices</li>
          <li>Viewing teacher posts, photos, and updates in the parent feed</li>
        </ul>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Attempt to access accounts or records of other families</li>
          <li>
            Screenshot, download, or distribute photos or information about
            other students without explicit permission from those families
          </li>
          <li>
            Use the messaging feature for harassment, threats, or communications
            unrelated to your child&apos;s enrollment
          </li>
          <li>
            Attempt to reverse-engineer, scrape, or otherwise interfere with the
            technical operation of the Services
          </li>
          <li>Upload content that is illegal, defamatory, obscene, or harmful</li>
        </ul>
      </div>
    ),
  },
  {
    id: "photo-feed",
    title: "6. Photo and Media in the Parent Feed",
    content: (
      <div className="space-y-3">
        <p>
          Teacher posts in the parent feed may include photos and videos of
          students. By accessing the parent portal and app, you agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            View and enjoy content shared by Sage Field staff for school
            community purposes only
          </li>
          <li>
            Not share, screenshot, post publicly, or distribute photos of other
            students without the explicit permission of those students&apos;
            families
          </li>
          <li>
            Respect the photo consent preferences of all families in our
            community
          </li>
        </ul>
        <p>
          We take photo privacy seriously. If you see a photo you believe was
          shared in violation of a family&apos;s stated consent preferences,
          please contact{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>{" "}
          immediately.
        </p>
      </div>
    ),
  },
  {
    id: "enrollment-agreement",
    title: "7. Enrollment Agreement",
    content: (
      <p>
        Enrollment at Sage Field is governed by a separate Enrollment Agreement
        that you will sign as part of the enrollment process. The Enrollment
        Agreement includes specific terms related to tuition commitments,
        attendance expectations, behavioral policies, and withdrawal procedures.
        In the event of any conflict between these Terms of Use and the
        Enrollment Agreement, the Enrollment Agreement will control for
        enrollment-related matters.
      </p>
    ),
  },
  {
    id: "payment-terms",
    title: "8. Payment Terms",
    content: (
      <div className="space-y-4">
        <div>
          <strong className="text-gray-800">Tuition Payments:</strong> Tuition
          and fees are processed through Stripe. By providing payment
          information, you authorize Sage Field (through Stripe) to charge the
          payment method on file according to your enrollment plan. All fees are
          stated in USD.
        </div>
        <div>
          <strong className="text-gray-800">Non-Refundable Fees:</strong>{" "}
          Registration and materials fees are non-refundable once paid, as
          stated in your Enrollment Agreement.
        </div>
        <div>
          <strong className="text-gray-800">Tuition Commitment:</strong>{" "}
          Full-enrollment families commit to a minimum term as stated in the
          Enrollment Agreement. Withdrawal mid-term does not automatically
          release you from outstanding tuition obligations except as specifically
          provided in your Enrollment Agreement.
        </div>
        <div>
          <strong className="text-gray-800">Failed Payments:</strong> If a
          payment fails, Sage Field will notify you promptly. Accounts with
          outstanding balances may result in suspension of portal access and, if
          unresolved, may affect enrollment status.
        </div>
        <div>
          <strong className="text-gray-800">Payment Disputes:</strong> For
          payment questions or billing disputes, contact{" "}
          <a
            href="mailto:sabrina@sagefield.co"
            className="text-primary hover:underline"
          >
            sabrina@sagefield.co
          </a>{" "}
          before initiating a chargeback. We are happy to work with you to
          resolve billing issues directly.
        </div>
      </div>
    ),
  },
  {
    id: "intellectual-property",
    title: "9. Intellectual Property",
    content: (
      <p>
        All content on the Sage Field website and in the Services — including
        text, photographs, logos, graphics, curriculum materials, and app
        features — is owned by Sage Field Private School or licensed to us, and
        is protected by applicable copyright and intellectual property laws. You
        may not reproduce, distribute, publish, display, or create derivative
        works from any Sage Field content without our prior written permission,
        except for personal, non-commercial use directly related to your
        child&apos;s enrollment.
      </p>
    ),
  },
  {
    id: "user-content",
    title: "10. User-Submitted Content",
    content: (
      <div className="space-y-3">
        <p>
          When you submit messages, photos, comments, or other content through
          the parent portal or app (&ldquo;User Content&rdquo;), you grant Sage
          Field a limited, non-exclusive license to use, store, and display that
          content as necessary to operate and improve the Services — for
          example, delivering your message to the intended recipient and
          retaining records of communications.
        </p>
        <p>
          You are responsible for the content you submit. You represent that you
          have the right to share any content you upload and that it does not
          violate the rights of any other person.
        </p>
      </div>
    ),
  },
  {
    id: "disclaimers",
    title: "11. Disclaimers",
    content: (
      <div className="space-y-3">
        <p className="uppercase text-sm font-semibold text-gray-500 tracking-wide">
          The Services are provided &ldquo;as is&rdquo; and &ldquo;as
          available.&rdquo; Sage Field makes no warranties, express or implied,
          regarding the availability, accuracy, reliability, or suitability of
          the Services for any particular purpose.
        </p>
        <p>
          In plain language: we do our best to keep the site and app running
          reliably, but we cannot guarantee they will always be available without
          interruption, particularly during maintenance or circumstances outside
          our control.
        </p>
        <p>
          Sage Field is not a licensed medical provider or therapist. Health
          information collected through enrollment forms is used by trained staff
          to support your child&apos;s safety — not to provide medical diagnosis
          or treatment.
        </p>
      </div>
    ),
  },
  {
    id: "liability",
    title: "12. Limitation of Liability",
    content: (
      <div className="space-y-3">
        <p>
          To the fullest extent permitted by Texas law, Sage Field Private
          School, its staff, and its operators shall not be liable for indirect,
          incidental, consequential, or punitive damages arising from your use
          of the Services, including but not limited to loss of data,
          {/* ATTORNEY REVIEW: Review enforceability of liability limitations under TX law for services involving minor children */}
          unauthorized access, or service interruptions.
        </p>
        <p>
          Our total liability for any claim arising from use of the Services
          shall not exceed the amount you paid to Sage Field in the 30 days
          preceding the event giving rise to the claim.
        </p>
      </div>
    ),
  },
  {
    id: "indemnification",
    title: "13. Indemnification",
    content: (
      <p>
        You agree to indemnify, defend, and hold harmless Sage Field Private
        School and its staff from any claims, damages, losses, or expenses
        (including reasonable attorneys&apos; fees) arising from your violation
        of these Terms, your use of the Services, or your submission of false or
        unauthorized information.
      </p>
    ),
  },
  {
    id: "termination",
    title: "14. Termination",
    content: (
      <p>
        Sage Field may suspend or terminate your access to the Services at any
        time for violations of these Terms, non-payment of tuition, or any
        conduct that jeopardizes the safety or well-being of our community. You
        may stop using the Services at any time. Termination of Services does
        not relieve you of any tuition obligations under your Enrollment
        Agreement.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "15. Governing Law and Dispute Resolution",
    content: (
      <p>
        These Terms are governed by the laws of the State of Texas, without
        regard to conflict-of-law principles. Any disputes arising from these
        Terms or your use of the Services shall be resolved first through
        good-faith discussion with Sage Field. If informal resolution fails,
        disputes shall be subject to the exclusive jurisdiction of the state and
        {/* ATTORNEY REVIEW: Confirm Williamson County is the correct venue for this entity */}
        federal courts located in Williamson County, Texas.
      </p>
    ),
  },
  {
    id: "mobile-app",
    title: "16. Mobile Application",
    content: (
      <p>
        The Sage Field mobile app is provided as a companion to the parent web
        portal. The app is available for download through applicable app stores,
        subject to those platforms&apos; own terms. Sage Field is not
        responsible for the availability of the app through third-party
        distribution platforms. App updates may be required from time to time to
        maintain access to all features.
      </p>
    ),
  },
  {
    id: "changes",
    title: "17. Changes to These Terms",
    content: (
      <p>
        We may update these Terms from time to time to reflect changes in our
        Services, legal requirements, or business practices. We will update the
        &ldquo;Last Updated&rdquo; date and, for material changes, notify
        enrolled families by email. Continued use of the Services after updated
        Terms become effective constitutes acceptance.
      </p>
    ),
  },
  {
    id: "contact",
    title: "18. Contact Us",
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
          <a href="tel:+15126775872" className="text-primary hover:underline">
            (512) 677-5872
          </a>
        </p>
      </div>
    ),
  },
];

export default function TermsPage() {
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
              Terms of Use
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6 font-heading text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" as const }}
          >
            Terms of Use
          </motion.h1>

          <motion.p
            className="text-lg text-gray-600 font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" as const }}
          >
            These terms govern your use of the Sage Field website, parent
            portal, and mobile app.
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
