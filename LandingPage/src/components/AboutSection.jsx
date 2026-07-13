import React from 'react';

export default function AboutSection() {
  const pillars = [
    {
      badge: "01 / TRUST",
      title: "Verifiable Credibility",
      desc: "No anonymous opinions or polished influencer highlights. Every milestone is anchored to uploaded credentials and GitHub histories verified by Gemini AI."
    },
    {
      badge: "02 / GRAPH",
      title: "Chronological Trajectories",
      desc: "Decisions, pivots, setbacks, and lateral moves are structured as interconnected nodes in a Neo4j graph, tracing exactly how real careers unfolded over time."
    },
    {
      badge: "03 / SEARCH",
      title: "Contextual Querying",
      desc: "Ask complex career questions using natural language. Query real paths to find individuals who have navigated your exact professional dilemmas."
    }
  ];

  return (
    <section className="section" id="about-pathfinder">
      <div className="section-header">
        <h2 className="section-title">Forget Opinions </h2>
        <h2 className="section-title"><span className="accent">Search Real Journeys</span> </h2>
        <p className="section-subtitle">
          Turning disconnected career advice into a structured, queryable knowledge map of human experience.
        </p>
      </div>

      <div style={{ maxWidth: '800px', textAlign: 'center', marginBottom: '56px' }}>
        <p style={{ fontSize: '18px', color: 'var(--ink-dim)', lineHeight: '1.75', fontWeight: '400', marginBottom: '24px' }}>
          Today, we make life-changing career decisions in the dark. We consult anonymous forums filled with conflicting advice, browse social platforms dominated by posturing, or read generic summaries from AI chatbots.
        </p>
        <p style={{ fontSize: '18px', color: 'var(--ink)', lineHeight: '1.75', fontWeight: '500' }}>
          PathFinder bridges this gap. By compiling verified resumes, skills, transitions, and milestones into an active graph, we enable you to explore real, evidence-backed paths taken by individuals who once stood exactly where you are today.
        </p>
        <div style={{
          marginTop: '36px',
          padding: '16px 28px',
          border: '1px solid rgba(84, 214, 194, 0.2)',
          background: 'rgba(84, 214, 194, 0.02)',
          borderRadius: '99px',
          fontFamily: 'var(--mono)',
          fontSize: '14px',
          letterSpacing: '0.04em',
          fontWeight: 'bold',
          color: 'var(--mint)',
          display: 'inline-block'
        }}>
          "The internet made information searchable. PathFinder makes human experience searchable."
        </div>
      </div>

      <div className="grid-layout">
        {pillars.map((pillar, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '32px' }}>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              fontWeight: 'bold',
              color: 'var(--mint)',
              marginBottom: '16px',
              letterSpacing: '0.08em'
            }}>
              {pillar.badge}
            </div>
            <h4 className="card-title" style={{ fontSize: '17px', marginBottom: '10px' }}>{pillar.title}</h4>
            <p className="card-desc" style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--ink-dim)' }}>{pillar.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
