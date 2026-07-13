import React from 'react';

export default function HeroContent({
  title = <>Search experiences.<br />Not <span className="accent">opinions</span>.</>,
  subtext = "PathFinder turns real career journeys into a searchable knowledge graph — so you can find people who've faced your exact decision, and see what happened next.",
  primaryCta = { label: "Try PathFinder ↗", href: "#try-pathfinder" },
  secondaryCta = { label: "Watch demo", href: "https://www.youtube.com/watch?v=cFn0jj-MVC8" },
  children
}) {
  const handleDownloadClick = (e) => {
    e.preventDefault();
    const el = document.getElementById('try-pathfinder');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="content">
      <h1>{title}</h1>
      <p className="subtext">{subtext}</p>
      <div className="ctas">
        <a href={primaryCta.href} className="btn-primary" onClick={handleDownloadClick}>
          {primaryCta.label}
        </a>
        <a href={secondaryCta.href} className="btn-secondary" target="_blank" rel="noopener noreferrer">
          <span className="play-ic">▶</span>
          {secondaryCta.label}
        </a>
      </div>
      {children}
    </div>
  );
}
