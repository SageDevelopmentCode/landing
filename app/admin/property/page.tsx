import Image from "next/image";
import { Merriweather } from "next/font/google";
import { cssColors as colors, cssShadows as shadows, radius } from "../design-system";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
});

const sections = [
  {
    id: "front-entrance",
    title: "Front Entrance",
    subtitle: "Area 1 — Front Yard & Building Facade",
    before: "/assets/Before2.jpg",
    after: "/assets/After2.png",
    description:
      "The front entrance is the first impression families, students, and visitors have of Sage Field. Currently the front yard is bare gravel with minimal plant life and no welcoming features.",
    goals: [
      "Install raised cedar planter beds along the building facade with native flowering plants and seasonal color",
      "Add a hand-crafted 'Welcome to Sage Field' entry sign with stone or gravel pathway leading to the front door",
      "Place child-sized wooden benches and tables in the front garden for outdoor reading and morning arrival",
      "Plant low-maintenance native shrubs and perennials that can withstand Central Texas summers",
      "Add mulch ground cover and border edging to define planting areas and reduce maintenance",
    ],
    tone: "Warm, inviting, and nature-forward — like stepping into a school garden, not a parking lot.",
  },
  {
    id: "backyard-play",
    title: "Backyard Play & Learning Area",
    subtitle: "Area 2 — Main Backyard",
    before: "/assets/Before3.jpg",
    after: "/assets/After3.png",
    description:
      "The backyard is a large open grassy area with mature trees. It has great bones but currently lacks structure, shade, and purposeful outdoor learning zones. This is the primary outdoor space where children will spend time daily.",
    goals: [
      "Build a natural playground with a sand pit, log balance beam, and wooden climbing structure",
      "Install 3–4 raised garden beds (approximately 4×8 ft each) for a student gardening curriculum",
      "Construct a simple pergola or shade sail structure for covered outdoor seating and group activities",
      "Create a gravel or decomposed granite gathering circle for storytelling and morning circle time",
      "Add picnic-style outdoor dining tables under existing tree canopy",
      "Preserve the open grass area for free play while defining edges with native plantings",
    ],
    tone: "A nature-based outdoor classroom — structured enough to teach, open enough to explore.",
  },
  {
    id: "side-yard",
    title: "Side Yard & Outbuilding Area",
    subtitle: "Area 3 — East Side Yard",
    before: "/assets/Before7.PNG",
    after: "/assets/After7.PNG",
    description:
      "The side yard connects the front and back of the property and currently has an outbuilding, bare trees, and an unfinished feel. This area has potential to become an intentional transition zone and additional outdoor learning space.",
    goals: [
      "Clear debris and clean up the area around the outbuilding",
      "Add raised garden beds along the fence line for additional student planting",
      "Improve soil and drainage to prevent muddy conditions after rain",
      "Plant shade trees or large shrubs to create a green corridor between front and back yards",
      "Consider a simple seating area or quiet reading nook tucked beside the outbuilding",
    ],
    tone: "A purposeful transition space — green, tidy, and connected to the rest of the campus.",
  },
];

export default function PropertyPage() {
  return (
    <div className="space-y-10 pt-6 pb-16 max-w-5xl">
      {/* Header */}
      <div>
        <h1
          className={`text-2xl font-bold ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Property Vision
        </h1>
        <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          Landscaping scope of work for prospective contractors — Sage Field School, Austin TX
        </p>
      </div>

      {/* Overview Card */}
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: colors.softCloud,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.soft,
        }}
      >
        <h2
          className={`text-base font-bold mb-3 ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          About Sage Field School
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textPrimary }}>
          Sage Field is a nature-based private school for children ages 3–12 located in Austin, Texas.
          Our pedagogy is rooted in outdoor learning, gardening, and connecting children to the natural world.
          The physical property is an extension of our classroom — it should feel alive, welcoming, and purposeful.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          We are seeking a landscaper or landscape designer who shares our vision for sustainable, child-friendly
          outdoor spaces. The work spans three main areas of the property: the front entrance, the main backyard,
          and the side yard. This document outlines the current state of each area and our vision for transformation.
        </p>
        <div
          className="mt-4 pt-4 flex flex-wrap gap-3"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          {["Native Plants", "Child-Safe Materials", "Low Maintenance", "Nature-Based Learning", "Outdoor Classroom"].map(
            (tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: colors.pastelSage,
                  color: colors.mistyForest,
                }}
              >
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={section.id} className="space-y-5">
          {/* Section Header */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
              style={{ backgroundColor: colors.pastelSage, color: colors.mistyForest }}
            >
              {i + 1}
            </span>
            <div>
              <h2
                className={`text-lg font-bold ${merriweather.className}`}
                style={{ color: colors.textPrimary }}
              >
                {section.title}
              </h2>
              <p className="text-xs" style={{ color: colors.textTertiary }}>
                {section.subtitle}
              </p>
            </div>
          </div>

          {/* Before / After Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
            >
              <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
                <Image
                  src={section.before}
                  alt={`${section.title} — current state`}
                  fill
                  className="object-cover"
                />
                <span
                  className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.55)",
                    color: "white",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Current State
                </span>
              </div>
            </div>

            {/* After / Vision */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${colors.border}`, boxShadow: shadows.soft }}
            >
              <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
                <Image
                  src={section.after}
                  alt={`${section.title} — vision`}
                  fill
                  className="object-cover"
                />
                <span
                  className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: colors.mistyForest,
                    color: "white",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Vision
                </span>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div
            className="p-5 rounded-2xl"
            style={{
              backgroundColor: colors.softCloud,
              border: `1px solid ${colors.border}`,
              boxShadow: shadows.soft,
            }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: colors.textPrimary }}>
              {section.description}
            </p>

            <h3
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: colors.textTertiary }}
            >
              Goals for this area
            </h3>
            <ul className="space-y-2">
              {section.goals.map((goal, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: colors.textPrimary }}>
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.mistyForest }}
                  />
                  {goal}
                </li>
              ))}
            </ul>

            <div
              className="mt-4 pt-3"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              <p className="text-xs italic" style={{ color: colors.textTertiary }}>
                Desired tone: {section.tone}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Contact CTA */}
      <div
        className="p-6 rounded-2xl"
        style={{
          backgroundColor: colors.pastelSage,
          border: `1px solid ${colors.mistyForest}22`,
          boxShadow: shadows.medium,
        }}
      >
        <h2
          className={`text-base font-bold mb-2 ${merriweather.className}`}
          style={{ color: colors.mistyForest }}
        >
          Interested in this project?
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: colors.mistyForest }}>
          We would love to hear from landscapers who have experience with native Texas plantings,
          child-safe materials, and outdoor learning environments. Please reach out with your portfolio,
          availability, and a rough estimate for any or all three areas.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium" style={{ color: colors.mistyForest }}>
          <span>sagefieldschool@gmail.com</span>
          <span style={{ color: `${colors.mistyForest}66` }}>·</span>
          <span>Austin, TX</span>
        </div>
      </div>
    </div>
  );
}
