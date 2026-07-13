import React from 'react';

export default function TeamSection() {
  const members = [
    {
      initials: "MN",
      name: "Mithul N",
      linkedin: "https://www.linkedin.com/in/mithul-nama/"
    },
    {
      initials: "RK",
      name: "Rohita Kotra",
      linkedin: "https://www.linkedin.com/in/rohita-kotra-980734327/"
    },
    {
      initials: "RS",
      name: "Rohinth S",
      linkedin: "https://www.linkedin.com/in/srohinth/"
    }
  ];

  return (
    <section className="section" id="team-section">
      <div className="section-header">
        <h2 className="section-title">Meet the <span className="accent">Team</span></h2>
        <p className="section-subtitle">
          The developers, designers, and AI engineers behind the PathFinder platform project built for HackHazards 2026.
        </p>
      </div>

      <div className="team-grid">
        {members.map((m, idx) => (
          <a
            key={idx}
            href={m.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="team-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <div className="team-avatar" style={{
              fontSize: '14px',
              fontFamily: 'var(--mono)',
              fontWeight: 'bold',
              color: 'var(--mint)',
              border: '1px solid rgba(84, 214, 194, 0.25)',
              background: 'rgba(84, 214, 194, 0.03)',
              marginBottom: '16px'
            }}>
              {m.initials}
            </div>
            <h4 className="team-name" style={{ marginBottom: '0' }}>{m.name}</h4>
          </a>
        ))}
      </div>
    </section>
  );
}
