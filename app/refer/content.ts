/**
 * Copy for the Refer page, carried over verbatim from the previous
 * app/refer/page.tsx.
 */
import type { FaqItem } from "@/app/_garden/types";

export const GALLERY_IMAGES = [
  "/assets/Stock1.jpg",
  "/assets/Stock2.jpg",
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
export const PHOTO_ALT = "Students at Sage Field";
export const HERO_PHOTOS = ["/assets/Stock5.jpg", "/assets/Stock3.jpg", "/assets/Stock7.jpg"];

export const GIFT_CARDS = [
  { label: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/Amazon_icon.png" },
  { label: "Target", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Target_logo.svg/1920px-Target_logo.svg.png" },
  { label: "Visa", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg/3840px-Visa_Inc._logo_%282021%E2%80%93present%29.svg.png" },
  { label: "Home Depot", logo: "https://corporate.homedepot.com/sites/default/files/image_gallery/THD_logo.jpg" },
  { label: "Starbucks", logo: "https://upload.wikimedia.org/wikipedia/sco/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/3840px-Starbucks_Corporation_Logo_2011.svg.png" },
  { label: "Best Buy", logo: "https://logodownload.org/wp-content/uploads/2020/05/best-buy-logo.png" },
  { label: "Sephora", logo: "https://logodownload.org/wp-content/uploads/2021/06/sephora-logo-0.png" },
  { label: "Nike", logo: "https://cdn.freebiesupply.com/logos/large/2x/nike-4-logo-png-transparent.png" },
];

export const HERO = {
  /** "Know a Family Who'd Thrive Here?" */
  before: "Know a Family Who'd",
  highlight: "Thrive Here?",
  /** Lead paragraph; the middle run is emphasised. */
  body: [
    { text: "Refer a family to Sage Field. When they enroll and pay their enrollment fee — we send " },
    { text: "both of you a $250 gift card", highlight: true },
    { text: " of your choice." },
  ],
  cta: "Refer a Family →",
  learn: "Learn About Us",
  learnHref: "/about",
  callout: [
    { text: "Both families receive " },
    { text: "a $250 gift card", highlight: true },
    { text: " once the referred family pays their enrollment fee." },
  ],
};

export const HOW = {
  badge: "How It Works",
  heading: "Three Steps. Two Gift Cards.",
  sub: "The whole process takes about two minutes on your end. We handle everything else.",
  steps: [
    {
      emoji: "📨",
      step: "Step 1",
      title: "Share",
      desc: "Fill out the form below with your info and the family you'd like to refer. Takes under 2 minutes.",
    },
    {
      emoji: "🌱",
      step: "Step 2",
      title: "We Reach Out",
      desc: "Sabrina personally contacts the referred family, answers questions, and walks them through enrollment.",
    },
    {
      emoji: "🎁",
      step: "Step 3",
      title: "You Both Win",
      desc: "Once they pay their enrollment fee, we send both families a $250 gift card of their choice.",
    },
  ],
};

export const WHY = {
  badge: "Why Sage Field",
  heading: "What You're Referring Them To",
  sub: "When you refer a family, you're giving them something genuinely different.",
  cta: "Read our full story →",
  ctaHref: "/about",
  pillars: [
    {
      icon: "👥",
      title: "Tiny classes — every child is truly known",
      description:
        "We cap every class at 10–12 students. With mixed ages and real relationships with every teacher, no child gets lost in the crowd.",
    },
    {
      icon: "🍃",
      title: "Outdoor, hands-on learning every day",
      description:
        "Montessori, Waldorf, and Reggio-inspired methods meet TEKS-aligned academics. Mornings are structured learning; afternoons are nature, cooking, and art.",
    },
    {
      icon: "🛡️",
      title: "Licensed educators who treat kids like family",
      description:
        "Our team is experienced, credentialed, and deeply invested in each child's growth. Not a daycare — a real academic program.",
    },
    {
      icon: "💛",
      title: "Ages 4–11 in Round Rock, TX",
      description:
        "Serving the greater Austin area. Pre-K through elementary, ability-grouped — not grade-grouped — so every child works at their actual level.",
    },
  ],
};

export const REWARD = {
  badge: "The Reward",
  heading: "$250 Gift Card — For Each of You.",
  body: "When your referred family pays their enrollment fee, we send both of you a $250 gift card. Amazon, Target, Visa prepaid — your choice. No codes, no forms. We just send it.",
  note: "Gift cards are sent within 5–7 business days after the referred family's enrollment fee clears. No referral limit.",
  optionsLabel: "Gift Card Options",
  flow: [
    { num: "1", label: "You Refer", sub: "2 min form" },
    { num: "2", label: "They Enroll", sub: "we handle it" },
    { num: "3", label: "$250 Each", sub: "gift card sent", highlight: true },
  ],
};

export const FORM = {
  badge: "Submit a Referral",
  heading: "Spread the Word. Share the Reward.",
  sub: "Takes 60 seconds. We handle the rest.",
  yourInfo: "Your Info",
  theirInfo: "Who You're Referring",
  anythingElse: "Anything else?",
  fields: {
    yourName: { label: "Your name", placeholder: "Your full name" },
    yourEmail: { label: "Your email", placeholder: "you@email.com" },
    yourPhone: { label: "Your phone", placeholder: "(512) 000-0000" },
    theirName: { label: "Their name", placeholder: "Parent or guardian's full name" },
    theirEmail: { label: "Their email", placeholder: "their@email.com" },
    theirPhone: { label: "Their phone", placeholder: "(512) 000-0000" },
    childAge: { label: "Child's age", placeholder: "Select age (optional)" },
    message: { placeholder: "Why do you think they'd be a great fit? (optional)" },
  },
  ages: [4, 5, 6, 7, 8, 9, 10, 11],
  ageSuffix: "years old",
  consent: "By submitting, you confirm you have the referred family's permission to share their contact info with Sage Field.",
  submit: "Submit Referral →",
  submitting: "Submitting…",
  success: {
    heading: "Referral submitted!",
    body: "We'll reach out to the family you referred soon. Keep an eye out for your $250 gift card once they enroll.",
    thanks: "Thank you for sharing Sage Field. 🌿",
  },
};

export const FAQ_HEADER = {
  badge: "Common Questions",
  heading: "Before You Refer",
  sub: "Everything families ask about the referral program.",
};

export const FAQS: FaqItem[] = [
  {
    question: "Who can I refer?",
    answer:
      "Any family you know who has a child between ages 4–11 and would thrive in a small, hands-on learning environment. They don't need to live in Round Rock — families commute from all over the Austin area.",
  },
  {
    question: "When do I get my gift card?",
    answer:
      "Both you and the referred family will receive your $250 gift card within 5–7 business days after their enrollment fee is successfully processed.",
  },
  {
    question: "What gift card options are available?",
    answer:
      "You can choose from Amazon, Target, Visa prepaid, Walmart, and more. We'll reach out to confirm your preference once the referral is complete.",
  },
  {
    question: "Is there a limit to how many families I can refer?",
    answer:
      "No limit. Each successful referral earns both parties a $250 gift card. The more families you share Sage Field with, the more rewards for everyone.",
  },
  {
    question: "What if the family was already interested in Sage Field?",
    answer:
      "The referral reward applies when we receive your submission before the family begins the enrollment process. If they haven't officially applied yet, your referral counts.",
  },
  {
    question: "How will I know if my referral enrolled?",
    answer:
      "We'll email you once your referred family completes enrollment and payment. Gift card instructions arrive at the same time.",
  },
];

export const BOTTOM_CTA = {
  badge: "Referral Program",
  heading: "Ready to share something special?",
  body: "Your referral could change a child's educational journey — and put $250 in both your pockets. No limit on referrals.",
  cta: "Refer a Family →",
  note: "$250 gift card for each family · sent within 5–7 days of enrollment payment",
};

export const STICKY = {
  title: "Referral Program · $250 Each",
  sub: "Refer a family, both get rewarded",
  cta: "Refer Now →",
};
