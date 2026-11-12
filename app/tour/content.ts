/**
 * Copy and data for the Tour page, carried over verbatim from the previous
 * app/tour/page.tsx. SCHOOL_FAQS is shared with /visit (identical copy).
 */
import { BookOpen, Leaf, MapPin, MessageCircle, Users } from "lucide-react";
import type { FaqItem } from "@/app/_garden/types";

export { SCHOOL_FAQS, SCHOOL_FAQ_HEADER } from "@/app/visit/content";

export const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

export const GRADE_OPTIONS = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
];

export const REFERRAL_OPTIONS = ["Google", "Social Media", "Friend / Family", "Flyer / Poster", "Other"];

export const NUM_CHILDREN_OPTIONS = ["1", "2", "3", "4", "5+"];

export const TOUR_IMAGES = [
  "/assets/Stock1.jpg",
  "/assets/Kid1.png",
  "/assets/Kid2.jpg",
  // "/assets/Stock2.jpg",
  "/assets/Stock3.jpg",
  "/assets/Stock4.jpg",
  "/assets/Stock5.jpg",
  "/assets/Stock6.jpg",
  "/assets/Stock7.jpg",
  "/assets/Stock8.jpg",
  "/assets/Stock9.jpg",
  "/assets/Stock10.jpg",
  "/assets/Stock11.jpg",
];
export const TOUR_IMAGE_ALT = "Sage Field tour";

export const HERO = {
  /** "See Where Your Child Will Thrive" */
  before: "See Where Your Child Will",
  highlight: "Thrive",
  body: "Join us for a private, 45-minute tour of our outdoor campus. Walk the space, meet Ms. Sabrina, and feel the Sage Field difference for yourself.",
  cta: "Schedule My Tour",
  image: "/assets/Stock3.jpg",
  imageAlt: "Children learning outdoors at Sage Field School",
};

export const WALKTHROUGH = {
  badge: "Your Visit",
  heading: "What Your Tour Looks Like",
  sub: "From arrival to your last question — here's what to expect from your private 45-minute visit.",
  steps: [
    { icon: MapPin, label: "Arrival", description: "Park, meet your host, and take a breath — no rush." },
    { icon: BookOpen, label: "Classroom Tour", description: "See the materials, learning centers, and daily rhythm boards." },
    { icon: Leaf, label: "Outdoor Space", description: "Walk our nature trail, garden, and outdoor learning areas." },
    { icon: Users, label: "Meet the Team", description: "A real conversation with Ms. Sabrina and your child's future teacher." },
    { icon: MessageCircle, label: "Q&A", description: "Ask anything — enrollment, curriculum, schedules, tuition." },
  ],
};

export const TOUR_FAQ_HEADER = {
  heading: "Before Your Visit",
  sub: "Quick answers to the questions families ask most.",
};

export const TOUR_FAQS: FaqItem[] = [
  {
    question: "Can I bring siblings?",
    answer: "Absolutely. Siblings are welcome. Just note it in the 'Questions' field when booking so we can plan accordingly.",
  },
  {
    question: "How long does the tour take?",
    answer: "Plan for approximately 45 minutes, though we often run a bit longer when families have lots of great questions.",
  },
  {
    question: "Is the tour really free?",
    answer: "Yes — completely free, no strings attached. We want you to see Sage Field before making any decision.",
  },
  {
    question: "What if I need to reschedule?",
    answer: "Just reach out via the Contact button or SMS. We're flexible and happy to find another time that works for your family.",
  },
];

export const LOCATION = {
  locationLabel: "Location",
  address: "2760 Gattis School Rd, Round Rock, TX 78664",
  availableLabel: "Available",
  hours: "Mon – Sat · 9:00 AM – 5:00 PM",
  questions: "Questions before booking?",
  contact: "Contact Us",
};

export const SCHEDULE = {
  badge: "Book Your Tour",
  heading: "Reserve Your Family's Spot",
  stepLabels: ["Date & Time", "Your Info", "Confirmation"],
  stepMicrocopy: ["Pick date & time", "Tell us about your family", "Confirm & submit"],
  stepHeadings: {
    1: { title: "Select a Date & Time", sub: "Pick a day or time that works for your family" },
    2: { title: "Your Information", sub: "Tell us a little about your family so we can personalize your tour." },
    3: { title: "Review & Confirm", sub: "Everything looks good? We'll reach out to finalize your tour." },
  },
  pickTime: "Pick a time",
  selectDate: "Select a date",
  pickDateHint: "Pick a date on the calendar to see available times.",
  noTimes: "No times available for this date — please select another day.",
  datePending: "Date pending",
  selectTimeHint: " · Select a time →",
  back: "Back",
  next: "Next",
  review: "Review",
  edit: "Edit Information",
  aboutYou: "About You",
  aboutChild: "About Your Child",
  quickQuestions: "A Few Quick Questions",
  fields: {
    firstName: { label: "First Name", placeholder: "Jane" },
    lastName: { label: "Last Name", placeholder: "Smith" },
    email: { label: "Email Address", placeholder: "jane@example.com" },
    phone: { label: "Phone Number", placeholder: "(555) 000-0000" },
    childName: { label: "Child's Name", placeholder: "Alex" },
    childGrade: { label: "Child's Grade / Age", placeholder: "Select grade…" },
    numChildren: { label: "Number of Children Attending" },
    referralSource: { label: "How did you hear about us?", placeholder: "Select one…" },
    notes: {
      label: "Questions or Special Accommodations",
      placeholder: "Anything you'd like Ms. Sabrina to know before you arrive — questions, concerns, or a little about your child…",
    },
  },
};

export const CONFIRM = {
  heading: "You're almost in!",
  body: "Everything look right? Hit the button below to lock in your private tour with Ms. Sabrina.",
  summaryTitle: "Your Tour at Sage Field",
  date: "Date",
  time: "Time",
  parent: "Parent / Guardian",
  child: "Child",
  notes: "Notes",
  submit: "Schedule My Tour",
  submitting: "Scheduling...",
  footnote: "We'll send a confirmation email and reach out to finalize your visit.",
};

export const SUCCESS = {
  heading: "Your Tour Is Booked!",
  sub: "We can't wait to show you around.",
  dateTime: "Date & Time",
  at: "at",
  location: "Location",
  confirmationBefore: "A confirmation is headed to",
  confirmationAfter: ". We'll follow up to finalize your visit details.",
  addToCalendar: "Add to your calendar once confirmed",
  explore: "While you wait, explore",
  links: [
    { label: "Our Philosophy", href: "/educational-philosophy" },
    { label: "Meet the Team", href: "/team" },
    { label: "School Year 2026–27", href: "/school-year-2026-2027" },
  ],
};

export const STICKY = {
  title: "Come see Sage Field!",
  sub: "Book a free private tour",
  cta: "Schedule Tour →",
};
