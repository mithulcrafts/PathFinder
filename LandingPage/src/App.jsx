import React, { useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroContent from './components/HeroContent';
import PhoneMockup from './components/PhoneMockup';
import NetworkBackground from './components/NetworkBackground';
import QuickStart from './components/QuickStart';
import AboutSection from './components/AboutSection';
import ProblemSection from './components/ProblemSection';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import TryPlatform from './components/TryPlatform';
import TechStack from './components/TechStack';
import Resources from './components/Resources';
import TeamSection from './components/TeamSection';
import Footer from './components/Footer';

function App() {
  const appRef = useRef(null);

  const handleMouseMove = (e) => {
    const app = appRef.current;
    if (!app) return;
    app.style.setProperty('--mx', `${e.clientX}px`);
    app.style.setProperty('--my', `${e.clientY}px`);
  };

  // Intersection Observer for scroll-driven animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      {
        threshold: 0.05, // Trigger as soon as 5% of the section is visible
        rootMargin: '0px 0px -60px 0px' // Offset to trigger slightly before entering
      }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <main className="app-container" ref={appRef} onMouseMove={handleMouseMove}>
      {/* Dynamic Animated Node/Edge network background rendered globally */}
      <NetworkBackground />

      {/* Global cursor-tracking spotlight glow */}
      <div className="bg-spotlight" id="spotlight"></div>

      {/* Hero Section - Preserved exactly as it is */}
      <section className="hero" id="hero">


        {/* Decorative background visual overlays */}
        <div className="bg-vignette"></div>

        {/* Navbar with brand configurations */}
        <Navbar />

        {/* Primary Hero Text copy and buttons */}
        <HeroContent>
          {/* Mockup visualization overlay showing sample path and milestone */}
          <PhoneMockup />
        </HeroContent>
      </section>

      {/* Sections below Hero section wrapped in scroll reveal anim containers */}
      <div className="reveal-on-scroll"><QuickStart /></div>
      <div className="reveal-on-scroll"><AboutSection /></div>
      <div className="reveal-on-scroll"><ProblemSection /></div>
      <div className="reveal-on-scroll"><HowItWorks /></div>
      <div className="reveal-on-scroll"><Features /></div>
      <div className="reveal-on-scroll"><TryPlatform /></div>
      <div className="reveal-on-scroll"><TechStack /></div>
      <div className="reveal-on-scroll"><Resources /></div>
      <div className="reveal-on-scroll"><TeamSection /></div>
      <Footer />
    </main>
  );
}

export default App;
