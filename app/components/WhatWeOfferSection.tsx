import WeeklySchedule from "./WeeklySchedule";

export default function WhatWeOfferSection() {
  return (
    <section className="bg-welcome-bg min-h-[80vh] py-16 px-8 sm:px-12 lg:px-16 flex flex-col">
      <div className="max-w-7xl w-full">
        {/* What We Offer Badge */}
        <div className="flex justify-start mb-8">
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full">
            What We Offer
          </span>
        </div>
      </div>

      {/* Centered Content Container */}
      <div className="flex items-center w-full">
        {/* Two Column Layout - Reversed from WelcomeSection */}
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-16 w-full">
          {/* Left Column: Weekly Schedule */}
          <div className="w-full lg:w-1/2">
            <WeeklySchedule />
          </div>

          {/* Right Column: Text Content */}
          <div className="w-full lg:w-1/2 text-left">
            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-bold text-black font-heading mb-6">
              What We Offer
            </h2>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl font-semibold text-primary font-heading mb-8">
              Enrichment Through Connection and Exploration
            </p>

            {/* Description Paragraphs */}
            <p className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body">
              Sage Field operates as a tutoring and enrichment program, not a
              traditional school. We focus on{" "}
              <span className="text-primary font-semibold">
                whole-child growth
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                emotional regulation
              </span>
              ,{" "}
              <span className="text-primary font-semibold">
                social development
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                hands-on experiences
              </span>{" "}
              that promote creativity and curiosity.
            </p>

            <p className="text-base md:text-lg text-text-gray mb-6 leading-relaxed font-body">
              Our days are designed around{" "}
              <span className="text-primary font-semibold">movement</span>,{" "}
              <span className="text-primary font-semibold">
                outdoor exploration
              </span>
              , and{" "}
              <span className="text-primary font-semibold">
                project-based learning
              </span>
              , with minimal worksheets and a focus on real-world engagement.
              This structure supports emotional stability and helps children
              feel confident and connected each day.
            </p>

            {/* Trial Session Note */}
            <div className="mt-8 p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
              <p className="text-base md:text-lg text-text-gray font-body">
                A trial session will run during{" "}
                <span className="text-primary font-semibold">Summer 2026</span>,
                depending on student interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
