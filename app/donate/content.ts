/**
 * Copy and data for the Donate page, carried over verbatim from the previous
 * app/donate/page.tsx. Icons are now emoji (they were lucide icons).
 */

export const DONATE_HERO = {
  badge: "SUPPORT US",
  before: "Help Us Build Our",
  highlight: "Dream Property",
  body: "Sage Field Private School is a community-built dream. We're raising funds to secure and transform our property in Central Texas into a thriving outdoor learning environment for children. Every contribution, big or small, brings us one step closer to opening our doors.",
  cta: "Donate Now",
  photos: ["/assets/Interior.png", "/assets/After1.png", "/assets/After3.png"],
};

export const GALLERY = {
  badge: "OUR PROPERTY",
  heading: "A Glimpse of What's Coming",
  body: "We envision a property with outdoor classrooms, lush gardens, and warm interior spaces that inspire wonder and hands-on learning every single day.",
  images: [
    { src: "/assets/After1.png", alt: "Sage Field exterior rendering 1" },
    { src: "/assets/After2.png", alt: "Sage Field exterior rendering 2" },
    { src: "/assets/After3.png", alt: "Sage Field exterior rendering 3" },
    { src: "/assets/Interior.png", alt: "Sage Field interior learning space" },
    { src: "/assets/After4.png", alt: "Sage Field rendering 4" },
    { src: "/assets/After5.PNG", alt: "Sage Field rendering 5" },
    { src: "/assets/After6.PNG", alt: "Sage Field rendering 6" },
    { src: "/assets/After7.PNG", alt: "Sage Field rendering 7" },
  ],
};

export const VISION = {
  badge: "OUR VISION",
  heading: "Developing Our Farm Property",
  paragraphs: [
    "At Sage Field, we believe that children learn best when they are connected to the living world. Our farm property will become an extension of the classroom — a place where kids can dig, plant, care for animals, and discover the rhythms of nature through direct, unhurried experience.",
    "From raised garden beds to a chicken coop and an aquatic pond, every element of our farm is designed to spark curiosity, build responsibility, and cultivate a deep love for the natural world. Your donation helps us transform this vision from a dream into a thriving, daily reality for the children of Sage Field.",
  ],
};

export const AREAS = {
  badge: "WHAT WE'RE BUILDING",
  heading: "Six Areas of the Farm",
};

export const propertyAreas = [
  {
    icon: "🌱",
    title: "Raised Garden Beds",
    description:
      "Children will plant, tend, and harvest their own vegetables and herbs — learning nutrition and life cycles hands-on.",
    amount: "$2,000",
    color: "#BAFFC9",
  },
  {
    icon: "🐔",
    title: "Chicken Coop",
    description:
      "A small flock of chickens gives children daily responsibility, empathy, and a connection to where food comes from.",
    amount: "$2,000",
    color: "#FFFFBA",
  },
  {
    icon: "🐸",
    title: "Pond & Aquatic Area",
    description:
      "A small pond with native plants and aquatic life creates a living science lab right in our backyard.",
    amount: "$1,500",
    color: "#BAE1FF",
  },
  {
    icon: "🪵",
    title: "Farm Infrastructure",
    description:
      "Fencing, pathways, and safety structures to make the entire farm property safe and fully accessible.",
    amount: "$1,500",
    color: "#E0BBE4",
  },
  {
    icon: "🥣",
    title: "Mud Kitchen",
    description:
      "An outdoor mud kitchen sparks imaginative play and sensory exploration — a Montessori staple in nature education.",
    amount: "$700",
    color: "#FFB3BA",
  },
  {
    icon: "🔨",
    title: "Misc. Improvements",
    description:
      "Shade structures, tool storage, signage, and finishing touches to make the space fully functional and beautiful.",
    amount: "$2,300",
    color: "#f29a8f",
  },
];

export const GOAL = {
  badge: "FUNDRAISING GOAL",
  heading: "How Your Donations Are Used",
  goalLabel: "GOAL",
  totalGoal: "Total Goal",
  amountRaised: "Amount Raised",
  note: "Every contribution brings us closer — be the first to give!",
};

export const PIE_SEGMENTS = [
  { label: "Garden Beds", amount: 2000, color: "#BAFFC9" },
  { label: "Chicken Coop", amount: 2000, color: "#FFFFBA" },
  { label: "Pond & Aquatic", amount: 1500, color: "#BAE1FF" },
  { label: "Farm Infrastructure", amount: 1500, color: "#E0BBE4" },
  { label: "Mud Kitchen", amount: 700, color: "#FFB3BA" },
  { label: "Misc. Improvements", amount: 2300, color: "#f29a8f" },
];
export const TOTAL = 10000;
export const amountRaised = 0;

export const COMMUNITY = {
  badge: "OUR COMMUNITY",
  heading: "Families & Friends Who Believe In Us",
  cardTitle: "Be the First to Give",
  cardBody:
    "Your name — or your business — could be right here. Every donor who helps bring Sage Field to life will be celebrated in this space. Make your contribution and join our founding community.",
  cta: "Donate Now",
};

export const IMPACT = {
  badge: "YOUR IMPACT",
  heading: "Why Your Support Matters",
  cta: "Donate Now",
};

export const impactCards = [
  {
    icon: "💛",
    title: "Create a Safe Space",
    description:
      "Your generosity helps us build a warm, nurturing environment where every child feels safe to learn, grow, and thrive at their own pace.",
  },
  {
    icon: "🌳",
    title: "Outdoor Learning",
    description:
      "Help us create outdoor-based spaces — gardens, trails, and outdoor classrooms — that spark curiosity and connect children to the world around them.",
  },
  {
    icon: "🤝",
    title: "Community Growth",
    description:
      "With your support, we can expand our capacity to serve more families and build a thriving private microschool community in Central Texas.",
  },
];

export const PRESET_AMOUNTS = [25, 50, 100, 250];

/** Donation modal copy. */
export const MODAL = {
  title: "Make a Donation",
  close: "Close",
  selectAmount: "Select Amount",
  customAmount: "Custom amount",
  email: "Email",
  emailPlaceholder: "your@email.com",
  name: "Name",
  namePlaceholder: "Your name",
  message: "Message",
  messagePlaceholder: "Leave a note of encouragement...",
  optional: "(optional)",
  coverFees: (fee: string) =>
    `Cover transaction fees (${fee}) so 100% of your donation goes to Sage Field`,
  total: "Total:",
  donate: "Donate Now",
  redirecting: "Redirecting to Stripe...",
  secure: "Secure payment powered by Stripe",
  errors: {
    minimum: "Minimum donation is $1.00",
    email: "Email is required",
    generic: "Something went wrong. Please try again.",
    network: "Network error. Please try again.",
  },
};
