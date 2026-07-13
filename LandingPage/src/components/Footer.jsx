import React from 'react';

export default function Footer() {
  const handleScrollClick = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer>
      <div className="footer-content">
        <div className="footer-brand">
          PathFinder
          <span>Built for HackHazards 2026</span>
        </div>
        <div className="footer-links">
          <a href="#hero" onClick={(e) => handleScrollClick(e, 'hero')}>
            Home
          </a>
          <a href="#about-pathfinder" onClick={(e) => handleScrollClick(e, 'about-pathfinder')}>
            About
          </a>
          <a href="#try-pathfinder" onClick={(e) => handleScrollClick(e, 'try-pathfinder')}>
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
