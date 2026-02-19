export default function EducationalPhilosophySection() {
  const pillars = [
    {
      icon: "🌱",
      title: "Hands-on Learning",
      description: "Experiential activities that engage curiosity",
    },
    {
      icon: "🧘",
      title: "Emotional Regulation",
      description: "Mindfulness practices for students & educators",
    },
    {
      icon: "🎨",
      title: "Creative Expression",
      description: "Artistic and musical creativity flourish",
    },
    {
      icon: "🌳",
      title: "Movement & Nature",
      description: "Movement-based and outdoor education",
    },
  ];

  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex flex-col">
      <div className="max-w-7xl w-full">
        {/* How We Learn Badge */}
        <div className="flex justify-start mb-8">
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            How We Learn
          </span>
        </div>
      </div>

      {/* Centered Content Container */}
      <div className="flex items-center w-full">
        {/* Two Column Layout - Text on Left, Cards on Right */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-black font-heading mb-6">
              How We Learn
            </h2>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8">
              Educational Philosophy
            </p>

            {/* Description Paragraphs */}
            <p className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body">
              Our approach integrates elements of{" "}
              <span className="text-primary font-semibold">Montessori</span>,{" "}
              <span className="text-primary font-semibold">Waldorf</span>, and{" "}
              <span className="text-primary font-semibold">
                Reggio Emilia
              </span>{" "}
              methods with{" "}
              <span className="text-primary font-semibold">
                TEKS-aligned academics
              </span>
              . We enrich learning with social-emotional education, arts, music,
              and creative problem-solving.
            </p>

            <p className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body">
              We value{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              , both for students and educators. A calm, connected teacher
              creates a community where children thrive.
            </p>

            {/* Key Pillars Callout */}
            <div className="mt-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
              <h3 className="text-lg font-semibold text-black mb-3 font-heading">
                Our Key Pillars
              </h3>
              <ul className="space-y-2 text-base md:text-lg text-text-gray font-body">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Hands-on, experiential learning</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Emotional regulation & mindfulness practices</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Artistic and musical creativity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Movement-based and outdoor education</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Interactive Pillar Cards */}
          <div className="w-full lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pillars.map((pillar, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group"
                >
                  {/* Icon Container */}
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-200">
                    <span className="text-3xl">{pillar.icon}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-black mb-2 font-heading">
                    {pillar.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-text-gray font-body">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
