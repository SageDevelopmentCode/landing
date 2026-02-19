import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import WhatWeOfferSection from './components/WhatWeOfferSection';
import EducationalPhilosophySection from './components/EducationalPhilosophySection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <WelcomeSection />
      <WhatWeOfferSection />
      <EducationalPhilosophySection />
    </div>
  );
}
