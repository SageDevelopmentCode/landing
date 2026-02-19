import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import WhatWeOfferSection from './components/WhatWeOfferSection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <WelcomeSection />
      <WhatWeOfferSection />
    </div>
  );
}
