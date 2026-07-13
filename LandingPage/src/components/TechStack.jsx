import React from 'react';

export default function TechStack() {
  const stack = [
    {
      name: "Expo / React Native",
      role: "Cross-platform mobile client",
      slug: "expo"
    },
    {
      name: "Node.js / Express",
      role: "Backend orchestration API",
      slug: "nodedotjs"
    },
    {
      name: "Neo4j AuraDB",
      role: "Interconnected journey graph",
      slug: "neo4j"
    },
    {
      name: "Gemini 2.5 Flash",
      role: "AI reasoning & validation",
      slug: "googlegemini"
    },
    {
      name: "Groq (LLaMA 3.3)",
      role: "Conversational text parsing",
      logoUrl: "/groq.svg",
      isExternal: true,
      customStyle: { height: '24px', margin: '7px auto 19px', display: 'block' } // Groq logo has wider dimensions, styled to fit
    },
    {
      name: "Sarvam AI",
      role: "Multilingual speech engine",
      logoUrl: "https://www.sarvam.ai/favicon.svg",
      isExternal: true,
      customStyle: { filter: 'brightness(0) saturate(100%) invert(79%) sepia(35%) saturate(718%) hue-rotate(118deg) brightness(95%) contrast(90%)', width: '38px', height: '38px', objectFit: 'contain', marginBottom: '12px' }
    },
    {
      name: "Clerk",
      role: "Auth & Identity sessions",
      slug: "clerk"
    },
    {
      name: "Upstash Redis",
      role: "Rate limits & onboarding cache",
      slug: "upstash"
    },
    {
      name: "Cloudinary",
      role: "Credential upload storage",
      slug: "cloudinary"
    }
  ];

  return (
    <section className="section" id="tech-stack">
      <div className="section-header">
        <h2 className="section-title">Technology <span className="accent">Stack</span></h2>
        <p className="section-subtitle">
          The engineering toolkit powering conversational parsing, vector embedding searches, and semantic graph database traversals.
        </p>
      </div>

      <div className="tech-grid">
        {stack.map((item, idx) => (
          <div key={idx} className="tech-item">
            {item.isExternal ? (
              <img
                src={item.logoUrl}
                alt={item.name}
                style={item.customStyle || { width: '38px', height: '38px', objectFit: 'contain', marginBottom: '12px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <img
                src={`https://cdn.simpleicons.org/${item.slug}/54D6C2`}
                alt={item.name}
                style={{ width: '38px', height: '38px', objectFit: 'contain', marginBottom: '12px' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <h4 className="tech-name">{item.name}</h4>
            <p className="tech-role">{item.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
