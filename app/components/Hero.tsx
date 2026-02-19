export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with scale */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
        style={{ backgroundImage: "url(/assets/Hero.jpg)" }}
      />

      {/* Dark Tint Overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content Container */}
      <div className="relative h-full w-full mx-auto px-8 sm:px-12 lg:px-12 flex items-end pb-12 md:pb-16 lg:pb-16">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Left: Large Slogan */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-4xl lg:text-5xl font-semibold text-white drop-shadow-lg max-w-lg font-heading leading-tight">
              Where Curiosity Becomes Wisdom, Not Just Knowledge
            </h1>
          </div>

          {/* Right: Description and Buttons */}
          <div className="text-center md:text-right space-y-6 max-w-2xl md:ml-auto">
            <p className="text-base md:text-lg text-white font-semibold drop-shadow-md max-w-2xl font-body">
              A small-group learning community for ages 6–10, offering
              nature-based enrichment through co-creation with homeschool
              families. Personalized, hands-on learning that nurtures curiosity,
              confidence, and wisdom.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
              <button className="px-6 py-3 border-2 border-white bg-primary/20 backdrop-blur-md text-white font-semibold rounded-lg hover:bg-primary/30 transition-all duration-200 font-body">
                View Curriculum
              </button>
              <button className="px-6 py-3 border-2 border-white bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-all duration-200 font-body">
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
