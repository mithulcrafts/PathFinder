import React from 'react';
import { scrollToSection } from '../utils/navigation';

export default function Footer() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-brand">
          PathFinder
          <span>Real journeys. Shared experience.</span>
        </div>
        <div className="footer-links">
          <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')}>
            Home
          </a>
          <a href="#about-pathfinder" onClick={(e) => scrollToSection(e, 'about-pathfinder')}>
            About
          </a>
          <a href="#try-pathfinder" onClick={(e) => scrollToSection(e, 'try-pathfinder')}>
            Download
          </a>
          <a href="https://github.com/mithulcrafts/PathFinder" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
