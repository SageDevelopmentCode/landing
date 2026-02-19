import Card from "./Card";

export default function WelcomeSection() {
  const cards = [
    {
      title: "Co-Creation",
      description:
        "Working alongside families to nurture curiosity and confidence through personalized learning experiences.",
      icon: "🤝",
    },
    {
      title: "Nature-Based Learning",
      description:
        "Hands-on outdoor experiences that connect children to the natural world and foster real-world wisdom.",
      icon: "🌿",
    },
    {
      title: "Small Groups",
      description:
        "Personalized attention for children ages 6-10 in intimate learning environments designed for growth.",
      icon: "👥",
    },
    {
      title: "Wisdom Focus",
      description:
        "Beyond memorization - transforming knowledge into living wisdom through curiosity, reflection, and experience.",
      icon: "💡",
    },
  ];

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex flex-col">
      <div className="max-w-7xl w-full">
        {/* Welcome Badge */}
        <div className="flex justify-start mb-8">
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            Welcome
          </span>
        </div>
      </div>

      {/* Centered Content Container */}
      <div className="flex items-center w-full">
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-center gap-16 w-full">
          {/* Left Column: Text Content */}
          <div className="text-left max-w-7xl">
              {/* Title */}
              <h2 className="text-4xl md:text-5xl font-bold text-black font-heading mb-6">
                Welcome to Sage Field!
              </h2>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8">
                Wisdom &gt; Knowledge
              </p>

              {/* Introduction Paragraph */}
              <p className="text-base md:text-lg text-text-gray mb-8 leading-relaxed font-body">
                Sage Field is a small-group learning community for children ages
                6–10, designed especially for homeschool families seeking a{" "}
                <span className="text-primary font-semibold">nature-based</span>{" "}
                enrichment experience. Rooted in the idea of{" "}
                <span className="text-primary font-semibold">co-creation</span>,
                we work alongside families to nurture{" "}
                <span className="text-primary font-semibold">curiosity</span>,{" "}
                <span className="text-primary font-semibold">confidence</span>,
                and <span className="text-primary font-semibold">wisdom</span>{" "}
                through{" "}
                <span className="text-primary font-semibold">personalized</span>
                , <span className="text-primary font-semibold">hands-on</span>{" "}
                learning.
              </p>

              {/* Wisdom vs. Knowledge Section */}
              <div className="mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-black font-heading mb-6">
                  Wisdom vs. Knowledge
                </h3>
                <p className="text-base md:text-lg text-text-gray leading-relaxed font-body">
                  At Sage Field, we see children as seeds of endless
                  possibility. We believe{" "}
                  <span className="text-primary font-semibold">wisdom</span> is
                  what transforms learning into living, helping children connect
                  ideas to real experiences and make thoughtful choices. Through
                  our approach of{" "}
                  <span className="text-primary font-semibold">
                    co-creation
                  </span>
                  , families and mentors work together to nurture{" "}
                  <span className="text-primary font-semibold">curiosity</span>{" "}
                  and reflection both in and beyond the lesson.
                </p>
              </div>

              {/* Call to Action Button */}
              <button className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md hover:shadow-lg font-body">
                Learn More About Our Program
              </button>
            </div>

            {/* Right Column: 2x2 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cards.map((card, index) => (
                <Card
                  key={index}
                  title={card.title}
                  description={card.description}
                  iconPlaceholder={card.icon}
                />
              ))}
            </div>
          </div>
      </div>
    </section>
  );
}
