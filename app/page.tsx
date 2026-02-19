import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import WhatWeOfferSection from './components/WhatWeOfferSection';
import EducationalPhilosophySection from './components/EducationalPhilosophySection';
import ContinuitySection from './components/ContinuitySection';
import ImageGridShowcase from './components/ImageGridShowcase';
import CoCreationSection from './components/CoCreationSection';
import DonationsSection from './components/DonationsSection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <WelcomeSection />
      <WhatWeOfferSection />
      <ImageGridShowcase
        images={[
          { src: '/assets/ImageOne.jpg', alt: 'School environment' },
          { src: '/assets/ImageTwo.jpg', alt: 'Students learning' },
          { src: '/assets/ImageThree.jpg', alt: 'Classroom activities' },
        ]}
      />
      <EducationalPhilosophySection />
      <ContinuitySection />
      <ImageGridShowcase
        images={[
          { src: '/assets/ImageFour.jpg', alt: 'Children developing skills' },
          { src: '/assets/ImageFive.jpg', alt: 'School community' },
        ]}
      />
      <CoCreationSection />
      <DonationsSection />
    </div>
  );
}
